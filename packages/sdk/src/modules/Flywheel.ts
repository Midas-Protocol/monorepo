import { getAddress } from "viem";

import ComptrollerABI from "../../abis/Comptroller";
import ComptrollerFirstExtensionABI from "../../abis/ComptrollerFirstExtension";
import FlywheelStaticRewardsABI from "../../abis/FlywheelStaticRewards";
import FusePoolLensSecondaryABI from "../../abis/FusePoolLensSecondary";
import MidasFlywheelABI from "../../abis/MidasFlywheel";
import MidasFlywheelLensRouterABI from "../../abis/MidasFlywheelLensRouter";
import FlywheelStaticRewardsArtifact from "../../artifacts/FlywheelStaticRewards.json";
import MidasFlywheelArtifact from "../../artifacts/MidasFlywheel.json";
import { FlywheelStaticRewards } from "../../typechain/FlywheelStaticRewards";
import { MidasFlywheel } from "../../typechain/MidasFlywheel";
import { MidasFlywheelLensRouter } from "../../typechain/MidasFlywheelLensRouter";

import { CreateContractsModule } from "./CreateContracts";

export interface FlywheelClaimableRewards {
  flywheel: string;
  rewardToken: string;
  rewards: Array<{
    market: string;
    amount: bigint;
  }>;
}

export type FlywheelMarketRewardsInfo = {
  market: string;
  underlyingPrice?: bigint;
  rewardsInfo: {
    rewardToken: string;
    flywheel: string;
    rewardSpeedPerSecondPerToken?: bigint;
    rewardTokenPrice?: bigint;
    formattedAPR?: bigint;
  }[];
};

