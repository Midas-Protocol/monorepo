import {RedemptionStrategyContract} from "@midas-capital/types";
import {BytesLike, Contract, ethers} from "ethers";

import {IUniswapV2Pair__factory} from "../../../lib/contracts/typechain/factories/IUniswapV2Pair__factory";
import {MidasBase} from "../../MidasSdk";

export type StrategiesAndDatas = {
  strategies: string[];
  datas: BytesLike[];
};

export type StrategyAndData = {
  strategyAddress: string;
  strategyData: BytesLike;
  outputToken: string;
};

export const getRedemptionStrategiesAndDatas = async (
  fuse: MidasBase,
  inputToken: string,
  expectedOutputToken: string | null
): Promise<[StrategiesAndDatas, string[]]> => {
  const strategies: string[] = [];
  const datas: BytesLike[] = [];
  const tokenPath: string[] = [];

  if (expectedOutputToken) {
    let tokenToRedeem = inputToken;
    // chain redemptions as long as it is redeemable and is not the needed output token
    while (tokenToRedeem != expectedOutputToken && tokenToRedeem in fuse.redemptionStrategies) {
      const { strategyAddress, strategyData, outputToken } = (await getStrategyAndData(
        fuse,
        tokenToRedeem
      )) as StrategyAndData;

      // avoid going in an endless loop
      // it is not mission critical to reach the expected output token,
      // so just break instead of throwing
      if (tokenPath.find((p) => p == outputToken)) break;

      tokenPath.push(outputToken);
      strategies.push(strategyAddress);
      datas.push(strategyData);

      tokenToRedeem = outputToken;
    }
  }

  return [
    {
      strategies,
      datas,
    },
    tokenPath,
  ];
};

const pickPreferredToken = (fuse: MidasBase, tokens: string[]): string => {
  const wtoken = fuse.chainSpecificAddresses.W_TOKEN;
  const stableToken = fuse.chainSpecificAddresses.STABLE_TOKEN;
  const wBTCToken = fuse.chainSpecificAddresses.W_BTC_TOKEN;

  if (tokens.find((t) => t == wtoken)) {
    return wtoken;
  } else if (tokens.find((t) => t == stableToken)) {
    return stableToken;
  } else if (tokens.find((t) => t == wBTCToken)) {
    return wBTCToken;
  } else {
    return tokens[0];
  }
};

const getStrategyAndData = async (fuse: MidasBase, inputToken: string): Promise<StrategyAndData> => {
  const [redemptionStrategy, outputToken] = fuse.redemptionStrategies[inputToken];
  const redemptionStrategyContract = new Contract(
    fuse.chainDeployment[redemptionStrategy].address,
    fuse.chainDeployment[redemptionStrategy].abi,
    fuse.provider
  );

  switch (redemptionStrategy) {
    case RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry:
      const curveLpOracleAddress = await redemptionStrategyContract.callStatic.oracle();
      const curveLpOracle = new Contract(
        curveLpOracleAddress,
        fuse.chainDeployment.CurveLpTokenPriceOracleNoRegistry.abi,
        fuse.provider
      );

      const tokens: string[] = [];
      while (true) {
        try {
          const underlying = await curveLpOracle.callStatic.underlyingTokens(inputToken, tokens.length);
          tokens.push(underlying);
        } catch (e) {
          break;
        }
      }

      const preferredOutputToken = pickPreferredToken(fuse, tokens);
      return {
        strategyAddress: redemptionStrategyContract.address,
        strategyData: new ethers.utils.AbiCoder().encode(["uint256", "address"], [0, preferredOutputToken]),
        outputToken: preferredOutputToken,
      };

    case RedemptionStrategyContract.XBombLiquidatorFunder: {
      return { strategyAddress: redemptionStrategyContract.address, strategyData: [], outputToken };
    }
    case RedemptionStrategyContract.UniswapLpTokenLiquidator:
    case RedemptionStrategyContract.GelatoGUniLiquidator: {
      const lpToken = IUniswapV2Pair__factory.connect(inputToken, fuse.provider);

      const token0 = await lpToken.callStatic.token0();
      const token1 = await lpToken.callStatic.token1();

      if (token0 != outputToken && token1 != outputToken) {
        throw new Error(`Output token ${outputToken} does not match either of the pair tokens! ${token0} ${token1}`);
      }

      const token0IsOutputToken = token0 == outputToken;

      // token0 is the output token if swapToken0Path.length == 0
      // else output token is the last in swapToken0Path
      const swapToken0Path = !token0IsOutputToken ? [token0, outputToken] : [];
      const swapToken1Path = token0IsOutputToken ? [token1, outputToken] : [];

      return {
        strategyAddress: redemptionStrategyContract.address,
        strategyData: new ethers.utils.AbiCoder().encode(
          ["address", "address[]", "address[]"],
          [fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER, swapToken0Path, swapToken1Path]
        ),
        outputToken,
      };
    }
    case RedemptionStrategyContract.JarvisLiquidatorFunder: {
      const jarvisPool = fuse.chainConfig.liquidationDefaults.jarvisPools.find(
        (p) => p.collateralToken == outputToken && p.syntheticToken == inputToken
      );
      if (jarvisPool == null) {
        throw new Error(
          `wrong config for the jarvis redemption strategy for ${inputToken} - no such pool with collateralToken ${outputToken}`
        );
      }
      const poolAddress = jarvisPool.liquidityPoolAddress;
      const expirationTime = jarvisPool.expirationTime;
      const strategyData = new ethers.utils.AbiCoder().encode(
        ["address", "address", "uint256"],
        [inputToken, poolAddress, expirationTime]
      );

      return { strategyAddress: redemptionStrategyContract.address, strategyData, outputToken };
    }
    case RedemptionStrategyContract.CurveSwapLiquidator: {
      const curvePool = fuse.chainConfig.liquidationDefaults.curveSwapPools.find(
        (p) => p.coins.find(c => c == inputToken) && p.coins.find(c => c == outputToken)
      );
      if (curvePool == null) {
        throw new Error(
          `wrong config for the curve swap redemption strategy for ${inputToken} - no such pool with ${outputToken}`
        );
      }

      const i = curvePool.coins.indexOf(inputToken);
      const j = curvePool.coins.indexOf(outputToken);

      const strategyData = new ethers.utils.AbiCoder().encode(
        ["address", "int128", "int128", "address"],
        [curvePool.poolAddress, i, j, outputToken]
      );

      return { strategyAddress: redemptionStrategyContract.address, strategyData, outputToken };
    }
    default: {
      return { strategyAddress: redemptionStrategyContract.address, strategyData: [], outputToken };
    }
  }
};
