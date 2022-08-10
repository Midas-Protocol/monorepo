import { OracleTypes } from "@midas-capital/types";

const baseOracles = [OracleTypes.FixedNativePriceOracle, OracleTypes.MasterPriceOracle, OracleTypes.SimplePriceOracle];

const oracles: OracleTypes[] = [
  ...baseOracles,
  OracleTypes.UniswapLpTokenPriceOracle,
  OracleTypes.UniswapTwapPriceOracleV2,
];

export default oracles;
