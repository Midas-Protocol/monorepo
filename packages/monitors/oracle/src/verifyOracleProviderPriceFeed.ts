import { Provider } from "@ethersproject/providers";
import { MidasSdk, OracleConfig, OracleTypes } from "@midas-capital/sdk";
import { Contract } from "ethers";

import { config } from "./config";

import { InvalidReason, logger, SupportedAssetPriceValidity } from "./index";

export default async function verifyOracleProviderPriceFeed(
  midasSdk: MidasSdk,
  oracle: OracleTypes,
  underlying: string
): Promise<SupportedAssetPriceValidity> {
  switch (oracle) {
    case OracleTypes.ChainlinkPriceOracleV2:
      return await verifyChainLinkOraclePriceFeed(midasSdk.provider, midasSdk.oracles, underlying);
    case OracleTypes.DiaPriceOracle:
      return await verifyDiaOraclePriceFeed(midasSdk.oracles, underlying);
    case OracleTypes.FluxPriceOracle:
      return await verifyFluxOraclePriceFeed(midasSdk.oracles, underlying);
    case OracleTypes.AnkrBNBcPriceOracle:
      return await verifyAnkrOraclePriceFeed(midasSdk.oracles, underlying);
    default:
      throw `No verification available oracle provider ${oracle}, underlying: ${underlying}`;
  }
}

async function verifyChainLinkOraclePriceFeed(
  provider: Provider,
  oracleConfig: OracleConfig,
  underlying: string
): Promise<SupportedAssetPriceValidity> {
  logger.debug(`Verifying ChainLink oracle for ${underlying}`);
  const chainLinkOracle = new Contract(
    oracleConfig[OracleTypes.ChainlinkPriceOracleV2].address,
    oracleConfig[OracleTypes.ChainlinkPriceOracleV2].abi,
    provider
  );
  const feedAddress = await chainLinkOracle.callStatic.priceFeeds(underlying);
  const chainLinkFeed = new Contract(
    feedAddress,
    [
      "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    ],
    provider
  );
  const [, , , updatedAt] = await chainLinkFeed.callStatic.latestRoundData();
  const updatedAtts = updatedAt.toNumber();
  const timeSinceLastUpdate = Math.floor(Date.now() / 1000) - updatedAtts;
  const isValid = timeSinceLastUpdate < config.maxObservationDelay;
  return {
    valid: isValid,
    invalidReason: isValid ? null : InvalidReason.LAST_OBSERVATION_TOO_OLD,
    extraInfo: isValid
      ? null
      : {
          message: `Last updated happened ${timeSinceLastUpdate} seconds ago, more than than the max delay of ${config.maxObservationDelay}`,
          extraData: {
            timeSinceLastUpdate,
          },
        },
  };
}

async function verifyDiaOraclePriceFeed(
  oracleConfig: OracleConfig,
  underlying: string
): Promise<SupportedAssetPriceValidity> {
  console.log(oracleConfig, underlying);
  return { valid: true, extraInfo: null, invalidReason: null };
}

async function verifyFluxOraclePriceFeed(
  oracleConfig: OracleConfig,
  underlying: string
): Promise<SupportedAssetPriceValidity> {
  console.log(oracleConfig, underlying);
  return { valid: true, extraInfo: null, invalidReason: null };
}

async function verifyAnkrOraclePriceFeed(
  oracleConfig: OracleConfig,
  underlying: string
): Promise<SupportedAssetPriceValidity> {
  console.log(oracleConfig, underlying);
  return { valid: true, extraInfo: null, invalidReason: null };
}
