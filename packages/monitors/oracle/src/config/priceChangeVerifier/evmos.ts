import { assetFilter, assetSymbols, SupportedChains } from "@midas-capital/types";

import { chainIdToConfig, PriceChangeVerifierAsset } from "../../types";

import { stablePriceChangeDefaults } from "./defaults";

const chainAssets = chainIdToConfig[SupportedChains.evmos].assets;

// Smaller Cap
// LSD
// Stables

// Bridged Assets

const axlUSDC = assetFilter(chainAssets, assetSymbols.axlUSDC);
const ceUSDC = assetFilter(chainAssets, assetSymbols.ceUSDC);
const gWETH = assetFilter(chainAssets, assetSymbols.gWETH);

const assets: PriceChangeVerifierAsset[] = [
  // Bridged Assets
  {
    ...axlUSDC,
    ...stablePriceChangeDefaults,
  },
  {
    ...ceUSDC,
    ...stablePriceChangeDefaults,
  },
  {
    ...gWETH,
    ...stablePriceChangeDefaults,
  },
];

export default assets;
