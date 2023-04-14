import { JsonRpcProvider } from "@ethersproject/providers";
import { chainIdToConfig } from "@midas-capital/chains";
import { MidasSdk } from "@midas-capital/sdk";
import { Signer } from "ethers";

import { logger } from "./logger";

export const setUpSdk = (chainId: number, provider: Signer | JsonRpcProvider) => {
  return new MidasSdk(provider, chainIdToConfig[chainId], logger);
};
