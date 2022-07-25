import { OracleTypes } from "../../enums";
import { SupportedAsset } from "../../types";

import { assetSymbols } from "./index";

export const assets: SupportedAsset[] = [
  {
    symbol: assetSymbols.WETH,
    underlying: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    name: "Wrapped Ether",
    decimals: 18,
    oracle: OracleTypes.FixedNativePriceOracle,
  },
  {
    symbol: assetSymbols.TOUCH,
    underlying: "0x2A28662cCE2a1ddc00bC09c85672f6cA273ab5F5",
    name: "Touch Token",
    decimals: 18,
    oracle: OracleTypes.SimplePriceOracle,
  },
  {
    symbol: assetSymbols.TRIBE,
    underlying: "0xc876AaE0CFC5DfEa18D2333Cad600C909b9228cC",
    name: "Tribe Token",
    decimals: 18,
    oracle: OracleTypes.SimplePriceOracle,
  },
];

export default assets;
