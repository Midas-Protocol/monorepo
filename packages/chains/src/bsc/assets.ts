import { assetSymbols, OracleTypes, SupportedAsset } from "@midas-capital/types";

import { ankrBNBDocs, defaultDocs, ellipsisDocs, jarvisDocs, pancakeSwapDocs, stkBNBDocs } from "../common";

export const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
export const BUSD = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";
export const BTCB = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const DAI = "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3";
const ETH = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";
const BETH = "0x250632378E573c6Be1AC2f97Fcdf00515d0Aa91B";
const CAKE = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
const AUTO = "0xa184088a740c695E156F91f5cC086a06bb78b827";
const BIFI = "0xCa3F508B8e4Dd382eE878A314789373D80A5190A";
const ALPACA = "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F";
const USDC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const TUSD = "0x14016E85a25aeb13065688cAFB43044C2ef86784";
const MAI = "0x3F56e0c36d275367b8C502090EDF38289b3dEa0d";
const threeEPS = "0xaF4dE8E872131AE328Ce21D909C74705d3Aaf452";
const twoBRL = "0x1B6E11c5DB9B15DE87714eA9934a6c52371CfEA9";
const threeBRL = "0x27b5Fc5333246F63280dA8e3e533512EfA747c13";
const val3EPS = "0x5b5bD8913D766D005859CE002533D4838B0Ebbb5";
const valdai3EPS = "0x8087a94FFE6bcF08DC4b4EBB3d28B4Ed75a792aC";
const epsBUSD_jCHF = "0x5887cEa5e2bb7dD36F0C06Da47A8Df918c289A29";
const BOMB = "0x522348779DCb2911539e76A1042aA922F9C47Ee3";
const xBOMB = "0xAf16cB45B8149DA403AF41C63AbFEBFbcd16264b";
const aBNBc = "0xE85aFCcDaFBE7F2B096f268e31ccE3da8dA2990A";
const stkBNB_WBNB = "0xaA2527ff1893e0D40d4a454623d362B79E8bb7F1";
const stkBNB = "0xc2E9d07F66A89c44062459A47a0D2Dc038E4fb16";
const jBRL = "0x316622977073BBC3dF32E7d2A9B3c77596a0a603";
const jCHF = "0x7c869b5A294b1314E985283d01C702B62224a05f";
const jEUR = "0x23b8683Ff98F9E4781552DFE6f12Aa32814924e8";
const BRZ = "0x71be881e9C5d4465B3FfF61e89c6f3651E69B5bb";
const BRZw = "0x5b1a9850f55d9282a7C4Bf23A2a21B050e3Beb2f";
const BTCB_BOMB = "0x84392649eb0bC1c1532F2180E58Bae4E1dAbd8D6";
const WBNB_BUSD = "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16";
const WBNB_DAI = "0xc7c3cCCE4FA25700fD5574DA7E200ae28BBd36A3";
const WBNB_USDC = "0xd99c7F6C65857AC913a8f880A4cb84032AB2FC5b";
const WBNB_USDT = "0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE";
const WBNB_ETH = "0x74E4716E431f45807DCF19f284c7aA99F18a4fbc";
const BUSD_USDT = "0x7EFaEf62fDdCCa950418312c6C91Aef321375A00";
const BUSD_BTCB = "0xF45cd219aEF8618A92BAa7aD848364a158a24F33";
const USDC_BUSD = "0x2354ef4DF11afacb85a5C7f98B624072ECcddbB1";
const USDC_ETH = "0xEa26B78255Df2bBC31C1eBf60010D78670185bD0";
const CAKE_WBNB = "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0";
const BTCB_ETH = "0xD171B26E4484402de70e3Ea256bE5A2630d7e88D";
const EPX = "0xAf41054C1487b0e5E2B9250C0332eCBCe6CE9d71";
const DDD = "0x84c97300a190676a19D1E13115629A11f8482Bd1";
const pSTAKE = "0x4C882ec256823eE773B25b414d36F92ef58a7c0C";

