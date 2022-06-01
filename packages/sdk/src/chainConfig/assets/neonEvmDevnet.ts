import { SupportedAsset } from "../../types";

import { assetSymbols } from "./index";

export const assets: SupportedAsset[] = [
  // need to be refactored
  {
    symbol: assetSymbols.WNEON,
    underlying: "",
    name: "Wrapped NEON",
    decimals: 18,
  },
];

export default assets;
