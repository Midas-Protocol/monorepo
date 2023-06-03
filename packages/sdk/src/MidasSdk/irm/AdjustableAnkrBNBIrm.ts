import { getAddress, keccak256, numberToHex } from "viem";
import type { PublicClient } from "viem";

import AdjustableAnkrBNBIrmAbi from "../../../abis/AdjustableAnkrBNBIrm";
import CTokenInterfaceAbi from "../../../abis/CTokenInterface";
import AdjustableAnkrBNBIrmArtifact from "../../../artifacts/AdjustableAnkrBNBIrm.json";

import JumpRateModel from "./JumpRateModel";

export default class AdjustableAnkrBNBIrm extends JumpRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(numberToHex(BigInt(AdjustableAnkrBNBIrmArtifact.deployedBytecode.object)));

  async init(interestRateModelAddress: string, assetAddress: string, publicClient: PublicClient): Promise<void> {
    const [
      baseRatePerBlock,
      multiplierPerBlock,
      jumpMultiplierPerBlock,
      kink,
      reserveFactorMantissa,
      adminFeeMantissa,
      fuseFeeMantissa,
    ] = await Promise.all([
      publicClient.readContract({
        address: getAddress(interestRateModelAddress),
        abi: AdjustableAnkrBNBIrmAbi,
        functionName: "getBaseRatePerBlock",
      }),
      publicClient.readContract({
        address: getAddress(interestRateModelAddress),
        abi: AdjustableAnkrBNBIrmAbi,
        functionName: "getMultiplierPerBlock",
      }),
      publicClient.readContract({
        address: getAddress(interestRateModelAddress),
        abi: AdjustableAnkrBNBIrmAbi,
        functionName: "jumpMultiplierPerBlock",
      }),
      publicClient.readContract({
        address: getAddress(interestRateModelAddress),
        abi: AdjustableAnkrBNBIrmAbi,
        functionName: "kink",
      }),
      publicClient.readContract({
        address: getAddress(assetAddress),
        abi: CTokenInterfaceAbi,
        functionName: "reserveFactorMantissa",
      }),
      publicClient.readContract({
        address: getAddress(assetAddress),
        abi: CTokenInterfaceAbi,
        functionName: "adminFeeMantissa",
      }),
      publicClient.readContract({
        address: getAddress(assetAddress),
        abi: CTokenInterfaceAbi,
        functionName: "fuseFeeMantissa",
      }),
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
    const [baseRatePerBlock, multiplierPerBlock, jumpMultiplierPerBlock, kink] = await Promise.all([
      publicClient.readContract({
        address: getAddress(interestRateModelAddress),
        abi: AdjustableAnkrBNBIrmAbi,
        functionName: "getBaseRatePerBlock",
      }),
      publicClient.readContract({
        address: getAddress(interestRateModelAddress),
        abi: AdjustableAnkrBNBIrmAbi,
        functionName: "getMultiplierPerBlock",
      }),
      publicClient.readContract({
        address: getAddress(interestRateModelAddress),
        abi: AdjustableAnkrBNBIrmAbi,
        functionName: "jumpMultiplierPerBlock",
      }),
      publicClient.readContract({
        address: getAddress(interestRateModelAddress),
        abi: AdjustableAnkrBNBIrmAbi,
        functionName: "kink",
      }),
    ]);

    this.baseRatePerBlock = baseRatePerBlock;
    this.multiplierPerBlock = multiplierPerBlock;
    this.jumpMultiplierPerBlock = jumpMultiplierPerBlock;
    this.kink = kink;
    this.reserveFactorMantissa = reserveFactorMantissa + adminFeeMantissa + fuseFeeMantissa;
    this.initialized = true;
  }
}
