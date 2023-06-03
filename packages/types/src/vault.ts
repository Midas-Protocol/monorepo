import { SupportedChains } from "./enums";

export interface VaultData {
  chainId: SupportedChains;
  totalSupply: bigint;
  totalSupplyNative: number;
  asset: string;
  symbol: string;
  supplyApy: bigint;
  adaptersCount: number;
  isEmergencyStopped: boolean;
  adapters: Adapter[];
  decimals: number;
  underlyingPrice: bigint;
  vault: string;
  extraDocs: string | undefined;
  performanceFee: bigint;
  depositFee: bigint;
  withdrawalFee: bigint;
  managementFee: bigint;
}

export interface Adapter {
  adapter: string;
  allocation: bigint;
  market: string;
  pool: string;
}

export interface VaultApy {
  supplyApy: string;
  totalSupply: string;
  createdAt: number;
}

export type FlywheelRewardsInfoForVault = {
  vault: string;
  chainId: number;
  rewardsInfo: RewardsInfo[];
};

export interface RewardsInfo {
  rewardToken: string;
  flywheel: string;
  rewards: bigint;
  rewardTokenDecimals: number;
  rewardTokenSymbol: string;
}
