import { encodeFunctionData, getAddress, zeroAddress } from "viem";
import type { EstimateGasParameters, SendTransactionParameters, TransactionReceipt } from "viem";

import FuseSafeLiquidatorABI from "../../../abis/FuseSafeLiquidator";
import { MidasBase } from "../../MidasSdk";

import { fetchGasLimitForTransaction } from "./utils";

export default async function sendTransactionToSafeLiquidator(
  sdk: MidasBase,
  method: string | any,
  params: Array<any> | any,
  value: bigint
) {
  // Build data
  const data = encodeFunctionData({
    abi: FuseSafeLiquidatorABI,
    functionName: method,
    args: params,
  });

  // Build transaction
  const tx: EstimateGasParameters = {
    account: process.env.ETHEREUM_ADMIN_ACCOUNT ? getAddress(process.env.ETHEREUM_ADMIN_ACCOUNT) : zeroAddress,
    to: getAddress(sdk.chainDeployment.FuseSafeLiquidator.address),
    value: value,
    data: data,
  };
  // Estimate gas for transaction
  const gas = await fetchGasLimitForTransaction(sdk, method, tx);
  const txRequest: SendTransactionParameters = {
    ...tx,
    chain: sdk.publicClient.chain || null,
    gas,
  };

  sdk.logger.info("Signing and sending", method, "transaction:", tx);

  let hash;
  // Sign transaction
  // Send transaction
  try {
    hash = await sdk.walletClient.sendTransaction(txRequest);
    const receipt: TransactionReceipt = await sdk.publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status === "reverted") {
      throw `Error sending ${method} transaction: Transaction reverted`;
    }
    sdk.logger.info("Successfully sent", method, "transaction hash:", hash);

    return hash;
  } catch (error) {
    throw `Error sending ${method}, transaction: ${error}`;
  }
}
