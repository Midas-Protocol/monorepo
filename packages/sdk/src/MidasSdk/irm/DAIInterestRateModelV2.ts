import { getAddress, getContract, keccak256 } from "viem";
import type { PublicClient } from "viem";

import CTokenInterfacesAbi from "../../../abis/CTokenInterface";
import DAIInterestRateModelV2Abi from "../../../abis/DAIInterestRateModelV2";
import DAIInterestRateModelV2Artifact from "../../../artifacts/DAIInterestRateModelV2.json";

import JumpRateModel from "./JumpRateModel";

export default class DAIInterestRateModelV2 extends JumpRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(DAIInterestRateModelV2Artifact.deployedBytecode.object);

  initialized: boolean | undefined;
  dsrPerBlock: bigint | undefined;
  cash: bigint | undefined;
  borrows: bigint | undefined;
  reserves: bigint | undefined;
  reserveFactorMantissa: bigint | undefined;

  async init(interestRateModelAddress: string, assetAddress: string, publicClient: PublicClient) {
    await super.init(interestRateModelAddress, assetAddress, publicClient);

    const interestRateContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: DAIInterestRateModelV2Abi,
      publicClient,
    });
    const cTokenContract = getContract({ address: getAddress(assetAddress), abi: CTokenInterfacesAbi, publicClient });

    const [dsrPerBlock, cash, borrows, reserves] = await Promise.all([
      interestRateContract.read.dsrPerBlock(),
      cTokenContract.read.getCash(),
      cTokenContract.read.totalBorrows(),
      cTokenContract.read.totalReserves(),
    ]);

    this.dsrPerBlock = dsrPerBlock;
    this.cash = cash;
    this.borrows = borrows;
    this.reserves = reserves;
  }

  async _init(
    interestRateModelAddress: string,
    reserveFactorMantissa: bigint,
    adminFeeMantissa: bigint,
    fuseFeeMantissa: bigint,
    publicClient: PublicClient
  ) {
    await super._init(interestRateModelAddress, reserveFactorMantissa, adminFeeMantissa, fuseFeeMantissa, publicClient);

    const interestRateContract = getContract({
      address: getAddress(interestRateModelAddress),
      abi: DAIInterestRateModelV2Abi,
      publicClient,
    });
    this.dsrPerBlock = await interestRateContract.read.dsrPerBlock();
    this.cash = BigInt(0);
    this.borrows = BigInt(0);
    this.reserves = BigInt(0);
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
    await super.__init(
      baseRatePerBlock,
      multiplierPerBlock,
      jumpMultiplierPerBlock,
      kink,
      reserveFactorMantissa,
      adminFeeMantissa,
      fuseFeeMantissa
    );
    this.dsrPerBlock = BigInt(0); // TODO: Make this work if DSR ever goes positive again
    this.cash = BigInt(0);
    this.borrows = BigInt(0);
    this.reserves = BigInt(0);
  }

  getSupplyRate(utilizationRate: bigint) {
    if (!this.initialized || !this.cash || !this.borrows || !this.reserves || !this.dsrPerBlock)
      throw new Error("Interest rate model class not initialized.");

    // const protocolRate = super.getSupplyRate(utilizationRate, this.reserveFactorMantissa); //todo - do we need this
    const protocolRate = super.getSupplyRate(utilizationRate);
    const underlying = this.cash + this.borrows - this.reserves;

    if (underlying == 0n) {
      return protocolRate;
    } else {
      const cashRate = (this.cash * this.dsrPerBlock) / underlying;
      return cashRate + protocolRate;
    }
  }
}
