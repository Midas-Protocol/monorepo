import { Web3Provider } from "@ethersproject/providers";
import { InterestRateModel } from "@midas-capital/types";
import { BigNumber, BigNumberish, utils } from "ethers";
import { getAddress, getContract, keccak256, numberToHex, PublicClient } from "viem";

import CTokenInterfaceAbi from "../../../abis/CTokenInterface";
import JumpRateModelAbi from "../../../abis/JumpRateModel";
import CTokenInterfaceArtifact from "../../../artifacts/CTokenInterface.json";
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
    reserveFactorMantissa: BigNumberish,
    adminFeeMantissa: BigNumberish,
    fuseFeeMantissa: BigNumberish,
    provider: Web3Provider
  ): Promise<void> {
    const jumpRateModelContract = getContract(interestRateModelAddress, JumpRateModelArtifact.abi, provider);
    this.baseRatePerBlock = BigNumber.from(await jumpRateModelContract.callStatic.baseRatePerBlock());
    this.multiplierPerBlock = BigNumber.from(await jumpRateModelContract.callStatic.multiplierPerBlock());
    this.jumpMultiplierPerBlock = BigNumber.from(await jumpRateModelContract.callStatic.jumpMultiplierPerBlock());
    this.kink = BigNumber.from(await jumpRateModelContract.callStatic.kink());

    this.reserveFactorMantissa = BigNumber.from(reserveFactorMantissa);
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(BigNumber.from(adminFeeMantissa));
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(BigNumber.from(fuseFeeMantissa));

    this.initialized = true;
  }

  async __init(
    baseRatePerBlock: BigNumberish,
    multiplierPerBlock: BigNumberish,
    jumpMultiplierPerBlock: BigNumberish,
    kink: BigNumberish,
    reserveFactorMantissa: BigNumberish,
    adminFeeMantissa: BigNumberish,
    fuseFeeMantissa: BigNumberish
  ) {
    this.baseRatePerBlock = BigNumber.from(baseRatePerBlock);
    this.multiplierPerBlock = BigNumber.from(multiplierPerBlock);
    this.jumpMultiplierPerBlock = BigNumber.from(jumpMultiplierPerBlock);
    this.kink = BigNumber.from(kink);

    this.reserveFactorMantissa = BigNumber.from(reserveFactorMantissa);
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(BigNumber.from(adminFeeMantissa));
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(BigNumber.from(fuseFeeMantissa));

    this.initialized = true;
  }

  getBorrowRate(utilizationRate: BigNumber) {
    if (
      !this.initialized ||
      !this.kink ||
      !this.multiplierPerBlock ||
      !this.baseRatePerBlock ||
      !this.jumpMultiplierPerBlock
    )
      throw new Error("Interest rate model class not initialized.");
    if (utilizationRate.lte(this.kink)) {
      return utilizationRate.mul(this.multiplierPerBlock).div(utils.parseEther("1")).add(this.baseRatePerBlock);
    } else {
      const normalRate = this.kink.mul(this.multiplierPerBlock).div(utils.parseEther("1")).add(this.baseRatePerBlock);
      const excessUtil = utilizationRate.sub(this.kink);
      return excessUtil.mul(this.jumpMultiplierPerBlock).div(utils.parseEther("1")).add(normalRate);
    }
  }

  getSupplyRate(utilizationRate: BigNumber) {
    if (!this.initialized || !this.reserveFactorMantissa) throw new Error("Interest rate model class not initialized.");
    const oneMinusReserveFactor = utils.parseEther("1").sub(this.reserveFactorMantissa);
    const borrowRate = this.getBorrowRate(utilizationRate);
    const rateToPool = borrowRate.mul(oneMinusReserveFactor).div(utils.parseEther("1"));
    return utilizationRate.mul(rateToPool).div(utils.parseEther("1"));
  }
}
