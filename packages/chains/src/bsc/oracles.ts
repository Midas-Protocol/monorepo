import { OracleTypes } from "@midas-capital/types";

const baseOracles = [OracleTypes.FixedNativePriceOracle, OracleTypes.MasterPriceOracle, OracleTypes.SimplePriceOracle];

const oracles: OracleTypes[] = [
  ...baseOracles,
  OracleTypes.ChainlinkPriceOracleV2,
  OracleTypes.CurveLpTokenPriceOracleNoRegistry,
  OracleTypes.UniswapLpTokenPriceOracle,
  OracleTypes.UniswapTwapPriceOracleV2,
  OracleTypes.StkBNBPriceOracle,
];
export default oracles;
