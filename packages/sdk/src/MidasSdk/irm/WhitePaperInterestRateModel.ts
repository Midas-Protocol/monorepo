import { InterestRateModel } from "@midas-capital/types";
import { getAddress, getContract, keccak256, numberToHex } from "viem";
import type { PublicClient } from "viem";

import CTokenInterfaceAbi from "../../../abis/CTokenInterface";
import WhitePaperInterestRateModelAbi from "../../../abis/WhitePaperInterestRateModel";
import WhitePaperInterestRateModelArtifact from "../../../artifacts/WhitePaperInterestRateModel.json";
import { WeiPerEther } from "../constants";

export default class WhitePaperInterestRateModel implements InterestRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(
    numberToHex(BigInt(WhitePaperInterestRateModelArtifact.deployedBytecode.object))
  );

  initialized: boolean | undefined;
  baseRatePerBlock: bigint | undefined;
  multiplierPerBlock: bigint | undefined;
  reserveFactorMantissa: bigint | undefined;

  async init(interestRateModelAddress: string, assetAddress: string, publicClient: PublicClient) {
    const whitePaperModelContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: WhitePaperInterestRateModelAbi,
      publicClient,
    });
    const cTokenContract = getContract({
      address: getAddress(assetAddress),
      abi: CTokenInterfaceAbi,
      publicClient,
    });

    const [baseRatePerBlock, multiplierPerBlock, reserveFactorMantissa, adminFeeMantissa, fuseFeeMantissa] =
      await Promise.all([
        whitePaperModelContract.read.baseRatePerBlock(),
        whitePaperModelContract.read.multiplierPerBlock(),
        cTokenContract.read.reserveFactorMantissa(),
        cTokenContract.read.adminFeeMantissa(),
        cTokenContract.read.fuseFeeMantissa(),
      ]);

    this.baseRatePerBlock = baseRatePerBlock;
    this.multiplierPerBlock = multiplierPerBlock;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }

  async _init(
    interestRateModelAddress: string,
    reserveFactorMantissa: bigint,
    adminFeeMantissa: bigint,
    fuseFeeMantissa: bigint,
    publicClient: PublicClient
  ) {
    const whitePaperModelContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: WhitePaperInterestRateModelAbi,
      publicClient,
    });

    const [baseRatePerBlock, multiplierPerBlock] = await Promise.all([
      whitePaperModelContract.read.baseRatePerBlock(),
      whitePaperModelContract.read.multiplierPerBlock(),
    ]);

    this.baseRatePerBlock = baseRatePerBlock;
    this.multiplierPerBlock = multiplierPerBlock;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }

  async __init(
    baseRatePerBlock: bigint,
    multiplierPerBlock: bigint,
    reserveFactorMantissa: bigint,
    adminFeeMantissa: bigint,
    fuseFeeMantissa: bigint
  ) {
    this.baseRatePerBlock = baseRatePerBlock;
    this.multiplierPerBlock = multiplierPerBlock;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }

  getBorrowRate(utilizationRate: bigint) {
    if (!this.initialized || !this.multiplierPerBlock || !this.baseRatePerBlock)
      throw new Error("Interest rate model class not initialized.");
    return (utilizationRate * this.multiplierPerBlock) / WeiPerEther + this.baseRatePerBlock;
  }

  getSupplyRate(utilizationRate: bigint): bigint {
    if (!this.initialized || !this.reserveFactorMantissa) throw new Error("Interest rate model class not initialized.");

    const oneMinusReserveFactor = WeiPerEther - this.reserveFactorMantissa;
    const borrowRate = this.getBorrowRate(utilizationRate);
    const rateToPool = (borrowRate * oneMinusReserveFactor) / WeiPerEther;
    return (utilizationRate * rateToPool) / WeiPerEther;
  }
}
