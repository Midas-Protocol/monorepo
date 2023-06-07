import { assetSymbols, RedemptionStrategyContract, underlying } from "@midas-capital/types";

import assets, { ankrBNB, BUSD, WBNB } from "./assets";

// [input token address]: [conversion strategy, output token address]
const redemptionStrategies: { [token: string]: [RedemptionStrategyContract, string] } = {
  [underlying(assets, assetSymbols["3EPS"])]: [
    RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols.mai3EPS)]: [
    RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols["2brl"])]: [
    RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry,
    underlying(assets, assetSymbols.jBRL),
  ],
  [underlying(assets, assetSymbols["3brl"])]: [
    RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry,
    underlying(assets, assetSymbols.jBRL),
  ],
  [underlying(assets, assetSymbols.val3EPS)]: [
    RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols.valdai3EPS)]: [
    RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry,
    underlying(assets, assetSymbols.val3EPS),
  ],
  [underlying(assets, assetSymbols["JCHF-BUSD"])]: [
    RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols["epsBNBx-BNB"])]: [
    RedemptionStrategyContract.CurveLpTokenLiquidatorNoRegistry,
    underlying(assets, assetSymbols.WBNB),
  ],
  [underlying(assets, assetSymbols.MAI)]: [
    RedemptionStrategyContract.CurveSwapLiquidator,
    underlying(assets, assetSymbols.val3EPS),
  ],
  [underlying(assets, assetSymbols.JCHF)]: [
    RedemptionStrategyContract.CurveSwapLiquidator,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols.BOMB)]: [
    RedemptionStrategyContract.UniswapV2LiquidatorFunder,
    underlying(assets, assetSymbols.BTCB),
  ],
  [underlying(assets, assetSymbols.xBOMB)]: [
    RedemptionStrategyContract.XBombLiquidatorFunder,
    underlying(assets, assetSymbols.BOMB),
  ],
  [underlying(assets, assetSymbols.jBRL)]: [
    RedemptionStrategyContract.JarvisLiquidatorFunder,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols["WBNB-BUSD"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, WBNB],
  [underlying(assets, assetSymbols["WBNB-DAI"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, WBNB],
  [underlying(assets, assetSymbols["WBNB-USDC"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, WBNB],
  [underlying(assets, assetSymbols["WBNB-USDT"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, WBNB],
  [underlying(assets, assetSymbols["WBNB-ETH"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, WBNB],
  [underlying(assets, assetSymbols["BUSD-USDT"])]: [
    RedemptionStrategyContract.UniswapLpTokenLiquidator,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols["BUSD-BTCB"])]: [
    RedemptionStrategyContract.UniswapLpTokenLiquidator,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols["USDC-BUSD"])]: [
    RedemptionStrategyContract.UniswapLpTokenLiquidator,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols["USDC-ETH"])]: [
    RedemptionStrategyContract.UniswapLpTokenLiquidator,
    underlying(assets, assetSymbols.USDC),
  ],
  [underlying(assets, assetSymbols["BTCB-BOMB"])]: [
    RedemptionStrategyContract.UniswapLpTokenLiquidator,
    underlying(assets, assetSymbols.BTCB),
  ],
  [underlying(assets, assetSymbols["BTCB-ETH"])]: [
    RedemptionStrategyContract.UniswapLpTokenLiquidator,
    underlying(assets, assetSymbols.BTCB),
  ],
  [underlying(assets, assetSymbols["CAKE-WBNB"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, WBNB],
  [underlying(assets, assetSymbols["ANKR-ankrBNB"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, ankrBNB],
  [underlying(assets, assetSymbols["stkBNB-WBNB"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, WBNB],
  [underlying(assets, assetSymbols["asBNBx-WBNB"])]: [RedemptionStrategyContract.UniswapLpTokenLiquidator, WBNB],
  [underlying(assets, assetSymbols["sAMM-jBRL/BRZ"])]: [
    RedemptionStrategyContract.SolidlyLpTokenLiquidator,
    underlying(assets, assetSymbols.jBRL),
  ],
  [underlying(assets, assetSymbols["vAMM-ANKR/ankrBNB"])]: [
    RedemptionStrategyContract.SolidlyLpTokenLiquidator,
    underlying(assets, assetSymbols.ankrBNB),
  ],
  [underlying(assets, assetSymbols["vAMM-ANKR/HAY"])]: [
    RedemptionStrategyContract.SolidlyLpTokenLiquidator,
    underlying(assets, assetSymbols.HAY),
  ],
  [underlying(assets, assetSymbols["sAMM-HAY/BUSD"])]: [
    RedemptionStrategyContract.SolidlyLpTokenLiquidator,
    underlying(assets, assetSymbols.BUSD),
  ],
  [underlying(assets, assetSymbols["vAMM-HAY/ankrBNB"])]: [
    RedemptionStrategyContract.SolidlyLpTokenLiquidator,
    underlying(assets, assetSymbols.ankrBNB),
  ],
  [underlying(assets, assetSymbols.BNBx)]: [RedemptionStrategyContract.UniswapV2LiquidatorFunder, WBNB],
  [underlying(assets, assetSymbols.ankrBNB)]: [RedemptionStrategyContract.AlgebraSwapLiquidator, WBNB],
  [underlying(assets, assetSymbols.HAY)]: [RedemptionStrategyContract.SolidlyLiquidator, BUSD],
  [underlying(assets, assetSymbols.aWBNB_STKBNB)]: [
    RedemptionStrategyContract.GammaLpTokenLiquidator,
    underlying(assets, assetSymbols.WBNB),
  ],
  [underlying(assets, assetSymbols.aANKRBNB_ANKR_N)]: [
    RedemptionStrategyContract.GammaLpTokenLiquidator,
    underlying(assets, assetSymbols.ankrBNB),
  ],
  [underlying(assets, assetSymbols.aANKRBNB_ANKR_W)]: [
    RedemptionStrategyContract.GammaLpTokenLiquidator,
    underlying(assets, assetSymbols.ankrBNB),
  ],
  [underlying(assets, assetSymbols.aANKRBNB_RDNT_N)]: [
    RedemptionStrategyContract.GammaLpTokenLiquidator,
    underlying(assets, assetSymbols.ankrBNB),
  ],
  [underlying(assets, assetSymbols.aANKRBNB_RDNT_W)]: [
    RedemptionStrategyContract.GammaLpTokenLiquidator,
    underlying(assets, assetSymbols.ankrBNB),
  ],
  [underlying(assets, assetSymbols.RDNT)]: [
    RedemptionStrategyContract.AlgebraSwapLiquidator,
    underlying(assets, assetSymbols.ankrBNB),
  ],
};

export default redemptionStrategies;
