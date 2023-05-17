import {
  arbitrum,
  basegoerli,
  bsc,
  chapel,
  ethereum,
  evmos,
  fantom,
  ganache,
  moonbeam,
  neondevnet,
  polygon,
} from "@midas-capital/chains";
import {
  ChainSupportedAssets as ChainSupportedAssetsType,
  FusePoolData,
  NativePricedFuseAsset,
  SupportedAsset,
  SupportedChains,
} from "@midas-capital/types";
import { formatUnits, getAddress } from "viem";

import { MidasBaseConstructor } from "..";
import FusePoolDirectoryABI from "../../abis/FusePoolDirectory";
import FusePoolLensABI from "../../abis/FusePoolLens";
import { AddressZero } from "../MidasSdk/constants";
import { filterOnlyObjectProperties, filterPoolName } from "../MidasSdk/utils";

export const ChainSupportedAssets: ChainSupportedAssetsType = {
  [SupportedChains.bsc]: bsc.assets,
  [SupportedChains.polygon]: polygon.assets,
  [SupportedChains.ganache]: ganache.assets,
  [SupportedChains.evmos]: evmos.assets,
  [SupportedChains.chapel]: chapel.assets,
  [SupportedChains.moonbeam]: moonbeam.assets,
  [SupportedChains.neon_devnet]: neondevnet.assets,
  [SupportedChains.arbitrum]: arbitrum.assets,
  [SupportedChains.fantom]: fantom.assets,
  [SupportedChains.basegoerli]: basegoerli.assets,
  [SupportedChains.ethereum]: ethereum.assets,
};

export function withFusePools<TBase extends MidasBaseConstructor>(Base: TBase) {
  return class FusePools extends Base {
    async fetchFusePoolData(poolId: string): Promise<FusePoolData | null> {
      const [_unfiliteredName, creator, comptroller, blockPosted, timestampPosted] =
        await this.publicClient.readContract({
          address: getAddress(this.chainDeployment.FusePoolDirectory.address),
          abi: FusePoolDirectoryABI,
          functionName: "pools",
          args: [BigInt(poolId)],
        });

      if (comptroller === AddressZero) {
        return null;
      }
      const name = filterPoolName(_unfiliteredName);

      const { result } = await this.publicClient.simulateContract({
        address: getAddress(this.chainDeployment.FusePoolLens.address),
        abi: FusePoolLensABI,
        functionName: "getPoolAssetsWithData",
        args: [comptroller],
      });

      const assets: NativePricedFuseAsset[] = result.map(filterOnlyObjectProperties);

      let totalLiquidityNative = 0;
      let totalAvailableLiquidityNative = 0;
      let totalSupplyBalanceNative = 0;
      let totalBorrowBalanceNative = 0;
      let totalSuppliedNative = 0;
      let totalBorrowedNative = 0;
      let suppliedForUtilization = 0;
      let borrowedForUtilization = 0;
      let utilization = 0;

      const promises: Promise<any>[] = [];

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];

        asset.isBorrowPaused = asset.borrowGuardianPaused;
        asset.isSupplyPaused = asset.mintGuardianPaused;
        asset.plugin = this.marketToPlugin[asset.cToken];

        const _asset = ChainSupportedAssets[this.chainId as SupportedChains].find(
          (ass) => ass.underlying === asset.underlyingToken
        );

        if (_asset) {
          asset.underlyingSymbol = _asset.symbol;
          asset.logoUrl = "https://d1912tcoux65lj.cloudfront.net/token/96x96/" + _asset.symbol.toLowerCase() + ".png";
          asset.originalSymbol = _asset.originalSymbol ? _asset.originalSymbol : undefined;
        }

        asset.supplyBalanceNative =
          Number(formatUnits(asset.supplyBalance, Number(asset.underlyingDecimals))) *
          Number(formatUnits(asset.underlyingPrice, 18));

        asset.borrowBalanceNative =
          Number(formatUnits(asset.borrowBalance, Number(asset.underlyingDecimals))) *
          Number(formatUnits(asset.underlyingPrice, 18));

        totalSupplyBalanceNative += asset.supplyBalanceNative;
        totalBorrowBalanceNative += asset.borrowBalanceNative;

        asset.totalSupplyNative =
          Number(formatUnits(asset.totalSupply, Number(asset.underlyingDecimals))) *
          Number(formatUnits(asset.underlyingPrice, 18));
        asset.totalBorrowNative =
          Number(formatUnits(asset.totalBorrow, Number(asset.underlyingDecimals))) *
          Number(formatUnits(asset.underlyingPrice, 18));

        if (asset.totalSupplyNative === 0) {
          asset.utilization = 0;
        } else {
          asset.utilization = (asset.totalBorrowNative / asset.totalSupplyNative) * 100;
        }

        totalSuppliedNative += asset.totalSupplyNative;
        totalBorrowedNative += asset.totalBorrowNative;

        const assetLiquidityNative =
          Number(formatUnits(asset.liquidity, Number(asset.underlyingDecimals))) *
          Number(formatUnits(asset.underlyingPrice, 18));
        asset.liquidityNative = assetLiquidityNative;

        totalAvailableLiquidityNative += asset.isBorrowPaused ? 0 : assetLiquidityNative;
        totalLiquidityNative += asset.liquidityNative;

        if (!asset.isBorrowPaused) {
          suppliedForUtilization += asset.totalSupplyNative;
          borrowedForUtilization += asset.totalBorrowNative;
        }

        const supportedAsset = this.supportedAssets.find(
          (_asset: SupportedAsset) => _asset.underlying === asset.underlyingToken
        );

        asset.extraDocs = supportedAsset ? supportedAsset.extraDocs : "";
      }

      if (suppliedForUtilization !== 0) {
        utilization = (borrowedForUtilization / suppliedForUtilization) * 100;
      }

      await Promise.all(promises);

      // Sort array by liquidity, array is mutated in place with .sort()
      assets.sort((a, b) => b.liquidityNative - a.liquidityNative);
      return {
        id: Number(poolId),
        chainId: this.chainId,
        assets,
        creator,
        comptroller,
        name,
        totalLiquidityNative,
        totalAvailableLiquidityNative,
        totalSuppliedNative,
        totalBorrowedNative,
        totalSupplyBalanceNative,
        totalBorrowBalanceNative,
        blockPosted,
        timestampPosted,
        underlyingTokens: assets.map((a) => a.underlyingToken),
        underlyingSymbols: assets.map((a) => a.underlyingSymbol),
        utilization,
      };
    }

    async fetchPoolsManual(): Promise<(FusePoolData | null)[] | undefined> {
      const [poolIndexes, pools] = await this.publicClient.readContract({
        address: getAddress(this.chainDeployment.FusePoolDirectory.address),
        abi: FusePoolDirectoryABI,
        functionName: "getActivePools",
      });

      if (!pools.length || !poolIndexes.length) {
        return undefined;
      }

      const poolData = await Promise.all(
        poolIndexes.map((poolId) => {
          return this.fetchFusePoolData(poolId.toString()).catch((error) => {
            this.logger.error(`Pool ID ${poolId} wasn't able to be fetched from FusePoolLens without error.`, error);
            return null;
          });
        })
      );

      return poolData.filter((p) => !!p);
    }
  };
}
