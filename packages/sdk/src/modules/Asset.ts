import { FundOperationMode, MarketConfig, NativePricedFuseAsset } from "@midas-capital/types";
import {
  encodeAbiParameters,
  encodePacked,
  formatUnits,
  getAddress,
  getContractAddress,
  keccak256,
  numberToHex,
  parseAbiParameters,
  parseEther,
  TransactionReceipt,
} from "viem";

import { MidasBaseConstructor } from "..";
import ComptrollerABI from "../../abis/Comptroller";
import FuseFeeDistributorABI from "../../abis/FuseFeeDistributor";
import CErc20DelegatorArtifact from "../../artifacts/CErc20Delegator.json";
import { COMPTROLLER_ERROR_CODES } from "../MidasSdk/config";
import { WeiPerEther } from "../MidasSdk/constants";

export function withAsset<TBase extends MidasBaseConstructor>(Base: TBase) {
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
      const reserveFactor = parseEther(`${config.reserveFactor / 100}`);
      // 5% -> 0.05 * 1e18
      const adminFee = parseEther(`${config.adminFee / 100}`);
      // 50% -> 0.5 * 1e18
      // TODO: find out if this is a number or string. If its a number, parseEther will not work. Also parse Units works if number is between 0 - 0.9
      const collateralFactor = parseEther(`${config.collateralFactor / 100}`);
      // Check collateral factor
      if (collateralFactor < BigInt(0) || collateralFactor > parseEther(`${0.9}`))
        throw Error("Collateral factor must range from 0 to 0.9.");

      // Check reserve factor + admin fee + Fuse fee
      if (reserveFactor < BigInt(0)) throw Error("Reserve factor cannot be negative.");
      if (adminFee < BigInt(0)) throw Error("Admin fee cannot be negative.");

      // If reserveFactor or adminFee is greater than zero, we get fuse fee.
      // Sum of reserveFactor and adminFee should not be greater than fuse fee. ? i think
      if (reserveFactor > BigInt(0) || adminFee > BigInt(0)) {
        const fuseFee = await this.publicClient.readContract({
          address: getAddress(this.chainDeployment.FuseFeeDistributor.address),
          abi: FuseFeeDistributorABI,
          functionName: "interestFeeRate",
        });
        if (reserveFactor + adminFee + fuseFee > WeiPerEther)
          throw Error(
            "Sum of reserve factor and admin fee should range from 0 to " + (1 - Number(fuseFee / WeiPerEther)) + "."
          );
      }
    }

    async #deployMarket(config: MarketConfig): Promise<[string, string, TransactionReceipt]> {
      const reserveFactor = parseEther(`${config.reserveFactor / 100}`);
      const adminFee = parseEther(`${config.adminFee / 100}`);
      const collateralFactor = parseEther(`${config.collateralFactor / 100}`);

      // Use Default CErc20Delegate
      const implementationAddress = getAddress(this.chainDeployment.CErc20Delegate.address);
      const implementationData = "0x00";

      // Prepare Transaction Data
      const constructorData = encodeAbiParameters(
        parseAbiParameters("address,address,address,address,string,string,address,bytes,uint256,uint256"),
        [
          getAddress(config.underlying),
          getAddress(config.comptroller),
          getAddress(config.fuseFeeDistributor),
          getAddress(config.interestRateModel),
          config.name,
          config.symbol,
          implementationAddress,
          numberToHex(BigInt(implementationData)),
          reserveFactor,
          adminFee,
        ]
      );

      // Test Transaction

      const { request, result } = await this.publicClient.simulateContract({
        address: getAddress(config.comptroller),
        abi: ComptrollerABI,
        functionName: "_deployMarket",
        account: this.account,
        args: [false, constructorData, collateralFactor],
      });

      if (result !== BigInt(0)) {
        throw `Unable to _deployMarket: ${this.COMPTROLLER_ERROR_CODES[Number(result)]}`;
      }

      // Make actual Transaction
      const tx = await this.walletClient.writeContract(request);
      const receipt: TransactionReceipt = await this.publicClient.waitForTransactionReceipt({ hash: tx });
      // Recreate Address of Deployed Market
      if (receipt.status != "success") {
        throw "Failed to deploy market ";
      }

      const marketsCounter = await this.publicClient.readContract({
        address: getAddress(this.chainDeployment.FuseFeeDistributor.address),
        abi: FuseFeeDistributorABI,
        functionName: "marketsCounter",
      });
      const saltsHash = keccak256(
        encodePacked(
          ["address", "address", "uint"],
          [getAddress(config.comptroller), getAddress(config.underlying), marketsCounter]
        )
      );
      const cErc20DelegatorAddress = getContractAddress({
        bytecode: numberToHex(BigInt(CErc20DelegatorArtifact.bytecode.object + constructorData.substring(2))),
        from: getAddress(this.chainDeployment.FuseFeeDistributor.address),
        opcode: "CREATE2",
        salt: saltsHash,
      });

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
            Number(formatUnits(supplyBalance, Number(assetToBeUpdated.underlyingDecimals))) *
            Number(formatUnits(assetToBeUpdated.underlyingPrice, 18)),
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
            Number(formatUnits(supplyBalance, Number(assetToBeUpdated.underlyingDecimals))) *
            Number(formatUnits(assetToBeUpdated.underlyingPrice, 18)),
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
            Number(formatUnits(borrowBalance, Number(assetToBeUpdated.underlyingDecimals))) *
            Number(formatUnits(assetToBeUpdated.underlyingPrice, 18)),
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
            Number(formatUnits(borrowBalance, Number(assetToBeUpdated.underlyingDecimals))) *
            Number(formatUnits(assetToBeUpdated.underlyingPrice, 18)),
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
