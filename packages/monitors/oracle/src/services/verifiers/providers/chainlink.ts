import { Contract } from "ethers";

import { logger } from "../../../index";
import { FeedVerifierConfig, InvalidReason, PriceFeedValidity, VerifyFeedParams } from "../../../types";

export async function verifyChainLinkOraclePriceFeed(
  { midasSdk, underlyingOracle, underlying }: VerifyFeedParams,
  config: FeedVerifierConfig
): Promise<PriceFeedValidity> {
  logger.debug(`Verifying ChainLink oracle for ${underlying}`);

  const feedAddress = await underlyingOracle.callStatic.priceFeeds(underlying);
  const chainLinkFeed = new Contract(
    feedAddress,
    [
      "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
      "function getRoundData(uint80 roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    ],
    midasSdk.provider
  );
  const [roundId, value, , updatedAt] = await chainLinkFeed.callStatic.latestRoundData();
  const [, previousValue, ,] = await chainLinkFeed.callStatic.getRoundData(roundId.sub(1));

  const deviation = Math.abs((value.toNumber() - previousValue.toNumber()) / previousValue.toNumber()) * 100;
  const updatedAtts = updatedAt.toNumber();
  const timeSinceLastUpdate = Math.floor(Date.now() / 1000) - updatedAtts;

  // TODO: configure deviation threshold for each feed
  if (timeSinceLastUpdate > config.maxObservationDelay && deviation > 1) {
    return {
      invalidReason: InvalidReason.LAST_OBSERVATION_TOO_OLD,
      message: `Last updated happened ${timeSinceLastUpdate} seconds ago, more than than the max delay of ${config.maxObservationDelay}`,
    };
  }
  return true;
}
