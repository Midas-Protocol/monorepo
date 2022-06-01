import { SupportedAsset } from "../../types";

import { assetSymbols } from "./index";

export const assets: SupportedAsset[] = [
  // need to be refactored
  {
    symbol: assetSymbols.NEON,
    underlying: "",
    name: "NEON",
    decimals: 18,
  },
];

export default assets;
