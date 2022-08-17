import { LiquidationKind } from "@midas-capital/types";
import { BigNumber } from "ethers";

import { MidasBase } from "../../MidasSdk";

import { StrategiesAndDatas } from "./redemptionStrategy";
import { FusePoolUserWithAssets } from "./utils";

const estimateGas = async (
  fuse: MidasBase,
  borrower: FusePoolUserWithAssets,
  exchangeToTokenAddress: string,
  liquidationAmount: BigNumber,
  strategiesAndDatas: StrategiesAndDatas,
  flashSwapPair: string,
  liquidationKind: LiquidationKind,
  debtFundingStrategies: any[],
  debtFundingStrategiesData: any[]
) => {
  switch (liquidationKind) {
    case LiquidationKind.DEFAULT_NATIVE_BORROW:
      return await fuse.contracts.FuseSafeLiquidator.estimateGas[
        "safeLiquidate(address,address,address,uint256,address,address,address[],bytes[])"
      ](
        borrower.account,
        borrower.debt[0].cToken,
        borrower.collateral[0].cToken,
        0,
        exchangeToTokenAddress,
        fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER,
        strategiesAndDatas.strategies,
        strategiesAndDatas.datas,
        {
          gasLimit: 1e9,
          value: liquidationAmount,
          from: process.env.ETHEREUM_ADMIN_ACCOUNT,
        }
      );
    case LiquidationKind.DEFAULT_TOKEN_BORROW:
      return await fuse.contracts.FuseSafeLiquidator.estimateGas[
        "safeLiquidate(address,uint256,address,address,uint256,address,address,address[],bytes[])"
      ](
        borrower.account,
        liquidationAmount,
        borrower.debt[0].cToken,
        borrower.collateral[0].cToken,
        0,
        exchangeToTokenAddress,
        fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER,
        strategiesAndDatas.strategies,
        strategiesAndDatas.datas,
        {
          gasLimit: 1e9,
          from: process.env.ETHEREUM_ADMIN_ACCOUNT,
        }
      );

    case LiquidationKind.UNISWAP_NATIVE_BORROW:
      return await fuse.contracts.FuseSafeLiquidator.estimateGas.safeLiquidateToEthWithFlashLoan(
        borrower.account,
        liquidationAmount,
        borrower.debt[0].cToken,
        borrower.collateral[0].cToken,
        0,
        exchangeToTokenAddress,
        fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER,
        strategiesAndDatas.strategies,
        strategiesAndDatas.datas,
        0,
        {
          gasLimit: 1e9,
          from: process.env.ETHEREUM_ADMIN_ACCOUNT,
        }
      );
    case LiquidationKind.UNISWAP_TOKEN_BORROW:
      return await fuse.contracts.FuseSafeLiquidator.estimateGas.safeLiquidateToTokensWithFlashLoan(
        {
          borrower: borrower.account,
          repayAmount: liquidationAmount,
          cErc20: borrower.debt[0].cToken,
          cTokenCollateral: borrower.collateral[0].cToken,
          minProfitAmount: 0,
          exchangeProfitTo: exchangeToTokenAddress,
          uniswapV2RouterForBorrow: fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER,
          uniswapV2RouterForCollateral: fuse.chainSpecificAddresses.UNISWAP_V2_ROUTER,
          redemptionStrategies: strategiesAndDatas.strategies,
          strategyData: strategiesAndDatas.datas,
          flashSwapPair,
          ethToCoinbase: 0,
          debtFundingStrategies,
          debtFundingStrategiesData,
        },
        {
          gasLimit: 1e9,
          from: process.env.ETHEREUM_ADMIN_ACCOUNT,
        }
      );
  }
};

export default estimateGas;
