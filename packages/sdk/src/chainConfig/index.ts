import { Artifacts, ChainDeployment } from "../types";

export { default as chainSpecificAddresses } from "./addresses";
export { default as chainOracles } from "./oracles";
export { default as chainSpecificParams } from "./params";
export { default as chainPluginConfig } from "./plugin";
export { default as chainRedemptionStrategies } from "./redemptionStrategies";
export { default as chainLiquidationDefaults } from "./liquidation";
export { default as chainSupportedAssets } from "./supportedAssets";
export { default as assetSymbols } from "./assets/assetSymbols";

export const oracleConfig = (deployments: ChainDeployment, availableOracles: Array<string>) => {
  const asMap = new Map(availableOracles.map((o) => [o, { address: deployments[o].address }]));
  return Object.fromEntries(asMap);
};

export const irmConfig = (deployments: ChainDeployment) => {
  return {
    JumpRateModel: {
      address: deployments.JumpRateModel.address,
    },
    WhitePaperInterestRateModel: {
      address: deployments.WhitePaperInterestRateModel.address,
    },
  };
};
