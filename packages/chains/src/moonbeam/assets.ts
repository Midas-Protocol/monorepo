import { assetSymbols, OracleTypes, SupportedAsset } from "@midas-capital/types";

import { beamSwapDocs, beamSwapStableDocs, defaultDocs } from "../common";
import { stellaSwapDocs } from "../common/docs";

const ATOM = "0x27292cf0016E5dF1d8b37306B2A98588aCbD6fCA";
const xcDOT = "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080";
const multiWBTC = "0x922D641a426DcFFaeF11680e5358F34d97d112E1";
const stDOT = "0xFA36Fe1dA08C89eC72Ea1F0143a35bFd5DAea108";
const wstDOT = "0x191cf2602Ca2e534c5Ccae7BCBF4C46a704bb949";
const ETH = "0xfA9343C3897324496A05fC75abeD6bAC29f8A40f";
const BNB = "0xc9BAA8cfdDe8E328787E29b4B078abf2DaDc2055";
const multiDAI = "0x765277EebeCA2e31912C9946eAe1021199B39C61";
const multiUSDC = "0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b";
const multiUSDT = "0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73";
const whUSDC = "0x931715FEE2d06333043d11F658C8CE934aC61D0c";
const FRAX = "0x322E86852e492a7Ee17f28a78c663da38FB33bfb";
const WGLMR = "0xAcc15dC74880C9944775448304B263D191c6077F";
const GLINT = "0xcd3B51D98478D53F4515A306bE565c6EebeF1D58";
const FTM = "0xC19281F22A075E0F10351cd5D6Ea9f0AC63d4327";
const STELLA = "0x0E358838ce72d5e61E0018a2ffaC4bEC5F4c88d2";
const CELR = "0x3795C36e7D12A8c252A20C5a7B455f7c57b60283";
const LDO = "0x9Fda7cEeC4c18008096C2fE2B85F05dc300F94d0";

// StellaSwap
const GLMR_USDC = "0x555B74dAFC4Ef3A5A1640041e3244460Dc7610d1";
const GLMR_GLINT = "0x99588867e817023162F4d4829995299054a5fC57"; // not supported on stella
const GLMR_ATOM = "0xf4C10263f2A4B1f75b8a5FD5328fb61605321639";
const USDC_ETH = "0x0Aa48bF937ee8F41f1a52D225EF5A6F6961e39FA";
const WGLMR_xcDOT = "0xa927E1e1E044CA1D9fe1854585003477331fE2Af";
const xcDOT_stDOT = "0xc6e37086D09ec2048F151D11CdB9F9BbbdB7d685";
const threePool = "0xace58a26b8Db90498eF0330fDC9C2655db0C45E2";
const STELLA_GLMR = "0x7F5Ac0FC127bcf1eAf54E3cd01b00300a0861a62";
const CELR_GLMR = "0xd47BeC28365a82C0C006f3afd617012B02b129D6";
const LDO_GLMR = "0x00870B0e6994fFb142a91173a882d2F6a9a8Ac4a";