export function withFlywheel<TBase extends CreateContractsModule = CreateContractsModule>(Base: TBase) {
  return class Flywheel extends Base {
    /** READ */
    async getFlywheelMarketRewardsByPools(pools: string[]) {
      return Promise.all(pools.map((pool) => this.getFlywheelMarketRewardsByPool(pool)));
    }

    async getFlywheelMarketRewardsByPool(pool: string): Promise<FlywheelMarketRewardsInfo[]> {
      const [flywheelsOfPool, marketsOfPool] = await Promise.all([
        this.getFlywheelsByPool(pool),
        this.publicClient.readContract({
          address: getAddress(pool),
          abi: ComptrollerFirstExtensionABI,
          functionName: "getAllMarkets",
        }),
      ]);
      const strategiesOfFlywheels = await Promise.all(
        flywheelsOfPool.map(async (fwAddress) => {
          const fw = this.createMidasFlywheel(fwAddress);

          return await fw.read.getAllStrategies();
        })
      );

      const rewardTokens: string[] = [];
      const marketRewardsInfo = await Promise.all(
        marketsOfPool.map(async (market) => {
          const rewardsInfo = await Promise.all(
            flywheelsOfPool
              // Make sure this market is active in this flywheel
              .filter((_, fwIndex) => strategiesOfFlywheels[fwIndex].includes(market))
              // TODO also check marketState?
              .map(async (fwAddress) => {
                const fw = this.createMidasFlywheel(fwAddress);
                const rewardToken = await fw.read.rewardToken();
                rewardTokens.push(rewardToken);
                return {
                  rewardToken,
                  flywheel: fwAddress,
                };
              })
          );
          return {
            market,
            rewardsInfo,
          };
        })
      );

      return marketRewardsInfo;
    }

    async getFlywheelsByPool(poolAddress: string) {
      const allRewardDistributors = await this.publicClient.readContract({
        address: getAddress(poolAddress),
        abi: ComptrollerFirstExtensionABI,
        functionName: "getRewardsDistributors",
      });

      const filterList = await Promise.all(
        allRewardDistributors.map(async (address) => {
          return await this.publicClient.readContract({
            address: getAddress(address),
            abi: MidasFlywheelABI,
            functionName: "isFlywheel",
          });
        })
      );

      return allRewardDistributors.filter((_, index) => filterList[index]);
    }

    async getFlywheelRewardsInfos(flywheelAddress: string) {
      const [fwStaticAddress, enabledMarkets] = await Promise.all([
        this.publicClient.readContract({
          address: getAddress(flywheelAddress),
          abi: MidasFlywheelABI,
          functionName: "flywheelRewards",
        }),
        this.publicClient.readContract({
          address: getAddress(flywheelAddress),
          abi: MidasFlywheelABI,
          functionName: "getAllStrategies",
        }),
      ]);
      const rewardsInfos: Record<string, any> = {};
      await Promise.all(
        enabledMarkets.map(async (m) => {
          rewardsInfos[m] = await this.publicClient.readContract({
            address: getAddress(fwStaticAddress),
            abi: FlywheelStaticRewardsABI,
            functionName: "rewardsInfo",
            args: [m],
          });
        })
      );

      return rewardsInfos;
    }

    async getFlywheelClaimableRewardsForPool(poolAddress: string, account: string) {
      const [marketsOfPool, rewardDistributorsOfPool] = await Promise.all([
        this.publicClient.readContract({
          address: getAddress(poolAddress),
          abi: ComptrollerFirstExtensionABI,
          functionName: "getAllMarkets",
        }),
        this.publicClient.readContract({
          address: getAddress(poolAddress),
          abi: ComptrollerFirstExtensionABI,
          functionName: "getRewardsDistributors",
        }),
      ]);

      const flywheelWithRewards: FlywheelClaimableRewards[] = [];
      for (const rewardDistributor of rewardDistributorsOfPool) {
        const flywheel = this.createMidasFlywheel(rewardDistributor);
        const rewards: FlywheelClaimableRewards["rewards"] = [];
        for (const market of marketsOfPool) {
          const { result } = await this.publicClient.simulateContract({
            address: getAddress(rewardDistributor),
            abi: MidasFlywheelABI,
            functionName: "accrue",
            args: [market, getAddress(account)],
          });

          if ((result as bigint) > BigInt(0)) {
            rewards.push({
              market,
              amount: result as bigint,
            });
          }
        }
        if (rewards.length > 0) {
          flywheelWithRewards.push({
            flywheel: rewardDistributor,
            rewardToken: await flywheel.read.rewardToken(),
            rewards,
          });
        }
      }
      return flywheelWithRewards;
    }

    async getFlywheelClaimableRewardsForAsset(poolAddress: string, market: string, account: string) {
      const rewardDistributorsOfPool = await this.publicClient.readContract({
        address: getAddress(poolAddress),
        abi: ComptrollerFirstExtensionABI,
        functionName: "getRewardsDistributors",
      });

      const flywheelWithRewards: FlywheelClaimableRewards[] = [];

      for (const rewardDistributor of rewardDistributorsOfPool) {
        const rewards: FlywheelClaimableRewards["rewards"] = [];
        // TODO don't accrue for all markets. Check which markets/strategies are available for that specific flywheel
        // trying to accrue for a market which is not active in the flywheel will throw an error
        try {
          const { result } = await this.publicClient.simulateContract({
            address: getAddress(rewardDistributor),
            abi: MidasFlywheelABI,
            functionName: "accrue",
            args: [getAddress(market), getAddress(account)],
          });

          if ((result as bigint) > BigInt(0)) {
            rewards.push({
              market,
              amount: result as bigint,
            });
          }

          if (rewards.length > 0) {
            const rewardToken = await this.publicClient.readContract({
              address: getAddress(rewardDistributor),
              abi: MidasFlywheelABI,
              functionName: "rewardToken",
            });

            flywheelWithRewards.push({
              flywheel: rewardDistributor,
              rewardToken,
              rewards,
            });
          }
        } catch (e) {
          console.error(`Error while calling accrue for market ${market} and account ${account}: ${e.message}`);
        }
      }

      return flywheelWithRewards;
    }

    async getFlywheelClaimableRewards(account: string) {
      const [, comptrollers] = await this.publicClient.readContract({
        address: getAddress(this.chainDeployment.FusePoolLensSecondary.address),
        abi: FusePoolLensSecondaryABI,
        functionName: "getFlywheelsToClaim",
        args: [getAddress(account)],
      });

      return (await Promise.all(comptrollers.map((comp) => this.getFlywheelClaimableRewardsForPool(comp, account))))
        .reduce((acc, curr) => [...acc, ...curr], []) // Flatten Array
        .filter((value, index, self) => self.indexOf(value) === index); // Unique Array;
    }

    async getFlywheelMarketRewardsByPoolWithAPR(pool: string): Promise<FlywheelMarketRewardsInfo[]> {
      const { result } = await this.publicClient.simulateContract({
        address: getAddress(this.chainDeployment.MidasFlywheelLensRouter.address),
        abi: MidasFlywheelLensRouterABI,
        functionName: "getMarketRewardsInfo",
        args: [getAddress(pool)],
      });

      const adaptedMarketRewards = result
        .map((marketReward) => ({
          underlyingPrice: marketReward.underlyingPrice,
          market: marketReward.market,
          rewardsInfo: marketReward.rewardsInfo.filter((info) => info.rewardSpeedPerSecondPerToken > BigInt(0)),
        }))
        .filter((marketReward) => marketReward.rewardsInfo.length > 0);

      return adaptedMarketRewards;
    }

    async getFlywheelRewardsInfoForMarket(flywheelAddress: string, marketAddress: string) {
      const fwRewardsAddress = await this.publicClient.readContract({
        address: getAddress(flywheelAddress),
        abi: MidasFlywheelABI,
        functionName: "flywheelRewards",
      });
      const [marketState, rewardsInfo] = await Promise.all([
        this.publicClient.readContract({
          address: getAddress(flywheelAddress),
          abi: MidasFlywheelABI,
          functionName: "marketState",
          args: [getAddress(marketAddress)],
        }),
        this.publicClient.readContract({
          address: fwRewardsAddress,
          abi: FlywheelStaticRewardsABI,
          functionName: "rewardsInfo",
          args: [getAddress(marketAddress)],
        }),
      ]);

      return {
        enabled: marketState[1] > 0,
        ...rewardsInfo,
      };
    }
    /** WRITE */
    async getFlywheelEnabledMarkets(flywheelAddress: string) {
      return await this.publicClient.readContract({
        address: getAddress(flywheelAddress),
        abi: MidasFlywheelABI,
        functionName: "getAllStrategies",
      });
    }

    async setStaticRewardInfo(
      staticRewardsAddress: string,
      marketAddress: string,
      rewardInfo: {
        rewardsPerSecond: bigint;
        rewardsEndTimestamp: number;
      }
    ) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(staticRewardsAddress),
        abi: FlywheelStaticRewardsABI,
        functionName: "setRewardsInfo",
        args: [getAddress(marketAddress), rewardInfo],
      });

      return await this.walletClient.writeContract(request);
    }

    async setFlywheelRewards(flywheelAddress: string, rewardsAddress: string) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(flywheelAddress),
        abi: MidasFlywheelABI,
        functionName: "setFlywheelRewards",
        args: [getAddress(rewardsAddress)],
      });

      return await this.walletClient.writeContract(request);
    }

    addMarketForRewardsToFlywheelCore(flywheelCoreAddress: string, marketAddress: string) {
      return this.addStrategyForRewardsToFlywheelCore(flywheelCoreAddress, marketAddress);
    }

    async addStrategyForRewardsToFlywheelCore(flywheelCoreAddress: string, marketAddress: string) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(flywheelCoreAddress),
        abi: MidasFlywheelABI,
        functionName: "addStrategyForRewards",
        args: [getAddress(marketAddress)],
      });

      return await this.walletClient.writeContract(request);
    }

    async addFlywheelCoreToComptroller(flywheelCoreAddress: string, comptrollerAddress: string) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(comptrollerAddress),
        abi: ComptrollerABI,
        functionName: "_addRewardsDistributor",
        args: [getAddress(flywheelCoreAddress)],
      });

      return await this.walletClient.writeContract(request);
    }
  };
}
