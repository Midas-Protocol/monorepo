import { JsonRpcProvider } from "@ethersproject/providers";
import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { Wallet } from "ethers";

import config from "./config";
import { logger } from "./logger";
import { VaultService } from "./services";
import { setUpSdk } from "./setUpSdk";

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logger.info(`Event: ${JSON.stringify(event)}`);
  logger.info(`Context: ${JSON.stringify(context)}`);

  const provider = new JsonRpcProvider(config.rpcUrl);
  const signer = new Wallet(config.adminPrivateKey, provider);

  const sdk = setUpSdk(config.chainId, signer);
  const vault = new VaultService(sdk);

  logger.info(`Starting liquidation bot on chain: ${config.chainId}`);

  const vaults = await vault.fetchVaults();

  logger.info(`Found ${vaults.length} vaults `);
  await vault.claimAllRewards(vaults);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "hello world",
    }),
  };
};
