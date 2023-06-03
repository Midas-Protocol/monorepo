import { getAddress } from "viem";

import { MidasBaseConstructor } from "..";
import CErc20DelegateABI from "../../abis/CErc20Delegate";
import ComptrollerABI from "../../abis/Comptroller";
import EIP20InterfaceABI from "../../abis/EIP20Interface";
import { MaxUint256 } from "../MidasSdk/constants";

export function withFundOperations<TBase extends MidasBaseConstructor>(Base: TBase) {
  return class FundOperations extends Base {
    async approve(cTokenAddress: string, underlyingTokenAddress: string) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(underlyingTokenAddress),
        abi: EIP20InterfaceABI,
        functionName: "approve",
        args: [getAddress(cTokenAddress), MaxUint256],
      });

      const tx = await this.walletClient.writeContract(request);

      return tx;
    }

    async enterMarkets(cTokenAddress: string, comptrollerAddress: string) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(comptrollerAddress),
        abi: ComptrollerABI,
        functionName: "enterMarkets",
        args: [[getAddress(cTokenAddress)]],
      });

      const tx = await this.walletClient.writeContract(request);

      return tx;
    }

    async mint(cTokenAddress: string, amount: bigint) {
      const gas = await this.publicClient.estimateContractGas({
        address: getAddress(cTokenAddress),
        abi: CErc20DelegateABI,
        functionName: "mint",
        args: [amount],
        account: this.account,
      });
      // add 10% to default estimated gas
      const updatedGas = (gas * 11n) / 10n;

      const { request, result } = await this.publicClient.simulateContract({
        address: getAddress(cTokenAddress),
        abi: CErc20DelegateABI,
        functionName: "mint",
        args: [amount],
        gas: updatedGas,
      });

      if (result !== 0n) {
        const errorCode = Number(result);
        return { errorCode };
      }

      const tx = await this.walletClient.writeContract(request);

      return { tx, errorCode: null };
    }

    async repay(cTokenAddress: string, isRepayingMax: boolean, amount: bigint) {
      const { request, result } = await this.publicClient.simulateContract({
        address: getAddress(cTokenAddress),
        abi: CErc20DelegateABI,
        functionName: "repayBorrow",
        args: isRepayingMax ? [MaxUint256] : [amount],
      });

      if (result !== 0n) {
        const errorCode = Number(result);
        return { errorCode };
      }

      const tx = await this.walletClient.writeContract(request);

      return { tx, errorCode: null };
    }

    async borrow(cTokenAddress: string, amount: bigint) {
      const gas = await this.publicClient.estimateContractGas({
        address: getAddress(cTokenAddress),
        abi: CErc20DelegateABI,
        functionName: "borrow",
        args: [amount],
        account: this.account,
      });
      // add 20% to default estimated gas
      const updatedGas = (gas * 12n) / 10n;

      const { request, result } = await this.publicClient.simulateContract({
        address: getAddress(cTokenAddress),
        abi: CErc20DelegateABI,
        functionName: "mint",
        args: [amount],
        gas: updatedGas,
      });

      if (result !== 0n) {
        const errorCode = Number(result);
        return { errorCode };
      }

      const tx = await this.walletClient.writeContract(request);

      return { tx, errorCode: null };
    }

    async withdraw(cTokenAddress: string, amount: bigint) {
      const { request, result } = await this.publicClient.simulateContract({
        address: getAddress(cTokenAddress),
        abi: CErc20DelegateABI,
        functionName: "redeemUnderlying",
        args: [amount],
      });

      if (result !== 0n) {
        const errorCode = Number(result);
        return { errorCode };
      }

      const tx = await this.walletClient.writeContract(request);

      return { tx, errorCode: null };
    }
  };
}
