import { chainIdToConfig } from "@ionicprotocol/chains";

import { ILiquidatorsRegistry } from "../../../typechain/ILiquidatorsRegistry";
import { LiquidatorsRegistryConfigFnParams } from "../types";

export const configureLiquidatorsRegistry = async ({
  ethers,
  getNamedAccounts,
  chainId,
}: LiquidatorsRegistryConfigFnParams): Promise<void> => {
  const { deployer } = await getNamedAccounts();

  const lr = await ethers.getContract("LiquidatorsRegistry");
  const liquidatorsRegistry = (await ethers.getContractAt(
    "ILiquidatorsRegistry",
    lr.address,
    deployer
  )) as ILiquidatorsRegistry;

  const strategies: string[] = [];
  const inputTokens: string[] = [];
  const outputTokens: string[] = [];

  for (const redemptionStrategyConfig of chainIdToConfig[chainId].redemptionStrategies) {
    const { inputToken, strategy, outputToken } = redemptionStrategyConfig;
    const redemptionStrategy = await ethers.getContract(strategy, deployer);

    strategies.push(redemptionStrategy.address);
    inputTokens.push(inputToken);
    outputTokens.push(outputToken);
  }
  const matching = await liquidatorsRegistry.callStatic.pairsStrategiesMatch(strategies, inputTokens, outputTokens);
  if (!matching) {
    const tx = await liquidatorsRegistry._resetRedemptionStrategies(strategies, inputTokens, outputTokens);
    console.log("waiting for tx ", tx.hash);
    await tx.wait();
    console.log("_resetRedemptionStrategies: ", tx.hash);
  } else {
    console.log("no redemption strategies to configure in the liquidators registry");
  }
};
