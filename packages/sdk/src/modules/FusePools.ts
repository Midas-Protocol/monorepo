import { BigNumber, BigNumberish, Contract, utils } from "ethers";

import { CErc20Delegate } from "../../lib/contracts/typechain/CErc20Delegate";
import { CErc20PluginDelegate } from "../../lib/contracts/typechain/CErc20PluginDelegate";
import { CErc20PluginRewardsDelegate } from "../../lib/contracts/typechain/CErc20PluginRewardsDelegate";
import { FusePoolDirectory } from "../../lib/contracts/typechain/FusePoolDirectory";
import { FusePoolLens } from "../../lib/contracts/typechain/FusePoolLens";
import { ERC20Abi } from "../../src";
import { filterOnlyObjectProperties, filterPoolName } from "../Fuse/utils";
import { FuseBaseConstructor, FusePoolData, NativePricedFuseAsset } from "../types";

export type LensPoolsWithData = [
  ids: BigNumberish[],
  fusePools: FusePoolDirectory.FusePoolStructOutput[],
  fusePoolsData: FusePoolLens.FusePoolDataStructOutput[],
  errors: boolean[]
];

export function withFusePools<TBase extends FuseBaseConstructor>(Base: TBase) {
  return class FusePools extends Base {
    async fetchFusePoolData(poolId: string, address?: string): Promise<FusePoolData> {
      const {
        comptroller,
        name: _unfiliteredName,
        creator,
        blockPosted,
        timestampPosted,
      } = await this.contracts.FusePoolDirectory.pools(Number(poolId));
      const signer = this.provider.getSigner();

      const signrerAddr = await signer.getAddress();
      console.log(comptroller);

      const comptrollerContract = new Contract(comptroller, this.chainDeployment.Comptroller.abi, signer);

      const mpo = new Contract(
        await comptrollerContract.callStatic.oracle(),
        this.chainDeployment.MasterPriceOracle.abi,
        signer
      );

      const rawData = await this.contracts.FusePoolLens.callStatic.getPoolSummary(comptroller);
      console.log(rawData);
      const mkts = await comptrollerContract.callStatic.getAllMarkets();

      const underlyingTokens = rawData[2];
      const underlyingSymbols = rawData[3];
      const whitelistedAdmin = rawData[4];

      console.log(underlyingTokens, "underlyingTokens");
      for (const [i, t] of underlyingTokens.entries()) {
        console.log("using ", t, "ctoken", mkts[i]);
        console.log("Oracle price: ", utils.formatEther(await mpo.callStatic.getUnderlyingPrice(mkts[i])));
        console.log("Is Listed: ", await comptrollerContract.callStatic.markets(mkts[i]));
        console.log("Is Member: ", await comptrollerContract.callStatic.checkMembership(signrerAddr, mkts[i]));
        console.log("borrowGuardianPaused: ", await comptrollerContract.callStatic.borrowGuardianPaused(mkts[i]));
        const erc20 = new Contract(t, ERC20Abi, signer);
        const cErc20 = new Contract(mkts[i], this.chainDeployment.CErc20Delegate.abi, signer) as CErc20Delegate;
        const underlyingAddress = await erc20.callStatic.underlying();
        console.log("underlyingAddress: ", underlyingAddress);
        console.log(await erc20.decimals());
        console.log(await erc20.balanceOf(signrerAddr));
        console.log(await erc20.callStatic.name());
        console.log(await erc20.callStatic.symbol());
        console.log(await erc20.callStatic.isCEther());
        console.log(await erc20.callStatic.decimals());
        console.log(await erc20.callStatic.balanceOf(signrerAddr));
        console.log(await cErc20.callStatic.supplyRatePerBlock());
        console.log(await cErc20.callStatic.borrowRatePerBlock());
        console.log(await cErc20.callStatic.getCash());
        console.log(await cErc20.callStatic.totalBorrowsCurrent());
        console.log(await cErc20.callStatic.totalReserves());
        console.log(await cErc20.callStatic.totalAdminFees());
        console.log(await cErc20.callStatic.totalFuseFees());
        console.log(await cErc20.callStatic.balanceOfUnderlying(signrerAddr));
        console.log(await cErc20.callStatic.borrowBalanceStored(signrerAddr));
        console.log(await cErc20.callStatic.exchangeRateStored());
        console.log(await cErc20.callStatic.exchangeRateStored());
        console.log(await cErc20.callStatic.reserveFactorMantissa());
        console.log(await cErc20.callStatic.adminFeeMantissa());
        console.log(await cErc20.callStatic.fuseFeeMantissa());

        console.log(await mpo.callStatic.oracles(t));
      }

      const name = filterPoolName(_unfiliteredName);

      const assets: NativePricedFuseAsset[] = (
        await this.contracts.FusePoolLens.callStatic.getPoolAssetsWithData(comptroller, {
          from: address,
        })
      ).map(filterOnlyObjectProperties);

      console.log("HERE???????????");
      let totalLiquidityNative = 0;
      let totalSupplyBalanceNative = 0;
      let totalBorrowBalanceNative = 0;
      let totalSuppliedNative = 0;
      let totalBorrowedNative = 0;

      const promises: Promise<any>[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        // @todo aggregate the borrow/supply guardian paused into 1
        promises.push(
          comptrollerContract.callStatic
            .borrowGuardianPaused(asset.cToken)
            .then((isPaused: boolean) => (asset.isBorrowPaused = isPaused))
        );
        promises.push(
          comptrollerContract.callStatic
            .mintGuardianPaused(asset.cToken)
            .then((isPaused: boolean) => (asset.isSupplyPaused = isPaused))
        );
        promises.push(
          this.getAssetInstance<CErc20PluginDelegate>(asset.cToken, "CErc20PluginDelegate")
            .callStatic.plugin()
            .then((plugin) => (asset.plugin = plugin))
            .catch(() =>
              // @ts-ignore
              this.getAssetInstance<CErc20PluginRewardsDelegate>(
                asset.cToken,
                "CErc20PluginRewardsDelegate"
              ).callStatic.plugin()
            )
            .then((plugin) => (asset.plugin = plugin))
            .catch(() => {})
        );

        asset.supplyBalanceNative =
          Number(utils.formatUnits(asset.supplyBalance)) * Number(utils.formatUnits(asset.underlyingPrice));

        asset.borrowBalanceNative =
          Number(utils.formatUnits(asset.borrowBalance)) * Number(utils.formatUnits(asset.underlyingPrice));

        totalSupplyBalanceNative += asset.supplyBalanceNative;
        totalBorrowBalanceNative += asset.borrowBalanceNative;

        asset.totalSupplyNative =
          Number(utils.formatUnits(asset.totalSupply)) * Number(utils.formatUnits(asset.underlyingPrice));
        asset.totalBorrowNative =
          Number(utils.formatUnits(asset.totalBorrow)) * Number(utils.formatUnits(asset.underlyingPrice));

        totalSuppliedNative += asset.totalSupplyNative;
        totalBorrowedNative += asset.totalBorrowNative;

        asset.liquidityNative =
          Number(utils.formatUnits(asset.liquidity)) * Number(utils.formatUnits(asset.underlyingPrice));

        totalLiquidityNative += asset.liquidityNative;
      }

      await Promise.all(promises);

      return {
        id: Number(poolId),
        assets: assets.sort((a, b) => (b.liquidityNative > a.liquidityNative ? 1 : -1)),
        creator,
        comptroller,
        name,
        totalLiquidityNative,
        totalSuppliedNative,
        totalBorrowedNative,
        totalSupplyBalanceNative,
        totalBorrowBalanceNative,
        blockPosted,
        timestampPosted,
        underlyingTokens,
        underlyingSymbols,
        whitelistedAdmin,
      };
    }

    async fetchPoolsManual({
      verification,
      options,
    }: {
      verification: boolean;
      options: { from: string };
    }): Promise<(FusePoolData | null)[] | undefined> {
      const fusePoolsDirectoryResult = await this.contracts.FusePoolDirectory.callStatic.getPublicPoolsByVerification(
        verification,
        {
          from: options.from,
        }
      );
      let poolIds: string[] = (fusePoolsDirectoryResult[0] ?? []).map((bn: BigNumber) => bn.toString());

      // TODO: fix this shit later
      poolIds = poolIds.filter((id) => this.chainId !== 97 || (this.chainId === 97 && id !== "3"));

      if (!poolIds.length) {
        return undefined;
      }

      const poolData = await Promise.all(
        poolIds.map((_id, i) => {
          return this.fetchFusePoolData(_id, options.from);
        })
      );

      return poolData;
    }

    async fetchPools({
      filter,
      options,
    }: {
      filter: string | null;
      options: { from: string };
    }): Promise<FusePoolData[]> {
      const isCreatedPools = filter === "created-pools";
      const isVerifiedPools = filter === "verified-pools";
      const isUnverifiedPools = filter === "unverified-pools";

      const req = isCreatedPools
        ? this.contracts.FusePoolLens.callStatic.getPoolsByAccountWithData(options.from)
        : isVerifiedPools
        ? this.contracts.FusePoolLens.callStatic.getPublicPoolsByVerificationWithData(true)
        : isUnverifiedPools
        ? this.contracts.FusePoolLens.callStatic.getPublicPoolsByVerificationWithData(false)
        : this.contracts.FusePoolLens.callStatic.getPublicPoolsWithData();

      const whitelistedPoolsRequest = this.contracts.FusePoolLens.callStatic.getWhitelistedPoolsByAccountWithData(
        options.from
      );

      const responses = await Promise.all([req, whitelistedPoolsRequest]);

      const [pools, whitelistedPools] = await Promise.all(
        responses.map(async (poolData) => {
          return await Promise.all(
            poolData[0].map((_id) => {
              return this.fetchFusePoolData(_id.toString(), options.from);
            })
          );
        })
      );

      const whitelistedIds = whitelistedPools.map((pool) => pool?.id);
      const filteredPools = pools.filter((pool) => !whitelistedIds.includes(pool?.id));

      return [...filteredPools, ...whitelistedPools];
    }

    getAssetInstance = <T extends CErc20Delegate = CErc20Delegate>(
      address: string,
      implementation: "CErc20Delegate" | "CErc20PluginDelegate" | "CErc20PluginRewardsDelegate" = "CErc20Delegate"
    ): T => {
      switch (implementation) {
        case "CErc20PluginDelegate":
          return new Contract(address, this.chainDeployment[implementation].abi, this.provider) as T;
        case "CErc20PluginRewardsDelegate":
          return new Contract(address, this.chainDeployment[implementation].abi, this.provider) as T;
        default:
          return new Contract(address, this.chainDeployment[implementation].abi, this.provider) as T;
      }
    };
  };
}
