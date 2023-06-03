import { assetSymbols, LiquidationDefaults, LiquidationStrategy, underlying } from "@midas-capital/types";

import { AddressZero } from "../constants";

import chainAddresses from "./addresses";
import { assets } from "./assets";

const liquidationDefaults: LiquidationDefaults = {
  DEFAULT_ROUTER: chainAddresses.UNISWAP_V2_ROUTER,
  ASSET_SPECIFIC_ROUTER: {},
  SUPPORTED_OUTPUT_CURRENCIES: [AddressZero, underlying(assets, assetSymbols.WETH)],
  SUPPORTED_INPUT_CURRENCIES: [AddressZero, underlying(assets, assetSymbols.WETH)],
  LIQUIDATION_STRATEGY: LiquidationStrategy.DEFAULT,
  MINIMUM_PROFIT_NATIVE: BigInt(0),
  LIQUIDATION_INTERVAL_SECONDS: 2,
  jarvisPools: [],
};

export default liquidationDefaults;
