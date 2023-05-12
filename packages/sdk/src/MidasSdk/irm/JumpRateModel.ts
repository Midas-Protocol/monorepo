import { InterestRateModel } from "@midas-capital/types";
import { getAddress, getContract, keccak256, numberToHex, parseEther, PublicClient } from "viem";

import CTokenInterfaceAbi from "../../../abis/CTokenInterface";
import JumpRateModelAbi from "../../../abis/JumpRateModel";
import JumpRateModelArtifact from "../../../artifacts/JumpRateModel.json";

export default class JumpRateModel implements InterestRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(numberToHex(BigInt(JumpRateModelArtifact.deployedBytecode.object)));

  initialized: boolean | undefined;
  baseRatePerBlock: bigint | undefined;
  multiplierPerBlock: bigint | undefined;
  jumpMultiplierPerBlock: bigint | undefined;
  kink: bigint | undefined;
  reserveFactorMantissa: bigint | undefined;

  async init(interestRateModelAddress: string, assetAddress: string, publicClient: PublicClient): Promise<void> {
    const interestRateModelContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: JumpRateModelAbi,
      publicClient,
    });
    const cTokenContract = getContract({
      address: getAddress(assetAddress),
      abi: CTokenInterfaceAbi,
      publicClient,
    });

    const [
      baseRatePerBlock,
      multiplierPerBlock,
      jumpMultiplierPerBlock,
      kink,
      reserveFactorMantissa,
      adminFeeMantissa,
      fuseFeeMantissa,
    ] = await Promise.all([
      interestRateModelContract.read.baseRatePerBlock(),
      interestRateModelContract.read.multiplierPerBlock(),
      interestRateModelContract.read.jumpMultiplierPerBlock(),
      interestRateModelContract.read.kink(),
      cTokenContract.read.reserveFactorMantissa(),
      cTokenContract.read.adminFeeMantissa(),
      cTokenContract.read.fuseFeeMantissa(),
    ]);

    this.baseRatePerBlock = baseRatePerBlock;
    this.multiplierPerBlock = multiplierPerBlock;
    this.jumpMultiplierPerBlock = jumpMultiplierPerBlock;
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
      abi: JumpRateModelAbi,
      publicClient,
    });

    const [baseRatePerBlock, multiplierPerBlock, jumpMultiplierPerBlock, kink] = await Promise.all([
      jumpRateModelContract.read.baseRatePerBlock(),
      jumpRateModelContract.read.multiplierPerBlock(),
      jumpRateModelContract.read.jumpMultiplierPerBlock(),
      jumpRateModelContract.read.kink(),
    ]);

    this.baseRatePerBlock = baseRatePerBlock;
    this.multiplierPerBlock = multiplierPerBlock;
    this.jumpMultiplierPerBlock = jumpMultiplierPerBlock;
    this.kink = kink;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }

  async __init(
    baseRatePerBlock: bigint,
    multiplierPerBlock: bigint,
    jumpMultiplierPerBlock: bigint,
    kink: bigint,
    reserveFactorMantissa: bigint,
    adminFeeMantissa: bigint,
    fuseFeeMantissa: bigint
  ) {
    this.baseRatePerBlock = baseRatePerBlock;
    this.multiplierPerBlock = multiplierPerBlock;
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
    if (utilizationRate <= this.kink) {
      return (utilizationRate * this.multiplierPerBlock) / parseEther("1") + this.baseRatePerBlock;
    } else {
      const normalRate = (this.kink * this.multiplierPerBlock) / parseEther("1") + this.baseRatePerBlock;
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
