// TODO split up into ABI and Bytecode

import { Artifact, ChainDeployment } from "@midas-capital/types";

import AnkrBNBInterestRateModelArtifact from "../lib/contracts/out/AnkrBNBInterestRateModel.sol/AnkrBNBInterestRateModel.json";
import CErc20DelegateArtifact from "../lib/contracts/out/CErc20Delegate.sol/CErc20Delegate.json";
import CErc20DelegatorArtifact from "../lib/contracts/out/CErc20Delegator.sol/CErc20Delegator.json";
import CErc20PluginDelegateArtifact from "../lib/contracts/out/CErc20PluginDelegate.sol/CErc20PluginDelegate.json";
import CErc20PluginRewardsDelegateArtifact from "../lib/contracts/out/CErc20PluginRewardsDelegate.sol/CErc20PluginRewardsDelegate.json";
import CEtherDelegateArtifact from "../lib/contracts/out/CEtherDelegate.sol/CEtherDelegate.json";
import CEtherDelegatorArtifact from "../lib/contracts/out/CEtherDelegator.sol/CEtherDelegator.json";
import ChainlinkPriceOracleV2Artifact from "../lib/contracts/out/ChainlinkPriceOracleV2.sol/ChainlinkPriceOracleV2.json";
import ComptrollerArtifact from "../lib/contracts/out/Comptroller.sol/Comptroller.json";
import CTokenInterfaceArtifact from "../lib/contracts/out/CTokenInterfaces.sol/CTokenInterface.json";
import CurveLpTokenPriceOracleNoRegistryArtifact from "../lib/contracts/out/CurveLpTokenPriceOracleNoRegistry.sol/CurveLpTokenPriceOracleNoRegistry.json";
import DAIInterestRateModelV2Artifact from "../lib/contracts/out/DAIInterestRateModelV2.sol/DAIInterestRateModelV2.json";
import EIP20InterfaceArtifact from "../lib/contracts/out/EIP20Interface.sol/EIP20Interface.json";
import ERC20Artifact from "../lib/contracts/out/ERC20.sol/ERC20.json";
import FixedNativePriceOracleArtifact from "../lib/contracts/out/FixedNativePriceOracle.sol/FixedNativePriceOracle.json";
import FlywheelStaticRewardsArtifact from "../lib/contracts/out/FlywheelStaticRewards.sol/FlywheelStaticRewards.json";
import FuseFlywheelCoreArtifact from "../lib/contracts/out/FuseFlywheelCore.sol/FuseFlywheelCore.json";
import FuseFlywheelDynamicRewardsArtifacts from "../lib/contracts/out/FuseFlywheelDynamicRewards.sol/FuseFlywheelDynamicRewards.json";
import JumpRateModelArtifact from "../lib/contracts/out/JumpRateModel.sol/JumpRateModel.json";
import MasterPriceOracleArtifact from "../lib/contracts/out/MasterPriceOracle.sol/MasterPriceOracle.json";
import MidasFlywheelCoreArtifact from "../lib/contracts/out/MidasFlywheelCore.sol/MidasFlywheelCore.json";
import RewardsDistributorDelegateArtifact from "../lib/contracts/out/RewardsDistributorDelegate.sol/RewardsDistributorDelegate.json";
import RewardsDistributorDelegatorArtifact from "../lib/contracts/out/RewardsDistributorDelegator.sol/RewardsDistributorDelegator.json";
import SimplePriceOracleArtifact from "../lib/contracts/out/SimplePriceOracle.sol/SimplePriceOracle.json";
import UniswapLpTokenPriceOracleArtifact from "../lib/contracts/out/UniswapLpTokenPriceOracle.sol/UniswapLpTokenPriceOracle.json";
import UniswapTwapPriceOracleV2Artifact from "../lib/contracts/out/UniswapTwapPriceOracleV2.sol/UniswapTwapPriceOracleV2.json";
import UniswapTwapPriceOracleV2RootArtifact from "../lib/contracts/out/UniswapTwapPriceOracleV2Root.sol/UniswapTwapPriceOracleV2Root.json";
import UnitrollerArtifact from "../lib/contracts/out/Unitroller.sol/Unitroller.json";
import WhitePaperInterestRateModelArtifact from "../lib/contracts/out/WhitePaperInterestRateModel.sol/WhitePaperInterestRateModel.json";

