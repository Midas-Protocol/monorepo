import { ethereum } from "@midas-capital/chains";
import { assetSymbols, RedemptionStrategyContract, underlying } from "@midas-capital/types";
import { encodeAbiParameters, getAddress, parseAbiParameters } from "viem";

import { Constants } from "../..";
import CurveLpTokenPriceOracleNoRegistryABI from "../../../abis/CurveLpTokenPriceOracleNoRegistry";
import IPairABI from "../../../abis/IPair";
import IUniswapV2PairABI from "../../../abis/IUniswapV2Pair";
import SaddleLpPriceOracleABI from "../../../abis/SaddleLpPriceOracle";
import { MidasBase } from "../../MidasSdk";

export type StrategiesAndDatas = {
  strategies: string[];
  datas: string[];
};

export type StrategyAndData = {
  strategyAddress: string;
  strategyData: string;
  outputToken: string;
};

export const getRedemptionStrategiesAndDatas = async (
  fuse: MidasBase,
  inputToken: string,
  expectedOutputToken: string | null
): Promise<[StrategiesAndDatas, string[]]> => {
  const strategies: string[] = [];
  const datas: string[] = [];
  const tokenPath: string[] = [inputToken];

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

export const getUniswapV2Router = (midasSdk: MidasBase, asset: string): string => {
  return Object.values(midasSdk.chainConfig.liquidationDefaults.ASSET_SPECIFIC_ROUTER).includes(asset)
    ? midasSdk.chainConfig.liquidationDefaults.ASSET_SPECIFIC_ROUTER[asset]
    : midasSdk.chainConfig.liquidationDefaults.DEFAULT_ROUTER;
};

const pickPreferredToken = (fuse: MidasBase, tokens: string[], strategyOutputToken: string): string => {
  const wtoken = fuse.chainSpecificAddresses.W_TOKEN;
  const stableToken = fuse.chainSpecificAddresses.STABLE_TOKEN;
  const wBTCToken = fuse.chainSpecificAddresses.W_BTC_TOKEN;

  if (tokens.find((t) => t == strategyOutputToken)) {
    return strategyOutputToken;
  } else if (tokens.find((t) => t == wtoken)) {
    return wtoken;
  } else if (tokens.find((t) => t == stableToken)) {
    return stableToken;
  } else if (tokens.find((t) => t == wBTCToken)) {
    return wBTCToken;
  } else {
    return tokens[0];
  }
};

const getStrategyAndData = async (midasSdk: MidasBase, inputToken: string): Promise<StrategyAndData> => {
  const [redemptionStrategy, outputToken] = midasSdk.redemptionStrategies[inputToken];
  const redemptionStrategyAddress = midasSdk.chainDeployment[redemptionStrategy].address;

  let actualOutputToken;
  let preferredOutputToken;

  // let outputTokenIndex;
  switch (redemptionStrategy) {
    case RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry:
      const curveLpOracleAddress = midasSdk.chainDeployment.CurveLpTokenPriceOracleNoRegistry.address;

      let tokens = (await midasSdk.publicClient.readContract({
        address: getAddress(curveLpOracleAddress),
        abi: CurveLpTokenPriceOracleNoRegistryABI,
        functionName: "getUnderlyingTokens",
        args: [getAddress(inputToken)],
      })) as string[];
      preferredOutputToken = pickPreferredToken(midasSdk, tokens, outputToken);

      // the native asset is not a real erc20 token contract, converting to wrapped
      actualOutputToken = preferredOutputToken;
      if (
        preferredOutputToken == Constants.AddressZero ||
        preferredOutputToken == "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      ) {
        actualOutputToken = midasSdk.chainSpecificAddresses.W_TOKEN;
      }

      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData: encodeAbiParameters(parseAbiParameters("address, address, address"), [
          getAddress(preferredOutputToken),
          getAddress(midasSdk.chainSpecificAddresses.W_TOKEN),
          getAddress(curveLpOracleAddress),
        ]),
        outputToken: actualOutputToken,
      };
    case RedemptionStrategyContract.SaddleLpTokenLiquidator:
      const saddleLpOracleAddress = midasSdk.chainDeployment.CurveLpTokenPriceOracleNoRegistry.address;

      tokens = (await midasSdk.publicClient.readContract({
        address: getAddress(saddleLpOracleAddress),
        abi: SaddleLpPriceOracleABI,
        functionName: "getUnderlyingTokens",
        args: [getAddress(inputToken)],
      })) as string[];
      preferredOutputToken = pickPreferredToken(midasSdk, tokens, outputToken);

      // the native asset is not a real erc20 token contract, converting to wrapped
      actualOutputToken = preferredOutputToken;
      if (
        preferredOutputToken == Constants.AddressZero ||
        preferredOutputToken == "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      ) {
        actualOutputToken = midasSdk.chainSpecificAddresses.W_TOKEN;
      }
      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData: encodeAbiParameters(parseAbiParameters("address, address, address"), [
          getAddress(preferredOutputToken),
          getAddress(saddleLpOracleAddress),
          getAddress(midasSdk.chainSpecificAddresses.W_TOKEN),
        ]),
        outputToken: actualOutputToken,
      };
    case RedemptionStrategyContract.SolidlyLpTokenLiquidator: {
      const [token0, token1] = await Promise.all([
        midasSdk.publicClient.readContract({
          address: getAddress(inputToken),
          abi: IPairABI,
          functionName: "token0",
        }),
        midasSdk.publicClient.readContract({
          address: getAddress(inputToken),
          abi: IPairABI,
          functionName: "token1",
        }),
      ]);

      if (token0 != outputToken && token1 != outputToken) {
        throw new Error(`Output token ${outputToken} does not match either of the pair tokens! ${token0} ${token1}`);
      }

      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData: encodeAbiParameters(parseAbiParameters("address, address[]"), [
          getAddress(midasSdk.chainConfig.chainAddresses.SOLIDLY_SWAP_ROUTER ?? Constants.AddressZero),
          [getAddress(outputToken)],
        ]),
        outputToken,
      };
    }
    case RedemptionStrategyContract.UniswapLpTokenLiquidator:
    case RedemptionStrategyContract.GelatoGUniLiquidator: {
      const [token0, token1] = await Promise.all([
        midasSdk.publicClient.readContract({
          address: getAddress(inputToken),
          abi: IUniswapV2PairABI,
          functionName: "token0",
        }),
        midasSdk.publicClient.readContract({
          address: getAddress(inputToken),
          abi: IUniswapV2PairABI,
          functionName: "token1",
        }),
      ]);

      if (token0 != outputToken && token1 != outputToken) {
        throw new Error(`Output token ${outputToken} does not match either of the pair tokens! ${token0} ${token1}`);
      }

      const token0IsOutputToken = token0 == outputToken;

      // token0 is the output token if swapToken0Path.length == 0
      // else output token is the last in swapToken0Path
      const swapToken0Path = !token0IsOutputToken ? [token0, outputToken] : [];
      const swapToken1Path = token0IsOutputToken ? [token1, outputToken] : [];

      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData: encodeAbiParameters(parseAbiParameters("address, address[], address[]"), [
          getAddress(getUniswapV2Router(midasSdk, inputToken)),
          swapToken0Path,
          swapToken1Path,
        ]),
        outputToken,
      };
    }
    case RedemptionStrategyContract.AlgebraSwapLiquidator: {
      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData: encodeAbiParameters(parseAbiParameters("address, address"), [
          getAddress(outputToken),
          getAddress(midasSdk.chainConfig.chainAddresses.ALGEBRA_SWAP_ROUTER ?? Constants.AddressZero),
        ]),
        outputToken,
      };
    }
    case RedemptionStrategyContract.SolidlyLiquidator: {
      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData: encodeAbiParameters(parseAbiParameters("address, address"), [
          getAddress(midasSdk.chainConfig.chainAddresses.SOLIDLY_SWAP_ROUTER ?? Constants.AddressZero),
          getAddress(outputToken),
        ]),
        outputToken,
      };
    }
    case RedemptionStrategyContract.UniswapV2LiquidatorFunder: {
      const swapPath = [getAddress(inputToken), getAddress(outputToken)];
      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData: encodeAbiParameters(parseAbiParameters("address, address[]"), [
          getAddress(getUniswapV2Router(midasSdk, inputToken)),
          swapPath,
        ]),
        outputToken,
      };
    }
    case RedemptionStrategyContract.JarvisLiquidatorFunder: {
      const jarvisPool = midasSdk.chainConfig.liquidationDefaults.jarvisPools.find(
        (p) => p.collateralToken == outputToken && p.syntheticToken == inputToken
      );
      if (jarvisPool == null) {
        throw new Error(
          `wrong config for the jarvis redemption strategy for ${inputToken} - no such pool with collateralToken ${outputToken}`
        );
      }
      const poolAddress = jarvisPool.liquidityPoolAddress;
      const expirationTime = jarvisPool.expirationTime;
      const strategyData = encodeAbiParameters(parseAbiParameters("address, address, uint256"), [
        getAddress(inputToken),
        getAddress(poolAddress),
        BigInt(expirationTime),
      ]);

      return { strategyAddress: redemptionStrategyAddress, strategyData, outputToken };
    }
    case RedemptionStrategyContract.CurveSwapLiquidator: {
      const curveV1Oracle = midasSdk.chainDeployment.CurveLpTokenPriceOracleNoRegistry
        ? midasSdk.chainDeployment.CurveLpTokenPriceOracleNoRegistry.address
        : Constants.AddressZero;
      const curveV2Oracle = midasSdk.chainDeployment.CurveV2LpTokenPriceOracleNoRegistry
        ? midasSdk.chainDeployment.CurveV2LpTokenPriceOracleNoRegistry.address
        : Constants.AddressZero;

      const strategyData = encodeAbiParameters(parseAbiParameters("address, address, address, address, address"), [
        getAddress(curveV1Oracle),
        getAddress(curveV2Oracle),
        getAddress(inputToken),
        getAddress(outputToken),
        getAddress(midasSdk.chainSpecificAddresses.W_TOKEN),
      ]);

      return { strategyAddress: redemptionStrategyAddress, strategyData, outputToken };
    }
    case RedemptionStrategyContract.BalancerSwapLiquidator:
    case RedemptionStrategyContract.BalancerLpTokenLiquidator: {
      const strategyData = encodeAbiParameters(parseAbiParameters("address"), [getAddress(outputToken)]);

      // TODO: add support for multiple pools
      return { strategyAddress: redemptionStrategyAddress, strategyData, outputToken };
    }
    case RedemptionStrategyContract.XBombLiquidatorFunder: {
      const xbomb = inputToken;
      const bomb = outputToken;
      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData: encodeAbiParameters(parseAbiParameters("address, address, address"), [
          getAddress(inputToken),
          getAddress(xbomb),
          getAddress(bomb),
        ]),
        outputToken,
      };
    }
    case RedemptionStrategyContract.ERC4626Liquidator:
      let fee: number;
      let underlyingTokens: string[];

      switch (inputToken) {
        case underlying(ethereum.assets, assetSymbols.realYieldUSD): {
          fee = 10;
          underlyingTokens = [
            underlying(ethereum.assets, assetSymbols.USDC),
            underlying(ethereum.assets, assetSymbols.DAI),
            underlying(ethereum.assets, assetSymbols.USDT),
          ];
          break;
        }
        case underlying(ethereum.assets, assetSymbols.ethBtcMomentum):
        case underlying(ethereum.assets, assetSymbols.ethBtcTrend): {
          underlyingTokens = [
            underlying(ethereum.assets, assetSymbols.USDC),
            underlying(ethereum.assets, assetSymbols.WETH),
            underlying(ethereum.assets, assetSymbols.WBTC),
          ];
          fee = 500;
          break;
        }
        default: {
          fee = 300;
          underlyingTokens = [outputToken];
        }
      }

      const quoter = midasSdk.chainDeployment["Quoter"].address;
      const strategyData = encodeAbiParameters(parseAbiParameters("address, uint24, address, address[], address"), [
        getAddress(outputToken),
        fee,
        getAddress(midasSdk.chainConfig.chainAddresses.UNISWAP_V3_ROUTER ?? Constants.AddressZero),
        underlyingTokens.map((token) => getAddress(token)),
        getAddress(quoter),
      ]);
      return {
        strategyAddress: redemptionStrategyAddress,
        strategyData,
        outputToken,
      };
    default: {
      return { strategyAddress: redemptionStrategyAddress, strategyData: "", outputToken };
    }
  }
};
