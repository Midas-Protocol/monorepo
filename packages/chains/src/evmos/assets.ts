import { assetSymbols, OracleTypes, SupportedAsset } from "@midas-capital/types";

export const assets: SupportedAsset[] = [
  {
    symbol: assetSymbols.ATOM,
    underlying: "0xC5e00D3b04563950941f7137B5AfA3a534F0D6d6",
    name: "Cosmos Hub",
    decimals: 6,
    oracle: OracleTypes.FluxPriceOracle,
  },
  {
    symbol: assetSymbols.WEVMOS,
    underlying: "0xD4949664cD82660AaE99bEdc034a0deA8A0bd517",
    name: "Wrapped EVMOS",
    decimals: 18,
    oracle: OracleTypes.FixedNativePriceOracle,
  },
  {
    symbol: assetSymbols.gUSDT,
    underlying: "0xecEEEfCEE421D8062EF8d6b4D814efe4dc898265",
    name: "Gravity Bridged USDT",
    decimals: 6,
    oracle: OracleTypes.AdrastiaPriceOracle,
  },
  {
    symbol: assetSymbols.gUSDC,
    underlying: "0x5FD55A1B9FC24967C4dB09C513C3BA0DFa7FF687",
    name: "Gravity Bridged USDC",
    decimals: 6,
    oracle: OracleTypes.AdrastiaPriceOracle,
  },
  {
    symbol: assetSymbols.axlUSDC,
    underlying: "0x15C3Eb3B621d1Bff62CbA1c9536B7c1AE9149b57",
    name: "Axelar Bridged USD Coin",
    decimals: 6,
    oracle: OracleTypes.FluxPriceOracle,
  },
  {
    symbol: assetSymbols.axlWETH,
    underlying: "0x50dE24B3f0B3136C50FA8A3B8ebc8BD80a269ce5",
    name: "Axelar Bridged WETH",
    decimals: 18,
    oracle: OracleTypes.AdrastiaPriceOracle,
  },
  {
    symbol: assetSymbols.ceWETH,
    underlying: "0x50dE24B3f0B3136C50FA8A3B8ebc8BD80a269ce5",
    name: "Celer Bridged WETH",
    decimals: 18,
    oracle: OracleTypes.AdrastiaPriceOracle,
  },
  {
    symbol: assetSymbols.FRAX,
    underlying: "0xE03494D0033687543a80c9B1ca7D6237F2EA8BD8",
    name: "Frax",
    decimals: 18,
    oracle: OracleTypes.FluxPriceOracle,
  },
  {
    symbol: assetSymbols.gDAI,
    underlying: "0xd567B3d7B8FE3C79a1AD8dA978812cfC4Fa05e75",
    name: "Dai Stablecoin",
    decimals: 18,
    oracle: OracleTypes.AdrastiaPriceOracle,
  },
  {
    symbol: assetSymbols.gWBTC,
    underlying: "0x1D54EcB8583Ca25895c512A8308389fFD581F9c9",
    name: "Gravity Bridged Wrapped BTC",
    decimals: 8,
    oracle: OracleTypes.FluxPriceOracle,
  },
  {
    symbol: assetSymbols.axlWBTC,
    underlying: "0xF5b24c0093b65408ACE53df7ce86a02448d53b25",
    name: "Axelar Bridged Wrapped BTC",
    decimals: 8,
    oracle: OracleTypes.AdrastiaPriceOracle,
  },
  {
    symbol: assetSymbols.OSMO,
    underlying: "0xFA3C22C069B9556A4B2f7EcE1Ee3B467909f4864",
    name: "Osmosis",
    decimals: 6,
    oracle: OracleTypes.AdrastiaPriceOracle,
  },
  {
    symbol: assetSymbols.JUNO,
    underlying: "0x3452e23F9c4cC62c70B7ADAd699B264AF3549C19",
    name: "Juno",
    decimals: 6,
    oracle: OracleTypes.AdrastiaPriceOracle,
  },
];

export default assets;
