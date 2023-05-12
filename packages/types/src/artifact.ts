import { PublicClient } from "viem";

export type Artifact = {
  abi: Array<object>;
  bytecode: {
    object: string;
    sourceMap: string;
  };
  deployedBytecode: {
    object: string;
    sourceMap: string;
  };
};

export type MinifiedContracts = {
  [key: string]: {
    abi?: Array<object>;
    bin?: any;
  };
};

export type MinifiedCompoundContracts = {
  [key: string]: {
    abi?: Array<object>;
    bytecode?: any;
  };
};

export type MinifiedOraclesContracts = MinifiedCompoundContracts;

export interface InterestRateModel {
  init(interestRateModelAddress: string, assetAddress: string, publicClient: PublicClient): Promise<void>;

  _init(
    interestRateModelAddress: string,
    reserveFactorMantissa: bigint,
    adminFeeMantissa: bigint,
    fuseFeeMantissa: bigint,
    publicClient: PublicClient
  ): Promise<void>;

  __init(
    baseRatePerBlock: bigint,
    multiplierPerBlock: bigint,
    jumpMultiplierPerBlock: bigint,
    kink: bigint,
    reserveFactorMantissa: bigint,
    adminFeeMantissa: bigint,
    fuseFeeMantissa: bigint
  ): Promise<void>;

  getBorrowRate(utilizationRate: bigint): bigint;

  getSupplyRate(utilizationRate: bigint): bigint;
}
