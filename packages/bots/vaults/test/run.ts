import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "ethers";

import config from "../src/config";
import { logger } from "../src/logger";
import { VaultService } from "../src/services";
import { setUpSdk } from "../src/setUpSdk";

(async function () {
  const chainId: number = config.chainId;
  const provider = new JsonRpcProvider(config.rpcUrl);
  const signer = new Wallet(config.adminPrivateKey, provider);
  const midasSdk = setUpSdk(chainId, signer);

  logger.info(`Config for bot: ${JSON.stringify(config)}`);

  const vault = new VaultService(midasSdk);
  const vaults = await vault.fetchVaults();

  logger.info(`Found ${vaults.length} vaults`);
  await vault.claimAllRewards(vaults);
})();
