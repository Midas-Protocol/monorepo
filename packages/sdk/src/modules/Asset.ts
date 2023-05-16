import { TransactionReceipt } from "@ethersproject/abstract-provider";
import { FundOperationMode, MarketConfig, NativePricedFuseAsset } from "@midas-capital/types";
import { BigNumber, constants, ethers, utils } from "ethers";
import { encodeAbiParameters, getAddress, parseAbiParameters, parseEther } from "viem";

import CErc20DelegatorArtifact from "../../artifacts/CErc20Delegator.json";
import { COMPTROLLER_ERROR_CODES } from "../MidasSdk/config";
import { WeiPerEther } from "../MidasSdk/constants";

import { withCreateContracts } from "./CreateContracts";
import { withFlywheel } from "./Flywheel";

type FuseBaseConstructorWithModules = ReturnType<typeof withCreateContracts> & ReturnType<typeof withFlywheel>;

export function withAsset<TBase extends FuseBaseConstructorWithModules>(Base: TBase) {
  return class PoolAsset extends Base {
    public COMPTROLLER_ERROR_CODES: Array<string> = COMPTROLLER_ERROR_CODES;

    async deployAsset(config: MarketConfig): Promise<[string, string, TransactionReceipt]> {
      //1. Validate configuration
      await this.#validateConfiguration(config);

      //2. Deploy new asset to existing pool via SDK
      try {
        const [assetAddress, implementationAddress, receipt] = await this.#deployMarket(config);

        return [assetAddress, implementationAddress, receipt];
      } catch (error) {
        this.logger.error(`deployAsset raw error:  ${error} using MarketConfig: ${JSON.stringify(config)}`);
        throw Error("Deployment of asset to Fuse pool failed: " + (error instanceof Error ? error.message : error));
      }
    }

    async #validateConfiguration(config: MarketConfig) {
      // BigNumbers
      // 10% -> 0.1 * 1e18
      const reserveFactorBN = utils.parseEther((config.reserveFactor / 100).toString());
      // 5% -> 0.05 * 1e18
      const adminFeeBN = utils.parseEther((config.adminFee / 100).toString());
      // 50% -> 0.5 * 1e18
      // TODO: find out if this is a number or string. If its a number, parseEther will not work. Also parse Units works if number is between 0 - 0.9
      const collateralFactorBN = utils.parseEther((config.collateralFactor / 100).toString());
      // Check collateral factor
      if (!collateralFactorBN.gte(BigInt(0)) || collateralFactorBN.gt(utils.parseEther("0.9")))
        throw Error("Collateral factor must range from 0 to 0.9.");

      // Check reserve factor + admin fee + Fuse fee
      if (!reserveFactorBN.gte(BigInt(0))) throw Error("Reserve factor cannot be negative.");
      if (!adminFeeBN.gte(BigInt(0))) throw Error("Admin fee cannot be negative.");

      // If reserveFactor or adminFee is greater than zero, we get fuse fee.
      // Sum of reserveFactor and adminFee should not be greater than fuse fee. ? i think
      if (reserveFactorBN.gt(BigInt(0)) || adminFeeBN.gt(BigInt(0))) {
        const fuseFee = await this.contracts.FuseFeeDistributor.interestFeeRate();
        if (reserveFactorBN.add(adminFeeBN).add(BigNumber.from(fuseFee)).gt(constants.WeiPerEther))
          throw Error(
            "Sum of reserve factor and admin fee should range from 0 to " + (1 - fuseFee.div(1e18).toNumber()) + "."
          );
      }
    }

    async #deployMarket(config: MarketConfig): Promise<[string, string, TransactionReceipt]> {
      const reserveFactor = parseEther(`${config.reserveFactor / 100}`);
      const adminFee = parseEther(`${config.adminFee / 100}`);
      const collateralFactor = parseEther(`${config.collateralFactor / 100}`);

      const comptroller = this.createComptroller(config.comptroller);

      // Use Default CErc20Delegate
      const implementationAddress = getAddress(this.chainDeployment.CErc20Delegate.address);
      const implementationData = "0x00";

      // Prepare Transaction Data
      const deployArgs = [
        config.underlying,
        config.comptroller,
        config.fuseFeeDistributor,
        config.interestRateModel,
        config.name,
        config.symbol,
        implementationAddress,
        implementationData,
        reserveFactor,
        adminFee,
      ];

      const constructorData = encodeAbiParameters(
        parseAbiParameters("address,address,address,address,string,string,address,bytes,uint256,uint256"),
        deployArgs
      );

      // Test Transaction
      const sim = await comptroller.simulate._deployMarket([false, constructorData, collateralFactor]);

      if (sim.result !== BigInt(0)) {
        throw `Unable to _deployMarket: ${this.COMPTROLLER_ERROR_CODES[Number(sim.result)]}`;
      }

      // Make actual Transaction
      const tx = await comptroller.write._deployMarket([false, constructorData, collateralFactor]);
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash: tx });
      // Recreate Address of Deployed Market
      if (receipt.status != "success") {
        throw "Failed to deploy market ";
      }
      const marketCounter = await this.contracts.FuseFeeDistributor.callStatic.marketsCounter();

      const saltsHash = utils.solidityKeccak256(
        ["address", "address", "uint"],
        [config.comptroller, config.underlying, marketCounter]
      );
      const byteCodeHash = utils.keccak256(CErc20DelegatorArtifact.bytecode.object + constructorData.substring(2));
      const cErc20DelegatorAddress = utils.getCreate2Address(
        this.chainDeployment.FuseFeeDistributor.address,
        saltsHash,
        byteCodeHash
      );

      // Return cToken proxy and implementation contract addresses
      return [cErc20DelegatorAddress, implementationAddress, receipt];
    }

    async getUpdatedAssets(mode: FundOperationMode, index: number, assets: NativePricedFuseAsset[], amount: bigint) {
      const assetToBeUpdated = assets[index];
      const interestRateModel = await this.getInterestRateModel(assetToBeUpdated.cToken);

      let updatedAsset: NativePricedFuseAsset;

      if (mode === FundOperationMode.SUPPLY) {
        const supplyBalance = assetToBeUpdated.supplyBalance + amount;
        const totalSupply = assetToBeUpdated.totalSupply + amount;
        updatedAsset = {
          ...assetToBeUpdated,
          supplyBalance,
          totalSupply,
          supplyBalanceNative:
            Number(utils.formatUnits(supplyBalance, assetToBeUpdated.underlyingDecimals)) *
            Number(utils.formatUnits(assetToBeUpdated.underlyingPrice, 18)),
          supplyRatePerBlock: interestRateModel.getSupplyRate(
            totalSupply > BigInt(0) ? (assetToBeUpdated.totalBorrow * WeiPerEther) / totalSupply : BigInt(0)
          ),
        };
      } else if (mode === FundOperationMode.WITHDRAW) {
        const supplyBalance = assetToBeUpdated.supplyBalance - amount;
        const totalSupply = assetToBeUpdated.totalSupply - amount;
        updatedAsset = {
          ...assetToBeUpdated,
          supplyBalance,
          totalSupply,
          supplyBalanceNative:
            Number(utils.formatUnits(supplyBalance, assetToBeUpdated.underlyingDecimals)) *
            Number(utils.formatUnits(assetToBeUpdated.underlyingPrice, 18)),
          supplyRatePerBlock: interestRateModel.getSupplyRate(
            totalSupply > BigInt(0) ? (assetToBeUpdated.totalBorrow * WeiPerEther) / totalSupply : BigInt(0)
          ),
        };
      } else if (mode === FundOperationMode.BORROW) {
        const borrowBalance = assetToBeUpdated.borrowBalance + amount;
        const totalBorrow = assetToBeUpdated.totalBorrow + amount;
        updatedAsset = {
          ...assetToBeUpdated,
          borrowBalance,
          totalBorrow,
          borrowBalanceNative:
            Number(utils.formatUnits(borrowBalance, assetToBeUpdated.underlyingDecimals)) *
            Number(utils.formatUnits(assetToBeUpdated.underlyingPrice, 18)),
          borrowRatePerBlock: interestRateModel.getBorrowRate(
            assetToBeUpdated.totalSupply > BigInt(0)
              ? (totalBorrow * WeiPerEther) / assetToBeUpdated.totalSupply
              : BigInt(0)
          ),
        };
      } else if (mode === FundOperationMode.REPAY) {
        const borrowBalance = assetToBeUpdated.borrowBalance - amount;
        const totalBorrow = assetToBeUpdated.totalBorrow - amount;
        const borrowRatePerBlock = interestRateModel.getBorrowRate(
          assetToBeUpdated.totalSupply > BigInt(0)
            ? (totalBorrow * WeiPerEther) / assetToBeUpdated.totalSupply
            : BigInt(0)
        );

        updatedAsset = {
          ...assetToBeUpdated,
          borrowBalance,
          totalBorrow,
          borrowBalanceNative:
            Number(utils.formatUnits(borrowBalance, assetToBeUpdated.underlyingDecimals)) *
            Number(utils.formatUnits(assetToBeUpdated.underlyingPrice, 18)),
          borrowRatePerBlock,
        };
      }

      return assets.map((value, _index) => {
        if (_index === index) {
          return updatedAsset;
        } else {
          return value;
        }
      });
    }
  };
}
