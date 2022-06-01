import { SupportedChains } from "../enums";
import { ChainSupportedAssets } from "../types";

import {
  auroraAssets,
  bscAssets,
  chapelAssets,
  evmosAssets,
  evmosTestnetAssets,
  ganacheAssets,
  moonbaseAlphaAssets,
  moonbeamAssets,
  neonEvmDevnetAssets,
  neonEvmMainnetAssets,
} from "./assets";

const chainSupportedAssets: ChainSupportedAssets = {
  [SupportedChains.ganache]: ganacheAssets,
  [SupportedChains.evmos]: evmosAssets,
  [SupportedChains.evmos_testnet]: evmosTestnetAssets,
  [SupportedChains.bsc]: bscAssets,
  [SupportedChains.chapel]: chapelAssets,
  [SupportedChains.moonbase_alpha]: moonbaseAlphaAssets,
  [SupportedChains.moonbeam]: moonbeamAssets,
  [SupportedChains.aurora]: auroraAssets,
  [SupportedChains.neon_evm_devnet]: neonEvmDevnetAssets,
  [SupportedChains.neon_evm_mainnet]: neonEvmMainnetAssets,
};

export default chainSupportedAssets;
