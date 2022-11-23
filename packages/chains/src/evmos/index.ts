import { ChainConfig, SupportedChains } from "@midas-capital/types";

// import deployments from "../../deployments/evmos.json";

import chainAddresses from "./addresses";
import assets from "./assets";
import fundingStrategies from "./fundingStrategies";
import irms from "./irms";
import liquidationDefaults from "./liquidation";
import oracles from "./oracles";
import specificParams from "./params";
import deployedPlugins from "./plugins";
import redemptionStrategies from "./redemptionStrategies";

const chainConfig: ChainConfig = {
  chainId: SupportedChains.evmos,
  chainAddresses,
  assets,
  irms,
  liquidationDefaults,
  oracles,
  specificParams,
  deployedPlugins,
  redemptionStrategies,
  fundingStrategies,
  chainDeployments: {},
};

export default chainConfig;
