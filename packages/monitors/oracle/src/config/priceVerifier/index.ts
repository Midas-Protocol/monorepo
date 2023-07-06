import { SupportedChains } from "@ionicprotocol/types";

import { PriceVerifierAsset } from "../../types";

import { default as bscAssets } from "./bsc";
import { default as evmosAssets } from "./evmos";
import { default as fantomAssets } from "./fantom";
import { default as moonbeamAssets } from "./moonbeam";
import { default as polygonAssets } from "./polygon";

export const chainIdToAssets: { [chainId: number]: PriceVerifierAsset[] } = {
  [SupportedChains.bsc]: bscAssets,
  [SupportedChains.moonbeam]: moonbeamAssets,
  [SupportedChains.fantom]: fantomAssets,
  [SupportedChains.polygon]: polygonAssets,
  [SupportedChains.evmos]: evmosAssets,
};
