import { OracleTypes } from "../../enums";
import { SupportedAsset } from "../../types";

import { assetSymbols } from "./index";

export const assets: SupportedAsset[] = [
  {
    symbol: assetSymbols.ATOM,
    underlying: "0x27292cf0016E5dF1d8b37306B2A98588aCbD6fCA",
    name: "Axelar ATOM",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.madWBTC,
    underlying: "0x1DC78Acda13a8BC4408B207c9E48CDBc096D95e0",
    name: "Nomad Wrapped BTC",
    decimals: 8,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.xcDOT,
    underlying: "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080",
    name: "ERC20 DOT",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.ETH,
    underlying: "0xfA9343C3897324496A05fC75abeD6bAC29f8A40f",
    name: "Multichain ETH",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.BNB,
    underlying: "0xc9BAA8cfdDe8E328787E29b4B078abf2DaDc2055",
    name: "Multichain BNB",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.madUSDC,
    underlying: "0x8f552a71EFE5eeFc207Bf75485b356A0b3f01eC9",
    name: "Nomad USDC",
    decimals: 6,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.multiUSDC,
    underlying: "0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b",
    name: "Multichain USDC",
    decimals: 6,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.madUSDT,
    underlying: "0x8e70cD5B4Ff3f62659049e74b6649c6603A0E594",
    name: "Nomad USDT",
    decimals: 6,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.multiUSDT,
    underlying: "0xeFAeeE334F0Fd1712f9a8cc375f427D9Cdd40d73",
    name: "Multichain USDT",
    decimals: 6,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.FRAX,
    underlying: "0x322E86852e492a7Ee17f28a78c663da38FB33bfb",
    name: "Frax",
    decimals: 18,
    oracle: OracleTypes.ChainlinkPriceOracleV2,
  },
  {
    symbol: assetSymbols.WGLMR,
    underlying: "0xAcc15dC74880C9944775448304B263D191c6077F",
    name: "Wrapped GLMR",
    decimals: 18,
    oracle: OracleTypes.FixedNativePriceOracle,
  },
  {
    symbol: assetSymbols.GLINT,
    underlying: "0xcd3B51D98478D53F4515A306bE565c6EebeF1D58",
    name: "Beamswap Token",
    decimals: 18,
    oracle: OracleTypes.UniswapTwapPriceOracleV2,
  },
  {
    symbol: assetSymbols.FTM,
    underlying: "0xC19281F22A075E0F10351cd5D6Ea9f0AC63d4327",
    name: "Mulitchain Fantom",
    decimals: 18,
    oracle: OracleTypes.DiaPriceOracle,
  },
  {
    symbol: assetSymbols["GLMR-USDC"],
    underlying: "0xb929914B89584b4081C7966AC6287636F7EfD053",
    name: "BeamSwap GLMR-USDC LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
  },
  {
    symbol: assetSymbols["GLMR-GLINT"],
    underlying: "0x99588867e817023162F4d4829995299054a5fC57",
    name: "BeamSwap GLMR-GLINT LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
  },
  {
    symbol: assetSymbols["USDC-ETH"],
    underlying: "0x6BA3071760d46040FB4dc7B627C9f68efAca3000",
    name: "BeamSwap ETH-USDC LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
  },
  {
    symbol: assetSymbols["WGLMR-xcDOT"],
    underlying: "0xd8FbdeF502770832E90a6352b275f20F38269b74",
    name: "BeamSwap WGLMR-xcDOT LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
  },
  {
    symbol: assetSymbols["GLMR-madUSDC"],
    underlying: "0x6Ba38f006aFe746B9A0d465e53aB4182147AC3D7",
    name: "BeamSwap GLMR-madUSDC LP Token",
    decimals: 18,
    oracle: OracleTypes.UniswapLpTokenPriceOracle,
  },
];

export default assets;
