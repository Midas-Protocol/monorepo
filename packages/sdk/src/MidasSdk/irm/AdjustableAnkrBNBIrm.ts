import { getAddress, getContract, keccak256, numberToHex } from "viem";
import type { PublicClient } from "viem";

import AdjustableAnkrBNBIrmAbi from "../../../abis/AdjustableAnkrBNBIrm";
import CTokenInterfaceAbi from "../../../abis/CTokenInterface";
import AdjustableAnkrBNBIrmArtifact from "../../../artifacts/AdjustableAnkrBNBIrm.json";

import JumpRateModel from "./JumpRateModel";

export default class AdjustableAnkrBNBIrm extends JumpRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(numberToHex(BigInt(AdjustableAnkrBNBIrmArtifact.deployedBytecode.object)));

  async init(interestRateModelAddress: string, assetAddress: string, publicClient: PublicClient): Promise<void> {
    const interestRateModelContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: AdjustableAnkrBNBIrmAbi,
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
      interestRateModelContract.read.getBaseRatePerBlock(),
      interestRateModelContract.read.getMultiplierPerBlock(),
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
    const interestRateModelContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: AdjustableAnkrBNBIrmAbi,
      publicClient,
    });

    const [baseRatePerBlock, multiplierPerBlock, jumpMultiplierPerBlock, kink] = await Promise.all([
      interestRateModelContract.read.getBaseRatePerBlock(),
      interestRateModelContract.read.getMultiplierPerBlock(),
      interestRateModelContract.read.jumpMultiplierPerBlock(),
      interestRateModelContract.read.kink(),
    ]);

    this.baseRatePerBlock = baseRatePerBlock;
    this.multiplierPerBlock = multiplierPerBlock;
    this.jumpMultiplierPerBlock = jumpMultiplierPerBlock;
    this.kink = kink;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }
}
