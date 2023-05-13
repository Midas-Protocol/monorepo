import { InterestRateModel } from "@midas-capital/types";
import { getAddress, getContract, parseEther } from "viem";
import type { PublicClient } from "viem";

import AnkrCertificateInterestRateModelAbi from "../../../abis/AnkrCertificateInterestRateModel";
import CTokenInterfaceAbi from "../../../abis/CTokenInterface";

export default class AnkrCertificateInterestRateModel implements InterestRateModel {
  initialized: boolean | undefined;
  baseRatePerBlock: bigint | undefined;
  multiplierPerBlock: bigint | undefined;
  jumpMultiplierPerBlock: bigint | undefined;
  kink: bigint | undefined;
  reserveFactorMantissa: bigint | undefined;

  async init(interestRateModelAddress: string, assetAddress: string, publicClient: PublicClient): Promise<void> {
    const jumpRateModelContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: AnkrCertificateInterestRateModelAbi,
      publicClient,
    });
    const cTokenContract = getContract({ address: getAddress(assetAddress), abi: CTokenInterfaceAbi, publicClient });

    const [
      multiplierPerBlock,
      jumpMultiplierPerBlock,
      baseRatePerBlock,
      kink,
      reserveFactorMantissa,
      adminFeeMantissa,
      fuseFeeMantissa,
    ] = await Promise.all([
      jumpRateModelContract.read.getMultiplierPerBlock(),
      jumpRateModelContract.read.jumpMultiplierPerBlock(),
      jumpRateModelContract.read.getBaseRatePerBlock(),
      jumpRateModelContract.read.kink(),
      cTokenContract.read.reserveFactorMantissa(),
      cTokenContract.read.adminFeeMantissa(),
      cTokenContract.read.fuseFeeMantissa(),
    ]);

    this.multiplierPerBlock = multiplierPerBlock;
    this.jumpMultiplierPerBlock = jumpMultiplierPerBlock;
    this.baseRatePerBlock = baseRatePerBlock;
    this.kink = kink;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }

  async _init(
    interestRateModelAddress: string,
    reserveFactorMantissa: bigint,
    adminFeeMantissa: bigint,
    fuseFeeMantissa: bigint,
    publicClient: PublicClient
  ): Promise<void> {
    const jumpRateModelContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: AnkrCertificateInterestRateModelAbi,
      publicClient,
    });

    const [multiplierPerBlock, jumpMultiplierPerBlock, baseRatePerBlock, kink] = await Promise.all([
      jumpRateModelContract.read.getMultiplierPerBlock(),
      jumpRateModelContract.read.jumpMultiplierPerBlock(),
      jumpRateModelContract.read.getBaseRatePerBlock(),
      jumpRateModelContract.read.kink(),
    ]);

    this.multiplierPerBlock = multiplierPerBlock;
    this.jumpMultiplierPerBlock = jumpMultiplierPerBlock;
    this.baseRatePerBlock = baseRatePerBlock;
    this.kink = kink;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }

  async __init(
    baseRatePerBlock: bigint,
    jumpMultiplierPerBlock: bigint,
    kink: bigint,
    reserveFactorMantissa: bigint,
    adminFeeMantissa: bigint,
    fuseFeeMantissa: bigint
  ) {
    this.baseRatePerBlock = baseRatePerBlock;
    this.jumpMultiplierPerBlock = jumpMultiplierPerBlock;
    this.kink = kink;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }

  getBorrowRate(utilizationRate: bigint) {
    if (
      !this.initialized ||
      !this.kink ||
      !this.multiplierPerBlock ||
      !this.baseRatePerBlock ||
      !this.jumpMultiplierPerBlock
    )
      throw new Error("Interest rate model class not initialized.");

    const normalRate = (utilizationRate * this.multiplierPerBlock) / parseEther("1") + this.baseRatePerBlock;

    if (utilizationRate <= this.kink) {
      return normalRate;
    } else {
      const excessUtil = utilizationRate - this.kink;
      return (excessUtil * this.jumpMultiplierPerBlock) / parseEther("1") + normalRate;
    }
  }

  getSupplyRate(utilizationRate: bigint) {
    if (!this.initialized || !this.reserveFactorMantissa) throw new Error("Interest rate model class not initialized.");
    const oneMinusReserveFactor = parseEther("1") - this.reserveFactorMantissa;
    const borrowRate = this.getBorrowRate(utilizationRate);
    const rateToPool = (borrowRate * oneMinusReserveFactor) / parseEther("1");
    return (utilizationRate * rateToPool) / parseEther("1");
  }
}
