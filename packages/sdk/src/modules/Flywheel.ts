import { bigint, Contract } from "ethers";
import { getAddress } from "viem";

import ComptrollerABI from "../../abis/Comptroller";
import ComptrollerFirstExtensionABI from "../../abis/ComptrollerFirstExtension";
import MidasFlywheelABI from "../../abis/MidasFlywheel";
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
        this.createComptrollerFirstExtension(pool).read.getAllMarkets(),
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
      const pool = this.createComptrollerFirstExtension(poolAddress);
      const allRewardDistributors = await pool.read.getRewardsDistributors();
      const instances = allRewardDistributors.map((address) => {
        return this.createMidasFlywheel(address);
      });

      const filterList = await Promise.all(
        instances.map(async (instance) => {
          try {
            return await instance.read.isFlywheel();
          } catch (error) {
            return false;
          }
        })
      );

      return allRewardDistributors.filter((_, index) => filterList[index]);
    }

    async getFlywheelRewardsInfos(flywheelAddress: string) {
      const flywheelCoreInstance = this.createMidasFlywheel(flywheelAddress);
      const [fwStaticAddress, enabledMarkets] = await Promise.all([
        flywheelCoreInstance.read.flywheelRewards(),
        flywheelCoreInstance.read.getAllStrategies(),
      ]);
      const fwStatic = this.createFlywheelStaticRewards(fwStaticAddress);
      const rewardsInfos: Record<string, any> = {};
      await Promise.all(
        enabledMarkets.map(async (m) => {
          rewardsInfos[m] = await fwStatic.read.rewardsInfo([m]);
        })
      );
      return rewardsInfos;
    }

    async getFlywheelClaimableRewardsForPool(poolAddress: string, account: string) {
      const pool = this.createComptrollerFirstExtension(poolAddress);
      const marketsOfPool = await pool.read.getAllMarkets();

      const rewardDistributorsOfPool = await pool.read.getRewardsDistributors();
      const flywheelWithRewards: FlywheelClaimableRewards[] = [];
      for (const rewardDistributor of rewardDistributorsOfPool) {
        const flywheel = this.createMidasFlywheel(rewardDistributor);
        const rewards: FlywheelClaimableRewards["rewards"] = [];
        for (const market of marketsOfPool) {
          const rewardOfMarket = await flywheel.read["accrue(address,address)"](market, account);
          if (rewardOfMarket.gt(0)) {
            rewards.push({
              market,
              amount: rewardOfMarket,
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
      const pool = this.createComptrollerFirstExtension(poolAddress);
      const rewardDistributorsOfPool = await pool.read.getRewardsDistributors();

      const flywheelWithRewards: FlywheelClaimableRewards[] = [];

      for (const rewardDistributor of rewardDistributorsOfPool) {
        const flywheel = this.createMidasFlywheel(rewardDistributor);
        const rewards: FlywheelClaimableRewards["rewards"] = [];
        // TODO don't accrue for all markets. Check which markets/strategies are available for that specific flywheel
        // trying to accrue for a market which is not active in the flywheel will throw an error
        const rewardOfMarket = await flywheel.read["accrue(address,address)"](market, account).catch((e) => {
          console.error(`Error while calling accrue for market ${market} and account ${account}: ${e.message}`);
          return bigint.from(0);
        });
        if (rewardOfMarket.gt(0)) {
          rewards.push({
            market,
            amount: rewardOfMarket,
          });
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

    async getFlywheelClaimableRewards(account: string) {
      const [, comptrollers] = await this.contracts.FusePoolLensSecondary.callStatic.getFlywheelsToClaim(account, {
        from: account,
      });

      return (await Promise.all(comptrollers.map((comp) => this.getFlywheelClaimableRewardsForPool(comp, account))))
        .reduce((acc, curr) => [...acc, ...curr], []) // Flatten Array
        .filter((value, index, self) => self.indexOf(value) === index); // Unique Array;
    }

    async getFlywheelMarketRewardsByPoolWithAPR(pool: string): Promise<FlywheelMarketRewardsInfo[]> {
      const fwLensRouter = this.createMidasFlywheelLensRouter();
      const marketRewards = await fwLensRouter.read.getMarketRewardsInfo([getAddress(pool)]);

      const adaptedMarketRewards = marketRewards
        .map((marketReward) => ({
          underlyingPrice: marketReward.underlyingPrice,
          market: marketReward.market,
          rewardsInfo: marketReward.rewardsInfo.filter((info) => info.rewardSpeedPerSecondPerToken.gt(0)),
        }))
        .filter((marketReward) => marketReward.rewardsInfo.length > 0);
      return adaptedMarketRewards;
    }

    async getFlywheelRewardsInfoForMarket(flywheelAddress: string, marketAddress: string) {
      const fwCoreInstance = this.createMidasFlywheel(flywheelAddress, this.provider);
      const fwRewardsAddress = await fwCoreInstance.callStatic.flywheelRewards();
      const fwRewardsInstance = this.createFlywheelStaticRewards(fwRewardsAddress, this.provider);
      const [marketState, rewardsInfo] = await Promise.all([
        fwCoreInstance.callStatic.marketState(marketAddress),
        fwRewardsInstance.callStatic.rewardsInfo(marketAddress),
      ]);
      return {
        enabled: marketState[1] > 0,
        ...rewardsInfo,
      };
    }
    /** WRITE */
    getFlywheelEnabledMarkets(flywheelAddress: string) {
      return this.createMidasFlywheel(flywheelAddress).callStatic.getAllStrategies();
    }

    setStaticRewardInfo(
      staticRewardsAddress: string,
      marketAddress: string,
      rewardInfo: FlywheelStaticRewards.RewardsInfoStruct
    ) {
      const staticRewardsInstance = this.createFlywheelStaticRewards(staticRewardsAddress, this.signer);
      return staticRewardsInstance.functions.setRewardsInfo(marketAddress, rewardInfo);
    }

    setFlywheelRewards(flywheelAddress: string, rewardsAddress: string) {
      const flywheelCoreInstance = this.createMidasFlywheel(flywheelAddress, this.signer);
      return flywheelCoreInstance.functions.setFlywheelRewards(rewardsAddress);
    }

    addMarketForRewardsToFlywheelCore(flywheelCoreAddress: string, marketAddress: string) {
      return this.addStrategyForRewardsToFlywheelCore(flywheelCoreAddress, marketAddress);
    }

    addStrategyForRewardsToFlywheelCore(flywheelCoreAddress: string, marketAddress: string) {
      const flywheelCoreInstance = this.createMidasFlywheel(flywheelCoreAddress, this.signer);
      return flywheelCoreInstance.functions.addStrategyForRewards(marketAddress);
    }

    addFlywheelCoreToComptroller(flywheelCoreAddress: string, comptrollerAddress: string) {
      const comptrollerInstance = this.createComptroller(comptrollerAddress, this.signer);
      return comptrollerInstance.functions._addRewardsDistributor(flywheelCoreAddress);
    }
  };
}
