import { Artifact, ChainDeployment } from "@midas-capital/types";

import AdjustableJumpRateModel from "@artifacts/AdjustableJumpRateModel.json";

const AdjustableJumpRateModel_PSTAKE_WBNB: Artifact = AdjustableJumpRateModel;
const AdjustableJumpRateModel_MIXBYTES_XCDOT: Artifact = AdjustableJumpRateModel;
const AdjustableJumpRateModel_TRANSFERO_BRZ: Artifact = AdjustableJumpRateModel;
const AdjustableJumpRateModel_TRANSFERO_BTCB_ETH_MAI_WBNB: Artifact = AdjustableJumpRateModel;
const AdjustableJumpRateModel_STADER_WBNB: Artifact = AdjustableJumpRateModel;
const AdjustableJumpRateModel_MIXBYTES_USDC: Artifact = AdjustableJumpRateModel;
const AdjustableJumpRateModel_JARVIS_jBRL: Artifact = AdjustableJumpRateModel;
const AdjustableJumpRateModel_JARVIS_jEUR: Artifact = AdjustableJumpRateModel;

import AnkrBNBInterestRateModel from "@artifacts/AnkrBNBInterestRateModel.json";
import AnkrCertificateTokenPriceOracle from "@artifacts/AnkrCertificateTokenPriceOracle.json";

import BalancerLpTokenPriceOracle from "@artifacts/BalancerLpTokenPriceOracle.json";
import ChainlinkPriceOracleV2 from "@artifacts/ChainlinkPriceOracleV2.json";

import CurveLpTokenPriceOracleNoRegistry from "@artifacts/CurveLpTokenPriceOracleNoRegistry.json";
import DAIInterestRateModelV2 from "@artifacts/DAIInterestRateModelV2.json";
import DiaPriceOracle from "@artifacts/DiaPriceOracle.json";

import FixedNativePriceOracle from "@artifacts/FixedNativePriceOracle.json";
import GelatoGUniPriceOracle from "@artifacts/GelatoGUniPriceOracle.json";

import JumpRateModel from "@artifacts/JumpRateModel.json";
import MasterPriceOracle from "@artifacts/MasterPriceOracle.json";
import SimplePriceOracle from "@artifacts/SimplePriceOracle.json";
import StkBNBPriceOracle from "@artifacts/StkBNBPriceOracle.json";
import UniswapLpTokenPriceOracle from "@artifacts/UniswapLpTokenPriceOracle.json";
import UniswapTwapPriceOracleV2 from "@artifacts/UniswapTwapPriceOracleV2.json";
import UniswapTwapPriceOracleV2Root from "@artifacts/UniswapTwapPriceOracleV2Root.json";
import WhitePaperInterestRateModel from "@artifacts/WhitePaperInterestRateModel.json";
const JumpRateModel_MIMO_002_004_4_08: Artifact = JumpRateModel;
const JumpRateModel_JARVIS_002_004_4_08: Artifact = JumpRateModelArtifact;

const ARTIFACTS = {
  ChainlinkPriceOracleV2,
  DAIInterestRateModelV2,
  DiaPriceOracle,
  AdjustableJumpRateModel,
  AdjustableJumpRateModel_PSTAKE_WBNB,
  AdjustableJumpRateModel_MIXBYTES_XCDOT,
  AdjustableJumpRateModel_TRANSFERO_BRZ,
  AdjustableJumpRateModel_TRANSFERO_BTCB_ETH_MAI_WBNB,
  AdjustableJumpRateModel_STADER_WBNB,
  AdjustableJumpRateModel_MIXBYTES_USDC,
  AdjustableJumpRateModel_JARVIS_jBRL,
  AdjustableJumpRateModel_JARVIS_jEUR,
  JumpRateModel_MIMO_002_004_4_08,
  JumpRateModel_JARVIS_002_004_4_08,
  AnkrBNBInterestRateModel,
  MasterPriceOracle,
  FixedNativePriceOracle,
  CurveLpTokenPriceOracleNoRegistry,
  UniswapLpTokenPriceOracle,
  UniswapTwapPriceOracleV2Root,
  SimplePriceOracle,
  BalancerLpTokenPriceOracle,
  AnkrCertificateTokenPriceOracle,
  StkBNBPriceOracle,
  GelatoGUniPriceOracle,
  UniswapTwapPriceOracleV2,
  WhitePaperInterestRateModel,
};

export type Artifacts = typeof ARTIFACTS;
export default ARTIFACTS;

export const oracleConfig = (deployments: ChainDeployment, artifacts: Artifacts, availableOracles: Array<string>) => {
  const asMap = new Map(availableOracles.map((o) => [o, { abi: artifacts[o].abi, address: deployments[o].address }]));
  return Object.fromEntries(asMap);
};

export const irmConfig = (deployments: ChainDeployment, artifacts: Artifacts, availableIrms: Array<string>) => {
  const asMap = new Map(availableIrms.map((o) => [o, { abi: artifacts[o].abi, address: deployments[o].address }]));
  return Object.fromEntries(asMap);
};
