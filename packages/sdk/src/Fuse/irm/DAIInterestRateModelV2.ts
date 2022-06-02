import { Web3Provider } from "@ethersproject/providers";
import { BigNumber, BigNumberish, Contract } from "ethers";

import JumpRateModel from "./JumpRateModel";

export default class DAIInterestRateModelV2 extends JumpRateModel {
  initialized: boolean | undefined;
  dsrPerBlock: BigNumber | undefined;
  cash: BigNumber | undefined;
  borrows: BigNumber | undefined;
  reserves: BigNumber | undefined;
  reserveFactorMantissa: BigNumber | undefined;

  name(): string {
    return "DAIInterestRateModelV2Artifact";
  }

  async init(
    interestRateModelAddress: string,
    assetAddress: string,
    daiModelAbi: any,
    ctokenInterfacesAbi: any,
    provider: any
  ) {
    await super.init(interestRateModelAddress, assetAddress, daiModelAbi, ctokenInterfacesAbi, provider);

    const interestRateContract = new Contract(interestRateModelAddress, daiModelAbi, provider);

    this.dsrPerBlock = BigNumber.from(await interestRateContract.callStatic.dsrPerBlock());

    const cTokenContract = new Contract(assetAddress, ctokenInterfacesAbi, provider);

    this.cash = BigNumber.from(await cTokenContract.callStatic.getCash());
    this.borrows = BigNumber.from(await cTokenContract.callStatic.totalBorrowsCurrent());
    this.reserves = BigNumber.from(await cTokenContract.callStatic.totalReserves());
  }

  async _init(
    interestRateModelAddress: string,
    reserveFactorMantissa: BigNumberish,
    adminFeeMantissa: BigNumberish,
    fuseFeeMantissa: BigNumberish,
    daiModelAbi: any,
    provider: Web3Provider
  ) {
    await super._init(
      interestRateModelAddress,
      reserveFactorMantissa,
      adminFeeMantissa,
      fuseFeeMantissa,
      daiModelAbi,
      provider
    );

    const interestRateContract = new Contract(interestRateModelAddress, daiModelAbi, provider);
    this.dsrPerBlock = BigNumber.from(await interestRateContract.callStatic.dsrPerBlock());
    this.cash = BigNumber.from(0);
    this.borrows = BigNumber.from(0);
    this.reserves = BigNumber.from(0);
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
    await super.__init(
      baseRatePerBlock,
      multiplierPerBlock,
      jumpMultiplierPerBlock,
      kink,
      reserveFactorMantissa,
      adminFeeMantissa,
      fuseFeeMantissa
    );
    this.dsrPerBlock = BigNumber.from(0); // TODO: Make this work if DSR ever goes positive again
    this.cash = BigNumber.from(0);
    this.borrows = BigNumber.from(0);
    this.reserves = BigNumber.from(0);
  }

  getSupplyRate(utilizationRate: BigNumber) {
    if (!this.initialized || !this.cash || !this.borrows || !this.reserves || !this.dsrPerBlock)
      throw new Error("Interest rate model class not initialized.");

    // const protocolRate = super.getSupplyRate(utilizationRate, this.reserveFactorMantissa); //todo - do we need this
    const protocolRate = super.getSupplyRate(utilizationRate);
    const underlying = this.cash.add(this.borrows).sub(this.reserves);

    if (underlying.isZero()) {
      return protocolRate;
    } else {
      const cashRate = this.cash.mul(this.dsrPerBlock).div(underlying);
      return cashRate.add(protocolRate);
    }
  }
}
