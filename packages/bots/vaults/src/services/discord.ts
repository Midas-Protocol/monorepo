import { SupportedChains } from "@midas-capital/types";
import { MessageBuilder, Webhook } from "discord-webhook-node";

import config from "../config";
import { logger } from "../logger";

export class DiscordService {
  chainId: SupportedChains;

  private errorColor = 0xa83232;
  private warningColor = 0xfcdb03;
  private infoColor = 0x32a832;

  private hook = new Webhook(config.discordWebhookUrl);

  constructor(chainId: SupportedChains) {
    this.chainId = chainId;
  }

  private create() {
    return new MessageBuilder().addField("Chain", `Chain ID: ${SupportedChains[this.chainId]}`, true);
  }

  private async send(embed: MessageBuilder) {
    if (config.environment === "production") {
      await this.hook.send(embed);
    } else {
      logger.debug(`Would have sent alert to discord: ${JSON.stringify(embed)}`);
    }
  }

  public async sendVaultClaimFailure(msg: string) {
    const embed = this.create()
      .setTitle(`Vault Claim Failure`)
      .setDescription(msg)
      .setTimestamp()
      .setColor(this.errorColor);
    await this.send(embed);
  }

  public async sendVaultFetchingFailure(msg: string) {
    const embed = this.create()
      .setTitle("Vault Fetch Failure")
      .setDescription(msg)
      .setTimestamp()
      .setColor(this.warningColor);
    await this.send(embed);
  }
  public async sendVaultClaimingSuccess(txs: string[], msg: string) {
    const embed = this.create()
      .setTitle(`${txs.length} Vault claiming(s) succeeded`)
      .setDescription(msg)
      .setTimestamp()
      .setColor(this.infoColor);
    await this.send(embed);
  }
}
