import { Web3Provider } from "@ethersproject/providers";
import { BigNumber, BigNumberish, constants, Contract } from "ethers";

import { InterestRateModel } from "../../types";

export default class WhitePaperInterestRateModel implements InterestRateModel {
  initialized: boolean | undefined;
  baseRatePerBlock: BigNumber | undefined;
  multiplierPerBlock: BigNumber | undefined;
  reserveFactorMantissa: BigNumber | undefined;

  name(): string {
    return "WhitePaperInterestRateModel";
  }

  async init(
    interestRateModelAddress: string,
    assetAddress: string,
    whitePaperModelAbi: any,
    ctokenInterfacesAbi: any,
    provider: any
  ) {
    const whitePaperModelContract = new Contract(interestRateModelAddress, whitePaperModelAbi, provider);

    this.baseRatePerBlock = BigNumber.from(await whitePaperModelContract.callStatic.baseRatePerBlock());
    this.multiplierPerBlock = BigNumber.from(await whitePaperModelContract.callStatic.multiplierPerBlock());

    const cTokenContract = new Contract(assetAddress, ctokenInterfacesAbi, provider);
    this.reserveFactorMantissa = BigNumber.from(await cTokenContract.callStatic.reserveFactorMantissa());
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(
      BigNumber.from(await cTokenContract.callStatic.adminFeeMantissa())
    );
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(
      BigNumber.from(await cTokenContract.callStatic.fuseFeeMantissa())
    );
    this.initialized = true;
  }

  async _init(
    interestRateModelAddress: string,
    reserveFactorMantissa: BigNumberish,
    adminFeeMantissa: BigNumberish,
    fuseFeeMantissa: BigNumberish,
    whitePaperModelAbi: any,
    provider: Web3Provider
  ) {
    const whitePaperModelContract = new Contract(interestRateModelAddress, whitePaperModelAbi, provider);

    this.baseRatePerBlock = BigNumber.from(await whitePaperModelContract.callStatic.baseRatePerBlock());
    this.multiplierPerBlock = BigNumber.from(await whitePaperModelContract.callStatic.multiplierPerBlock());

    this.reserveFactorMantissa = BigNumber.from(reserveFactorMantissa);
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(BigNumber.from(adminFeeMantissa));
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(BigNumber.from(fuseFeeMantissa));

    this.initialized = true;
  }

  async __init(
    baseRatePerBlock: BigNumberish,
    multiplierPerBlock: BigNumberish,
    reserveFactorMantissa: BigNumberish,
    adminFeeMantissa: BigNumberish,
    fuseFeeMantissa: BigNumberish
  ) {
    this.baseRatePerBlock = BigNumber.from(baseRatePerBlock);
    this.multiplierPerBlock = BigNumber.from(multiplierPerBlock);

    this.reserveFactorMantissa = BigNumber.from(reserveFactorMantissa);
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(BigNumber.from(adminFeeMantissa));
    this.reserveFactorMantissa = this.reserveFactorMantissa.add(BigNumber.from(fuseFeeMantissa));
    this.initialized = true;
  }

  getBorrowRate(utilizationRate: BigNumber) {
    if (!this.initialized || !this.multiplierPerBlock || !this.baseRatePerBlock)
      throw new Error("Interest rate model class not initialized.");
    return utilizationRate.mul(this.multiplierPerBlock).div(constants.WeiPerEther).add(this.baseRatePerBlock);
  }

  getSupplyRate(utilizationRate: BigNumber): BigNumber {
    if (!this.initialized || !this.reserveFactorMantissa) throw new Error("Interest rate model class not initialized.");

    const oneMinusReserveFactor = constants.WeiPerEther.sub(this.reserveFactorMantissa);
    const borrowRate = this.getBorrowRate(utilizationRate);
    const rateToPool = borrowRate.mul(oneMinusReserveFactor).div(constants.WeiPerEther);
    return utilizationRate.mul(rateToPool).div(constants.WeiPerEther);
  }
}
