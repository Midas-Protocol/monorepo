import { MidasSdk } from "@midas-capital/sdk";
import { VaultData } from "@midas-capital/types";

import { EXCLUDED_ERROR_CODES } from "../config";
import { logger } from "../logger";

import { DiscordService } from "./discord";

export class VaultService {
  sdk: MidasSdk;
  alert: DiscordService;

  constructor(midasSdk: MidasSdk) {
    this.sdk = midasSdk;
    this.alert = new DiscordService(midasSdk.chainId);
  }
  async fetchVaults(): Promise<VaultData[]> {
    try {
      return await this.sdk.getAllVaults();
    } catch (error: any) {
      if (!Object.values(EXCLUDED_ERROR_CODES).includes(error.code)) {
        const msg = `Error fetching vaults: ${error}`;
        logger.error(msg);
        this.alert.sendVaultFetchingFailure(msg);
      }
      return [];
    }
  }

  async claimAllRewards(vaults: VaultData[]): Promise<void> {
    const erroredVaults: VaultData[] = [];
    const succeededVaults: VaultData[] = [];
    const succeededMessages: string[] = [];
    const errorMessages: string[] = [];

    for (const vault of vaults) {
      if (vault.adaptersCount > 0) {
        const vaultContract = this.sdk.createOptimizedAPRVault(vault.vault, this.sdk.signer);
        try {
          const tx = await vaultContract.pullAccruedVaultRewards();
          const response = await tx.wait();
          const msg = `Claimed rewards for vault: ${vault.vault} (${vault.symbol}) - ${response.transactionHash}`;
          logger.info(msg);
          succeededVaults.push(vault);
          succeededMessages.push(msg);
        } catch (error: any) {
          if (!Object.values(EXCLUDED_ERROR_CODES).includes(error.code)) {
            const msg = `Error claiming rewards for vault ${vault.vault} (${vault.symbol}): ${error}`;
            logger.error(msg);
            errorMessages.push(msg);
            erroredVaults.push(vault);
          }
        }
      }
    }
    if (erroredVaults.length > 0) {
      logger.warn(`${erroredVaults.length} claimings failed`);
      const logMsg = erroredVaults
        .map((vault, index) => {
          return `# Vault Claiming ${index}:\n - Vault: ${vault.symbol} (${vault.vault})\n - Error: ${errorMessages[index]}`;
        })
        .join("\n");
      this.alert.sendVaultClaimFailure(logMsg);
      logger.error(logMsg);
    }
    if (succeededVaults.length > 0) {
      logger.info(`${succeededVaults.length} vault claims succeeded`);
      const msg = succeededVaults
        .map((vault, index) => {
          return `\n# Vault Claiming ${index}:\n - Vault: ${vault.symbol} (${vault.vault})\n - TX Hash: ${succeededMessages[index]}`;
        })
        .join("\n");

      logger.info(msg);
      this.alert.sendVaultClaimingSuccess(succeededMessages, msg);
    }
  }
}
