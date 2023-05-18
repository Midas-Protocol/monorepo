import { LiquidationStrategy } from "@midas-capital/types";
import { getAddress, numberToHex, zeroAddress } from "viem";

import FuseSafeLiquidatorABI from "../../../abis/FuseSafeLiquidator";
import { MidasBase } from "../../MidasSdk";

import { getUniswapV2Router, StrategiesAndDatas } from "./redemptionStrategy";
import { FusePoolUserWithAssets } from "./utils";

const estimateGas = async (
  fuse: MidasBase,
  borrower: FusePoolUserWithAssets,
  exchangeToTokenAddress: string,
  liquidationAmount: bigint,
  strategiesAndDatas: StrategiesAndDatas,
  flashSwapPair: string,
  liquidationStrategy: LiquidationStrategy,
  debtFundingStrategies: any[],
  debtFundingStrategiesData: any[]
) => {
  switch (liquidationStrategy) {
    case LiquidationStrategy.DEFAULT:
      return await fuse.publicClient.estimateContractGas({
        address: getAddress(fuse.chainDeployment.FuseSafeLiquidator.address),
        abi: FuseSafeLiquidatorABI,
        functionName: "safeLiquidate",
        args: [
          getAddress(borrower.account),
          liquidationAmount,
          borrower.debt[0].cToken,
          borrower.collateral[0].cToken,
          BigInt(0),
          getAddress(exchangeToTokenAddress),
          getAddress(fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER),
          strategiesAndDatas.strategies.map((st) => getAddress(st)),
          strategiesAndDatas.datas.map((data) => numberToHex(BigInt(data))),
        ],
        account: process.env.ETHEREUM_ADMIN_ACCOUNT ? getAddress(process.env.ETHEREUM_ADMIN_ACCOUNT) : zeroAddress,
        gas: 10n ** 9n,
      });
    case LiquidationStrategy.UNISWAP:
      return await fuse.publicClient.estimateContractGas({
        address: getAddress(fuse.chainDeployment.FuseSafeLiquidator.address),
        abi: FuseSafeLiquidatorABI,
        functionName: "safeLiquidateToTokensWithFlashLoan",
        args: [
          {
            borrower: getAddress(borrower.account),
            repayAmount: liquidationAmount,
            cErc20: borrower.debt[0].cToken,
            cTokenCollateral: borrower.collateral[0].cToken,
            minProfitAmount: BigInt(0),
            exchangeProfitTo: getAddress(exchangeToTokenAddress),
            uniswapV2RouterForBorrow: getAddress(fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER), // TODO ASSET_SPECIFIC_ROUTER
            uniswapV2RouterForCollateral: getAddress(getUniswapV2Router(fuse, borrower.collateral[0].cToken)),
            redemptionStrategies: strategiesAndDatas.strategies.map((st) => getAddress(st)),
            strategyData: strategiesAndDatas.datas.map((data) => numberToHex(BigInt(data))),
            flashSwapPair: getAddress(flashSwapPair),
            ethToCoinbase: BigInt(0),
            debtFundingStrategies,
            debtFundingStrategiesData,
          },
        ],
        account: process.env.ETHEREUM_ADMIN_ACCOUNT ? getAddress(process.env.ETHEREUM_ADMIN_ACCOUNT) : zeroAddress,
        gas: 10n ** 9n,
      });
  }
};

export default estimateGas;