export const assets: SupportedAsset[] = [
  {
    symbol: assetSymbols.ATOM,
    underlying: ATOM,
    name: "Axelar ATOM",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", ATOM),
  },
  {
    symbol: assetSymbols.multiWBTC,
    underlying: multiWBTC,
    name: "Multichain Wrapped BTC",
    decimals: 8,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", multiWBTC),
  },
  {
    symbol: assetSymbols.xcDOT,
    underlying: xcDOT,
    name: "ERC20 DOT",
    decimals: 10,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", xcDOT),
  },
  {
    symbol: assetSymbols.stDOT,
    underlying: stDOT,
    name: "Staked ERC20 DOT",
    decimals: 10,
    oracle: OracleTypes.DiaStDotPriceOracle,
    extraDocs: `<p><b>How to acquire this token</b><p/><br />
    <p>You can get stDOT by staking your xcDOT on <a href="https://polkadot.lido.fi/" target="_blank" style="color: #BCAC83; cursor="pointer">Lido on Polkadot</a></p>`,
  },
  {
    symbol: assetSymbols.wstDOT,
    underlying: wstDOT,
    name: "Wrapped Liquid Staked ERC20 DOT",
    decimals: 10,
    oracle: OracleTypes.DiaStDotPriceOracle,
    extraDocs: `<p><b>How to acquire this token</b><p/><br />
    <p>You can get wstDOT by staking your xcDOT on <a href="https://polkadot.lido.fi/wrap" target="_blank" style="color: #BCAC83; cursor="pointer">Lido on Polkadot</a></p>`,
  },
  {
    symbol: assetSymbols.ETH,
    underlying: ETH,
    name: "Multichain ETH",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", ETH),
  },
  {
    symbol: assetSymbols.BNB,
    underlying: BNB,
    name: "Multichain BNB",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", BNB),
  },
  {
    symbol: assetSymbols.multiDAI,
    underlying: multiDAI,
    name: "Multichain DAI Stablecoin",
    decimals: 6,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", multiDAI),
  },
  {
    symbol: assetSymbols.multiUSDC,
    underlying: multiUSDC,
    name: "Multichain USDC",
    decimals: 6,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", multiUSDC),
  },
  {
    symbol: assetSymbols.USDC_wh,
    underlying: whUSDC,
    name: "USD Coin",
    decimals: 6,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", whUSDC),
  },
  {
    symbol: assetSymbols.multiUSDT,
    underlying: multiUSDT,
    name: "Multichain USDT",
    decimals: 6,
    oracle: OracleTypes.DiaPriceOracle,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", multiUSDT),
  },
  {
    symbol: assetSymbols.FRAX,
    underlying: FRAX,
    name: "Frax",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", FRAX),
  },
  {
    symbol: assetSymbols.WGLMR,
    underlying: WGLMR,
    name: "Wrapped GLMR",
    decimals: 18,
    oracle: OracleTypes.FixedNativePriceOracle,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", WGLMR),
  },
  {
    symbol: assetSymbols.GLINT,
    underlying: GLINT,
    name: "Beamswap Token",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", GLINT),
  },
  {
    symbol: assetSymbols.FTM,
    underlying: FTM,
    name: "Mulitchain Fantom",
    decimals: 18,
    oracle: OracleTypes.DiaPriceOracle,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", FTM),
  },
  {
    symbol: assetSymbols["GLMR-USDC"],
    underlying: GLMR_USDC,
    name: "BeamSwap GLMR-USDC LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: beamSwapDocs(WGLMR, multiUSDC, "GLMR-USDC", GLMR_USDC),
  },
  {
    symbol: assetSymbols["GLMR-GLINT"],
    underlying: GLMR_GLINT,
    name: "BeamSwap GLMR-GLINT LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: beamSwapDocs(WGLMR, GLINT, "GLMR-GLINT", GLMR_GLINT),
  },
  {
    symbol: assetSymbols["USDC-ETH"],
    underlying: USDC_ETH,
    name: "BeamSwap ETH-USDC LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: beamSwapDocs(multiUSDC, ETH, "USDC-ETH", USDC_ETH),
  },
  {
    symbol: assetSymbols["WGLMR-xcDOT"],
    underlying: WGLMR_xcDOT,
    name: "BeamSwap WGLMR-xcDOT LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: beamSwapDocs(WGLMR, xcDOT, "WGLMR-xcDOT", WGLMR_xcDOT),
  },
  {
    symbol: assetSymbols["xcDOT-stDOT"],
    underlying: xcDOT_stDOT,
    name: "Curve.fi xcDOT-stDOT LP Token",
    decimals: 18,
    oracle: OracleTypes.CurveLpTokenPriceOracleNoRegistry,
    extraDocs: beamSwapDocs(xcDOT, stDOT, "xcDOT-stDOT", xcDOT_stDOT),
  },
  {
    symbol: assetSymbols["3pool"],
    underlying: threePool,
    name: "Curve.fi (nomad) DAI/USDT/USDC LP Token",
    decimals: 18,
    oracle: OracleTypes.CurveLpTokenPriceOracleNoRegistry,
    extraDocs: beamSwapStableDocs("nomad3pool", threePool),
  },
  {
    symbol: assetSymbols["STELLA-GLMR"],
    underlying: STELLA_GLMR,
    name: "Stella Swap STELLA/GLMR LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: stellaSwapDocs("ETH", STELLA, "STELLA-GLMR", STELLA_GLMR),
  },
  {
    symbol: assetSymbols["CELR-GLMR"],
    underlying: CELR_GLMR,
    name: "Stella Swap CELR/GLMR LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: stellaSwapDocs("ETH", CELR, "CELR-GLMR", CELR_GLMR),
  },
  {
    symbol: assetSymbols["ATOM-GLMR"],
    underlying: GLMR_ATOM,
    name: "Stella Swap ATOM/GLMR LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: stellaSwapDocs("ETH", ATOM, "ATOM-GLMR", GLMR_ATOM),
  },
  {
    symbol: assetSymbols["LDO-GLMR"],
    underlying: LDO_GLMR,
    name: "Stella Swap LDO/GLMR LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
    extraDocs: stellaSwapDocs("ETH", LDO, "LDO-GLMR", LDO_GLMR),
  },
  {
    symbol: assetSymbols.STELLA,
    underlying: STELLA,
    name: "Stellaswap Token",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", STELLA),
  },
  {
    symbol: assetSymbols.CELR,
    underlying: CELR,
    name: "CELR Token",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", CELR),
  },
  {
    symbol: assetSymbols.LDO,
    underlying: LDO,
    name: "LDO Token",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
    extraDocs: defaultDocs("https://moonbeam.moonscan.io", LDO),
  },
];

export default assets;
