import { assetSymbols, LiquidationDefaults, LiquidationStrategy, SupportedAsset } from "@midas-capital/types";

import { AddressZero } from "../constants";

import chainAddresses from "./addresses";
import { assets } from "./assets";

const liquidationDefaults: LiquidationDefaults = {
  DEFAULT_ROUTER: chainAddresses.UNISWAP_V2_ROUTER,
  ASSET_SPECIFIC_ROUTER: {},
  SUPPORTED_OUTPUT_CURRENCIES: [
    AddressZero,
    assets.find((a: SupportedAsset) => a.symbol === assetSymbols.WBNB)!.underlying,
  ],
  SUPPORTED_INPUT_CURRENCIES: [
    AddressZero,
    assets.find((a: SupportedAsset) => a.symbol === assetSymbols.WBNB)!.underlying,
  ],
  LIQUIDATION_STRATEGY: LiquidationStrategy.UNISWAP,
  MINIMUM_PROFIT_NATIVE: BigInt(0),
  LIQUIDATION_INTERVAL_SECONDS: 60,
  jarvisPools: [],
};

export default liquidationDefaults;
