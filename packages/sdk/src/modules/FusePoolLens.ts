import { chainIdToConfig } from "@midas-capital/chains";
import { SupportedAsset } from "@midas-capital/types";
import { getAddress } from "viem";

import { MidasBaseConstructor } from "..";
import FusePoolDirectoryABI from "../../abis/FusePoolDirectory";
import FusePoolLensABI from "../../abis/FusePoolLens";

export function withFusePoolLens<TBase extends MidasBaseConstructor>(Base: TBase) {
  return class FusePoolLens extends Base {
    /**
     * @returns the TVL on current chain in native asset value
     */
    async getTotalValueLocked(whitelistedAdmin = true) {
      const {
        result: { 2: fusePoolDataStructs },
      } = await this.publicClient.simulateContract({
        address: getAddress(this.chainDeployment.FusePoolLens.address),
        abi: FusePoolLensABI,
        functionName: "getPublicPoolsByVerificationWithData",
        args: [whitelistedAdmin],
      });

      return fusePoolDataStructs.map((data) => data.totalSupply).reduce((prev, cur) => prev + cur, BigInt(0));
    }
    /**
     * @returns a set of the currently live assets on our platform on the current chain
     */
    async getLiveAssets(): Promise<Set<SupportedAsset>> {
      const pools = await this.publicClient.readContract({
        address: getAddress(this.chainDeployment.FusePoolDirectory.address),
        abi: FusePoolDirectoryABI,
        functionName: "getAllPools",
      });

      const allAssets = new Set<SupportedAsset>();
      for (const pool of pools) {
        const {
          result: [, , ulTokens],
        } = await this.publicClient.simulateContract({
          address: getAddress(this.chainDeployment.FusePoolLens.address),
          abi: FusePoolLensABI,
          functionName: "getPoolSummary",
          args: [getAddress(pool.comptroller)],
        });

        for (const token of ulTokens) {
          const asset = chainIdToConfig[this.chainId].assets.find((x) => x.underlying === token);
          if (!asset) {
            throw new Error(`Asset not found for ${token}, this should never happen`);
          } else {
            allAssets.add(asset);
          }
        }
      }
      return allAssets;
    }
  };
}
