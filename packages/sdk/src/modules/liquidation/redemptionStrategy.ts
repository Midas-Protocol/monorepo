import { BytesLike, Contract, ethers } from "ethers";

import { RedemptionStrategy } from "../../enums";
import { FuseBase } from "../../Fuse";
import { CurveLpTokenPriceOracleNoRegistry } from "../../../lib/contracts/typechain/CurveLpTokenPriceOracleNoRegistry";

export type StrategyAndData = {
  strategyAddress: string[];
  strategyData: BytesLike[];
};

export const getStrategyAndData = async (fuse: FuseBase, token: string): Promise<StrategyAndData> => {
  if (!(token in fuse.redemptionStrategies)) return { strategyData: [], strategyAddress: [] };

  const redemptionStrategy = fuse.redemptionStrategies[token] as RedemptionStrategy;
  const redemptionStrategy2 = fuse.redemptionStrategies[
    fuse.supportedAssets.find((a) => a.symbol === "jBRL")!.underlying
  ] as RedemptionStrategy;
  const redemptionStrategyContract = new Contract(
    fuse.chainDeployment[redemptionStrategy].address,
    fuse.chainDeployment[redemptionStrategy].abi,
    fuse.provider
  );
  const redemptionStrategy2Contract = new Contract(
    fuse.chainDeployment[redemptionStrategy2].address,
    fuse.chainDeployment[redemptionStrategy2].abi,
    fuse.provider
  );
  const strategyAndData = {
    strategyAddress: [redemptionStrategyContract.address, redemptionStrategy2Contract.address],
  };
  console.log(redemptionStrategy);

  switch (redemptionStrategy) {
    case RedemptionStrategy.CurveLpTokenLiquidatorNoRegistry:
      const curveLpOracleAddress = await redemptionStrategyContract.callStatic.oracle();
      console.log(curveLpOracleAddress, "curveLpOracleAddress");
      const curveLpOracle = new Contract(
        curveLpOracleAddress,
        fuse.chainDeployment.CurveLpTokenPriceOracleNoRegistry.abi,
        fuse.provider
      ) as CurveLpTokenPriceOracleNoRegistry;

      const underlying = await curveLpOracle.callStatic.underlyingTokens(token, 0);

      return {
        ...strategyAndData,
        strategyData: [
          new ethers.utils.AbiCoder().encode(["uint256", "address"], [1, underlying]),
          "0x",
        ],
      };

    case RedemptionStrategy.XBombLiquidator: {
      return { ...strategyAndData, strategyData: [] };
    }
    case RedemptionStrategy.UniswapLpTokenLiquidator: {
      return {
        ...strategyAndData,
        strategyData: [
          new ethers.utils.AbiCoder().encode(
            ["address", "address[]", "address[]"],
            [fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER, [], []]
          ),
        ],
      };
    }
    case RedemptionStrategy.JarvisSynthereumLiquidator: {
      return { ...strategyAndData, strategyData: [] };
    }
    default: {
      return { ...strategyAndData, strategyData: [] };
    }
  }
};
