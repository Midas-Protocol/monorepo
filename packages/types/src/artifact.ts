import { BigNumber, BigNumberish, Overrides, providers } from "ethers";
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

export type TxOptions = Overrides & { from?: string | Promise<string> };

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
    reserveFactorMantissa: BigNumberish,
    adminFeeMantissa: BigNumberish,
    fuseFeeMantissa: BigNumberish,
    publicClient: PublicClient
  ): Promise<void>;

  __init(
    baseRatePerBlock: BigNumberish,
    multiplierPerBlock: BigNumberish,
    jumpMultiplierPerBlock: BigNumberish,
    kink: BigNumberish,
    reserveFactorMantissa: BigNumberish,
    adminFeeMantissa: BigNumberish,
    fuseFeeMantissa: BigNumberish
  ): Promise<void>;

  getBorrowRate(utilizationRate: BigNumber): BigNumber;

  getSupplyRate(utilizationRate: BigNumber): BigNumber;
}
