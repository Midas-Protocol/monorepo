import axios from "axios";
import { BigNumber, constants, ContractTransaction, utils } from "ethers";

import { MidasBaseConstructor } from "..";
import { CErc20Delegate } from "../../lib/contracts/typechain/CErc20Delegate";
import { Comptroller } from "../../lib/contracts/typechain/Comptroller";
import { getContract } from "../MidasSdk/utils";

export function withFundOperations<TBase extends MidasBaseConstructor>(Base: TBase) {
  return class FundOperations extends Base {
    async getProperGasLimit(amount: BigNumber, address: string) {
      return BigNumber.from(
        (
          (
            await this.provider.estimateGas({
              from: address,
              value: amount.div(BigNumber.from(2)),
            })
          ).toNumber() * 3.13
        ).toFixed(0)
      );
    }

    async supply(
      cTokenAddress: string,
      underlyingTokenAddress: string,
      comptrollerAddress: string,
      enableAsCollateral: boolean,
      amount: BigNumber
    ) {
      const token = getContract(underlyingTokenAddress, this.artifacts.EIP20Interface.abi, this.signer);
      const currentSignerAddress = await this.signer.getAddress();

      const hasApprovedEnough = (await token.callStatic.allowance(currentSignerAddress, cTokenAddress)).gte(amount);
      if (!hasApprovedEnough) {
        const max = BigNumber.from(2).pow(BigNumber.from(256)).sub(constants.One);
        const approveTx = await token.approve(cTokenAddress, max);
        await approveTx.wait();
      }
      if (enableAsCollateral) {
        const comptrollerInstance = getContract(
          comptrollerAddress,
          this.artifacts.Comptroller.abi,
          this.signer
        ) as Comptroller;

        await comptrollerInstance.enterMarkets([cTokenAddress]);
      }
      const cToken = getContract(cTokenAddress, this.artifacts.CErc20Delegate.abi, this.signer) as CErc20Delegate;

      const address = await this.signer.getAddress();
      const gasLimit = await this.getProperGasLimit(amount, address);

      const response = (await cToken.callStatic.mint(amount, { gasLimit })) as BigNumber;

      if (response.toString() !== "0") {
        const errorCode = parseInt(response.toString());
        return { errorCode };
      }

      const tx: ContractTransaction = await cToken.mint(amount, { gasLimit });
      return { tx, errorCode: null };
    }

    async repay(cTokenAddress: string, underlyingTokenAddress: string, isRepayingMax: boolean, amount: BigNumber) {
      const max = BigNumber.from(2).pow(BigNumber.from(256)).sub(constants.One);

      const token = getContract(underlyingTokenAddress, this.artifacts.EIP20Interface.abi, this.signer);

      const currentSignerAddress = await this.signer.getAddress();
      const hasApprovedEnough = (await token.callStatic.allowance(currentSignerAddress, cTokenAddress)).gte(amount);
      if (!hasApprovedEnough) {
        const approveTx = await token.approve(cTokenAddress, max);
        await approveTx.wait();
      }
      const cToken = getContract(cTokenAddress, this.artifacts.CErc20Delegate.abi, this.signer) as CErc20Delegate;

      const response = (await cToken.callStatic.repayBorrow(isRepayingMax ? max : amount)) as BigNumber;

      if (response.toString() !== "0") {
        const errorCode = parseInt(response.toString());
        return { errorCode };
      }

      const tx: ContractTransaction = await cToken.repayBorrow(isRepayingMax ? max : amount);

      return { tx, errorCode: null };
    }

    async borrow(cTokenAddress: string, amount: BigNumber) {
      const cToken = getContract(cTokenAddress, this.artifacts.CErc20Delegate.abi, this.signer) as CErc20Delegate;

      const response = (await cToken.callStatic.borrow(amount)) as BigNumber;

      if (response.toString() !== "0") {
        const errorCode = parseInt(response.toString());
        return { errorCode };
      }
      const tx: ContractTransaction = await cToken.borrow(amount);

      return { tx, errorCode: null };
    }

    async withdraw(cTokenAddress: string, amount: BigNumber) {
      const cToken = getContract(cTokenAddress, this.artifacts.CErc20Delegate.abi, this.signer) as CErc20Delegate;

      const response = (await cToken.callStatic.redeemUnderlying(amount)) as BigNumber;

      if (response.toString() !== "0") {
        const errorCode = parseInt(response.toString());
        return { errorCode };
      }
      const tx: ContractTransaction = await cToken.redeemUnderlying(amount);

      return { tx, errorCode: null };
    }
  };
}