const assets: SupportedAsset[] = [
  {
    symbol: assetSymbols.WBNB,
    underlying: WBNB,
    name: "Wrapped Binance Network Token",
    decimals: 18,
    oracle: OracleTypes.FixedNativePriceOracle,
    extraDocs: defaultDocs("https://bscscan.com", WBNB),
  },
  {
    symbol: assetSymbols.BUSD,
    underlying: BUSD,
    name: "Binance USD",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", BUSD),
  },
  {
    symbol: assetSymbols.BTCB,
    underlying: BTCB,
    name: "Binance BTC",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", BTCB),
  },
  {
    symbol: assetSymbols.DAI,
    underlying: DAI,
    name: "Binance DAI",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", DAI),
  },
  {
    symbol: assetSymbols.ETH,
    underlying: ETH,
    name: "Binance ETH",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", ETH),
  },
  // CZ
  {
    symbol: assetSymbols.BETH,
    underlying: BETH,
    name: "Binance Beacon ETH",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", BETH),
  },
  {
    symbol: assetSymbols.CAKE,
    underlying: CAKE,
    name: "PancakeSwap Token",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", CAKE),
  },
  //
  {
    symbol: assetSymbols.AUTO,
    underlying: AUTO,
    name: "AUTOv2",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", AUTO),
  },
  {
    symbol: assetSymbols.BIFI,
    underlying: BIFI,
    name: "beefy.finance",
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    decimals: 18,
    extraDocs: defaultDocs("https://bscscan.com", BIFI),
  },
  {
    symbol: assetSymbols.ALPACA,
    underlying: ALPACA,
    name: "AlpacaToken",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", ALPACA),
  },
  // stables
  {
    symbol: assetSymbols.USDC,
    underlying: USDC,
    name: "Binance-Peg USD Coin",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", USDC),
  },
  {
    symbol: assetSymbols.USDT,
    underlying: USDT,
    name: "Binance-Peg BSC-USD",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", USDT),
  },
  {
    symbol: assetSymbols.TUSD,
    underlying: TUSD,
    name: "Wrapped TrueUSD",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", TUSD),
  },
  {
    symbol: assetSymbols.MAI,
    underlying: MAI,
    name: "Mai Stablecoin",
    decimals: 18,
    oracle: OracleTypes.DiaPriceOracle,
    extraDocs: defaultDocs("https://bscscan.com", MAI),
  },
  // Ellipsis
  {
    symbol: assetSymbols["3EPS"],
    underlying: threeEPS,
    name: "Ellipsis.finance 3EPS (BUSD/USDC/USDT)",
    decimals: 18,
    oracle: OracleTypes.CurveLpTokenPriceOracleNoRegistry,
    extraDocs: ellipsisDocs("0x160CAed03795365F3A589f10C379FfA7d75d4E76", "3EPS", threeEPS),
  },
  {
    symbol: assetSymbols.val3EPS,
    underlying: val3EPS,
    name: "Ellipsis.finance val3EPS (BUSD/USDC/USDT)",
    decimals: 18,
    oracle: OracleTypes.CurveLpTokenPriceOracleNoRegistry,
    extraDocs: ellipsisDocs("0x19EC9e3F7B21dd27598E7ad5aAe7dC0Db00A806d", "val3EPS", val3EPS),
  },
  {
    symbol: assetSymbols.valdai3EPS,
    underlying: valdai3EPS,
    name: "Ellipsis.finance valdai3EPS (DAI, val3EPS)",
    decimals: 18,
    oracle: OracleTypes.CurveLpTokenPriceOracleNoRegistry,
    extraDocs: ellipsisDocs("0x245e8bb5427822FB8fd6cE062d8dd853FbcfABF5", "valdai3EPS", valdai3EPS),
  },
  {
    symbol: assetSymbols["2brl"],
    underlying: twoBRL,
    name: "Ellipsis.finance 2BRL (BRZ, jBRL)",
    decimals: 18,
    oracle: OracleTypes.CurveLpTokenPriceOracleNoRegistry,
    extraDocs: ellipsisDocs("0xad51e40D8f255dba1Ad08501D6B1a6ACb7C188f3", "2brl", twoBRL),
  },
  {
    symbol: assetSymbols["3brl"],
    underlying: threeBRL,
    name: "Ellipsis.finance 3BRL (jBRL, BRZ, BRZ (Wormhole))",
    decimals: 18,
    oracle: OracleTypes.CurveLpTokenPriceOracleNoRegistry,
    extraDocs: ellipsisDocs("0x43719DfFf12B04C71F7A589cdc7F54a01da07D7a", "3brl", threeBRL),
  },
  {
    symbol: assetSymbols["JCHF-BUSD"],
    underlying: epsBUSD_jCHF,
    name: "Ellipsis.finance JCHF-BUSD",
    decimals: 18,
    oracle: OracleTypes.CurveV2LpTokenPriceOracleNoRegistry,
    extraDocs: ellipsisDocs("0xBcA6E25937B0F7E0FD8130076b6B218F595E32e2", "eps BUSD jCHF", epsBUSD_jCHF),
  },
  // Bomb
  {
    symbol: assetSymbols.BOMB,
    underlying: BOMB,
    name: "BOMB",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", BOMB),
  },
  {
    symbol: assetSymbols.xBOMB,
    underlying: xBOMB,
    name: "xBOMB",
    decimals: 18,
    disabled: true,
  },
  {
    symbol: assetSymbols.aBNBc,
    underlying: aBNBc,
    name: "Ankr BNB Reward Bearing Certificate",
    decimals: 18,
    oracle: OracleTypes.AnkrBNBcPriceOracle,
    extraDocs: ankrBNBDocs("aBNBc"),
  },
  {
    symbol: assetSymbols.stkBNB,
    underlying: stkBNB,
    name: "Staked BNB (Persistance)",
    decimals: 18,
    oracle: OracleTypes.StkBNBPriceOracle,
    extraDocs: stkBNBDocs(),
  },
  {
    symbol: assetSymbols["BTCB-BOMB"],
    underlying: BTCB_BOMB,
    name: "BOMB-BTC PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(BTCB, BOMB, "BOMB-BTC", BTCB_BOMB),
  },
  {
    symbol: assetSymbols["stkBNB-WBNB"],
    underlying: stkBNB_WBNB,
    name: "stkBNB-WBNB PCS LP",
    decimals: 18,
    oracle: OracleTypes.StkBNBPriceOracle,
    extraDocs: pancakeSwapDocs(WBNB, stkBNB, "stkBNB-WBNB", stkBNB_WBNB),
  },
  // Jarvis
  {
    symbol: assetSymbols.jBRL,
    underlying: jBRL,
    name: "Jarvis Synthetic Brazilian Real",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: jarvisDocs("v1"),
  },
  {
    symbol: assetSymbols.JCHF,
    underlying: jCHF,
    name: "Jarvis Synthetic Swiss Franc",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: jarvisDocs("v1"),
  },
  {
    symbol: assetSymbols.JEUR,
    underlying: jEUR,
    name: "Jarvis Synthetic Euro",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: jarvisDocs("v1"),
  },
  {
    symbol: assetSymbols.BRZ,
    underlying: BRZ,
    name: "BRZ Token",
    decimals: 4,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: `<p><b>How to acquire this token</b><p/><br />
    <p>You can acquire BRZ tokens at <a href="https://www.brztoken.io" target="_blank" style="color: #BCAC83; cursor="pointer">https://www.brztoken.io</> or other centralised exchanges</p>`,
  },
  {
    symbol: assetSymbols.BRZw,
    underlying: BRZw,
    name: "BRZ Token (Wormhole)",
    decimals: 4,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: `<p><b>How to acquire this token</b><p/><br />
    <p>This is the Wormhole-bridged version of BRZ. To get it, you can bridge BRZ from Solana to BSC using the <a href="https://www.portalbridge.com/#/transfer" target="_blank" style="color: #BCAC83; cursor="pointer">Official Bridge</></p>`,
  },
  {
    symbol: assetSymbols["WBNB-BUSD"],
    underlying: WBNB_BUSD,
    name: "WBNB-BUSD PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(WBNB, BUSD, "WBNB-BUSD", WBNB_BUSD),
  },
  {
    symbol: assetSymbols["WBNB-DAI"],
    underlying: WBNB_DAI,
    name: "WBNB-DAI PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(WBNB, DAI, "WBNB-DAI", WBNB_DAI),
  },
  {
    symbol: assetSymbols["WBNB-USDC"],
    underlying: WBNB_USDC,
    name: "WBNB-USDC PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(WBNB, USDC, "WBNB-USDC", WBNB_USDC),
  },
  {
    symbol: assetSymbols["WBNB-USDT"],
    underlying: WBNB_USDT,
    name: "WBNB-USDT PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(WBNB, USDT, "WBNB-USDT", WBNB_USDT),
  },
  {
    symbol: assetSymbols["WBNB-ETH"],
    underlying: WBNB_ETH,
    name: "WBNB-ETH PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(WBNB, ETH, "WBNB-ETH", WBNB_ETH),
  },
  {
    symbol: assetSymbols["BUSD-USDT"],
    underlying: BUSD_USDT,
    name: "BUSD-USDT PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(BUSD, USDT, "BUSD-USDT", BUSD_USDT),
  },
  {
    symbol: assetSymbols["BUSD-BTCB"],
    underlying: BUSD_BTCB,
    name: "BUSD-BTCB PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(BUSD, BTCB, "BUSD-BTCB", BUSD_BTCB),
  },
  {
    symbol: assetSymbols["USDC-BUSD"],
    underlying: USDC_BUSD,
    name: "USDC-BUSD PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(USDC, BUSD, "USDC-BUSD", USDC_BUSD),
  },
  {
    symbol: assetSymbols["USDC-ETH"],
    underlying: USDC_ETH,
    name: "USDC-ETH PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(USDC, ETH, "USDC-ETH", USDC_ETH),
  },
  {
    symbol: assetSymbols["CAKE-WBNB"],
    underlying: CAKE_WBNB,
    name: "CAKE-WBNB PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(CAKE, WBNB, "CAKE-WBNB", CAKE_WBNB),
  },
  {
    symbol: assetSymbols["BTCB-ETH"],
    underlying: BTCB_ETH,
    name: "BTCB-ETH PCS LP",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: pancakeSwapDocs(BTCB, ETH, "BTCB-ETH", BTCB_ETH),
  },
  {
    symbol: assetSymbols.EPX,
    underlying: EPX,
    name: "Ellipsis X",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", EPX),
  },
  {
    symbol: assetSymbols.DDD,
    underlying: DDD,
    name: "DotDot",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", DDD),
  },
  {
    symbol: assetSymbols.pSTAKE,
    underlying: pSTAKE,
    name: "pSTAKE",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
    extraDocs: defaultDocs("https://bscscan.com", pSTAKE),
  },
];

export default assets;