const CErc20Delegate: Artifact = CErc20DelegateArtifact;
const CErc20Delegator: Artifact = CErc20DelegatorArtifact;
const CErc20PluginDelegate: Artifact = CErc20PluginDelegateArtifact;
const CErc20PluginRewardsDelegate: Artifact = CErc20PluginRewardsDelegateArtifact;
const CEtherDelegate: Artifact = CEtherDelegateArtifact;
const CEtherDelegator: Artifact = CEtherDelegatorArtifact;
const ChainlinkPriceOracleV2: Artifact = ChainlinkPriceOracleV2Artifact;
const Comptroller: Artifact = ComptrollerArtifact;
const CTokenInterface: Artifact = CTokenInterfaceArtifact;
const DAIInterestRateModelV2: Artifact = DAIInterestRateModelV2Artifact;
const EIP20Interface: Artifact = EIP20InterfaceArtifact;
const ERC20: Artifact = ERC20Artifact;
const FuseFlywheelDynamicRewards: Artifact = FuseFlywheelDynamicRewardsArtifacts;
const FlywheelStaticRewards: Artifact = FlywheelStaticRewardsArtifact;
const FuseFlywheelCore: Artifact = FuseFlywheelCoreArtifact;
const JumpRateModel: Artifact = JumpRateModelArtifact;
const JumpRateModel_MIMO_002_004_4_08: Artifact = JumpRateModelArtifact;
const AnkrBNBInterestRateModel: Artifact = AnkrBNBInterestRateModelArtifact;
const MasterPriceOracle: Artifact = MasterPriceOracleArtifact;
const MidasFlywheelCore: Artifact = MidasFlywheelCoreArtifact;
const FixedNativePriceOracle: Artifact = FixedNativePriceOracleArtifact;
const CurveLpTokenPriceOracleNoRegistry: Artifact = CurveLpTokenPriceOracleNoRegistryArtifact;
const UniswapLpTokenPriceOracle: Artifact = UniswapLpTokenPriceOracleArtifact;
const UniswapTwapPriceOracleV2Root: Artifact = UniswapTwapPriceOracleV2RootArtifact;
const RewardsDistributorDelegate: Artifact = RewardsDistributorDelegateArtifact;
const RewardsDistributorDelegator: Artifact = RewardsDistributorDelegatorArtifact;
const SimplePriceOracle: Artifact = SimplePriceOracleArtifact;
const UniswapTwapPriceOracleV2: Artifact = UniswapTwapPriceOracleV2Artifact;
const Unitroller: Artifact = UnitrollerArtifact;
const WhitePaperInterestRateModel: Artifact = WhitePaperInterestRateModelArtifact;

const ARTIFACTS = {
  CErc20Delegate,
  CErc20Delegator,
  CErc20PluginDelegate,
  CErc20PluginRewardsDelegate,
  CEtherDelegate,
  CEtherDelegator,
  ChainlinkPriceOracleV2,
  Comptroller,
  CTokenInterface,
  DAIInterestRateModelV2,
  EIP20Interface,
  ERC20,
  FuseFlywheelDynamicRewards,
  FlywheelStaticRewards,
  FuseFlywheelCore,
  JumpRateModel,
  JumpRateModel_MIMO_002_004_4_08,
  AnkrBNBInterestRateModel,
  MasterPriceOracle,
  MidasFlywheelCore,
  FixedNativePriceOracle,
  CurveLpTokenPriceOracleNoRegistry,
  UniswapLpTokenPriceOracle,
  UniswapTwapPriceOracleV2Root,
  RewardsDistributorDelegate,
  RewardsDistributorDelegator,
  SimplePriceOracle,
  UniswapTwapPriceOracleV2,
  Unitroller,
  WhitePaperInterestRateModel,
};

export type Artifacts = typeof ARTIFACTS;

export {
  ARTIFACTS,
  CErc20Delegate,
  CErc20Delegator,
  CErc20PluginDelegate,
  CErc20PluginRewardsDelegate,
  CEtherDelegate,
  CEtherDelegator,
  ChainlinkPriceOracleV2,
  Comptroller,
  CTokenInterface,
  DAIInterestRateModelV2,
  EIP20Interface,
  ERC20,
  FuseFlywheelDynamicRewards,
  FlywheelStaticRewards,
  FuseFlywheelCore,
  MidasFlywheelCore,
  JumpRateModel,
  JumpRateModel_MIMO_002_004_4_08,
  AnkrBNBInterestRateModel,
  MasterPriceOracle,
  RewardsDistributorDelegate,
  RewardsDistributorDelegator,
  SimplePriceOracle,
  UniswapTwapPriceOracleV2,
  UniswapTwapPriceOracleV2Root,
  Unitroller,
  WhitePaperInterestRateModel,
};

export default ARTIFACTS;

export const oracleConfig = (deployments: ChainDeployment, artifacts: Artifacts, availableOracles: Array<string>) => {
  const asMap = new Map(availableOracles.map((o) => [o, { abi: artifacts[o].abi, address: deployments[o].address }]));
  return Object.fromEntries(asMap);
};

export const irmConfig = (deployments: ChainDeployment, artifacts: Artifacts, availableIrms: Array<string>) => {
  const asMap = new Map(availableIrms.map((o) => [o, { abi: artifacts[o].abi, address: deployments[o].address }]));
  return Object.fromEntries(asMap);
};
