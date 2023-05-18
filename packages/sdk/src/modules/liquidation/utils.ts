import { FuseAsset, LiquidationStrategy } from "@midas-capital/types";
import { EstimateGasParameters, formatEther } from "viem";

import { MidasBase } from "../../MidasSdk";

export const SCALE_FACTOR_UNDERLYING_DECIMALS = (asset: FuseAsset) => 10n ** (18n - asset.underlyingDecimals);

export type ExtendedFusePoolAssetStructOutput = {
  cToken: string;
  underlyingToken: string;
  underlyingName: string;
  underlyingSymbol: string;
  underlyingDecimals: bigint;
  underlyingBalance: bigint;
  supplyRatePerBlock: bigint;
  borrowRatePerBlock: bigint;
  totalSupply: bigint;
  totalBorrow: bigint;
  supplyBalance: bigint;
  borrowBalance: bigint;
  liquidity: bigint;
  membership: boolean;
  exchangeRate: bigint;
  underlyingPrice: bigint;
  oracle: string;
  collateralFactor: bigint;
  reserveFactor: bigint;
  adminFee: bigint;
  fuseFee: bigint;
  borrowGuardianPaused: boolean;
  mintGuardianPaused: boolean;
  borrowBalanceWei?: bigint;
  supplyBalanceWei?: bigint;
};

export type EncodedLiquidationTx = {
  method: string;
  args: Array<any>;
  value: bigint;
};

export type FusePoolUserWithAssets = {
  assets: ExtendedFusePoolAssetStructOutput[];
  account: string;
  totalBorrow: bigint;
  totalCollateral: bigint;
  health: bigint;
  debt: Array<any>;
  collateral: Array<any>;
};

export type LiquidatablePool = {
  comptroller: string;
  liquidations: EncodedLiquidationTx[];
};

export type ErroredPool = {
  comptroller: string;
  msg: string;
  error?: any;
};

export type FusePoolUserStruct = {
  account: string;
  totalBorrow: bigint;
  totalCollateral: bigint;
  health: bigint;
};

export type PublicPoolUserWithData = {
  comptroller: string;
  users: FusePoolUserStruct[];
  closeFactor: bigint;
  liquidationIncentive: bigint;
};

export async function fetchGasLimitForTransaction(sdk: MidasBase, method: string, tx: EstimateGasParameters) {
  try {
    return ((await sdk.publicClient.estimateGas(tx)) * 11n) / 10n;
  } catch (error) {
    throw `Failed to estimate gas before signing and sending ${method} transaction: ${error}`;
  }
}

export const logLiquidation = (
  sdk: MidasBase,
  borrower: FusePoolUserWithAssets,
  exchangeToTokenAddress: string,
  liquidationAmount: bigint,
  liquidationTokenSymbol: string,
  liquidationStrategy: LiquidationStrategy,
  debtFundingStrategies: any[]
) => {
  sdk.logger.info(
    `Gathered transaction data for safeLiquidate a ${liquidationTokenSymbol} borrow of kind ${liquidationStrategy}:
         - Liquidation Amount: ${formatEther(liquidationAmount)}
         - Underlying Collateral Token: ${borrower.collateral[0].underlyingSymbol} ${borrower.collateral[0].cToken}
         - Underlying Debt Token: ${borrower.debt[0].underlyingSymbol} ${borrower.debt[0].cToken}
         - Funding the liquidation with: ${debtFundingStrategies}
         - Exchanging liquidated tokens to: ${exchangeToTokenAddress}
         - Borrower: ${borrower.account}
         `
  );
};
