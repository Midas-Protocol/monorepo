import { LiquidationStrategy } from "@midas-capital/types";
import { formatEther, getAddress } from "viem";

import { Constants } from "../..";
import CTokenFirstExtensionABI from "../../../abis/CTokenFirstExtension";
import IUniswapV2FactoryABI from "../../../abis/IUniswapV2Factory";
import { MidasSdk } from "../../MidasSdk";

import { ChainLiquidationConfig } from "./config";
import encodeLiquidateTx from "./encodeLiquidateTx";
import { getFundingStrategiesAndDatas } from "./fundingStrategy";
import { getRedemptionStrategiesAndDatas } from "./redemptionStrategy";
import { EncodedLiquidationTx, FusePoolUserWithAssets, SCALE_FACTOR_UNDERLYING_DECIMALS } from "./utils";

import { estimateGas } from "./index";

async function getLiquidationPenalty(sdk: MidasSdk, collateralCToken: string, liquidationIncentive: bigint) {
  const [protocolSeizeShareMantissa, feeSeizeShareMantissa] = await Promise.all([
    sdk.publicClient.readContract({
      address: getAddress(collateralCToken),
      abi: CTokenFirstExtensionABI,
      functionName: "protocolSeizeShareMantissa",
    }),
    sdk.publicClient.readContract({
      address: getAddress(collateralCToken),
      abi: CTokenFirstExtensionABI,
      functionName: "feeSeizeShareMantissa",
    }),
  ]);

  return liquidationIncentive + protocolSeizeShareMantissa + feeSeizeShareMantissa;
}

export default async function getPotentialLiquidation(
  sdk: MidasSdk,
  borrower: FusePoolUserWithAssets,
  closeFactor: bigint,
  liquidationIncentive: bigint,
  chainLiquidationConfig: ChainLiquidationConfig
): Promise<EncodedLiquidationTx | null> {
  // Get debt and collateral
  borrower = { ...borrower };

  for (let asset of borrower.assets) {
    asset = { ...asset };
    asset.borrowBalanceWei = (asset.borrowBalance * asset.underlyingPrice) / Constants.WeiPerEther;
    asset.supplyBalanceWei = (asset.supplyBalance * asset.underlyingPrice) / Constants.WeiPerEther;
    if (asset.borrowBalance > BigInt(0)) borrower.debt.push(asset);
    if (asset.membership && asset.supplyBalance > BigInt(0)) borrower.collateral.push(asset);
  }

  if (!borrower.collateral.length) {
    sdk.logger.error(`Borrower has no collateral ${borrower.account}`);
    return null;
  }

  // Sort debt and collateral from highest to lowest ETH value
  borrower.debt.sort((a, b) => (b.borrowBalanceWei > a.borrowBalanceWei ? 1 : -1));
  borrower.collateral.sort((a, b) => (b.supplyBalanceWei > a.supplyBalanceWei ? 1 : -1));
  // Check SUPPORTED_INPUT_CURRENCIES (if LIQUIDATION_STRATEGY === "")
  if (
    chainLiquidationConfig.LIQUIDATION_STRATEGY === LiquidationStrategy.DEFAULT &&
    chainLiquidationConfig.SUPPORTED_INPUT_CURRENCIES.indexOf(borrower.debt[0].underlyingToken) < 0
  )
    return null;

  let exchangeToTokenAddress: string;

  // Check SUPPORTED_OUTPUT_CURRENCIES: replace EXCHANGE_TO_TOKEN_ADDRESS with underlying collateral if underlying collateral is in SUPPORTED_OUTPUT_CURRENCIES
  if (chainLiquidationConfig.SUPPORTED_OUTPUT_CURRENCIES.indexOf(borrower.collateral[0].underlyingToken) >= 0) {
    exchangeToTokenAddress = borrower.collateral[0].underlyingToken;
  } else {
    exchangeToTokenAddress = sdk.chainSpecificAddresses.W_TOKEN;
  }

  const debtAsset = borrower.debt[0];
  const collateralAsset = borrower.collateral[0];

  // Get debt and collateral prices
  const debtAssetUnderlyingPrice = debtAsset.underlyingPrice;
  const collateralAssetUnderlyingPrice = collateralAsset.underlyingPrice;
  const debtAssetDecimals = debtAsset.underlyingDecimals;
  const collateralAssetDecimals = collateralAsset.underlyingDecimals;
  const debtAssetUnderlyingToken = debtAsset.underlyingToken;
  // xcDOT: 10 decimals
  const actualCollateral = collateralAsset.supplyBalance;

  // Get liquidation amount

  // USDC: 6 decimals
  let repayAmount = (debtAsset.borrowBalance * closeFactor) / Constants.WeiPerEther;
  const penalty = await getLiquidationPenalty(sdk, collateralAsset.cToken, liquidationIncentive);

  // Scale to 18 decimals
  let liquidationValue = (repayAmount * debtAssetUnderlyingPrice) / 10n ** BigInt(debtAssetDecimals);

  // 18 decimals
  let seizeValue = (liquidationValue * penalty) / Constants.WeiPerEther;

  // xcDOT: 10 decimals
  let seizeAmount =
    (seizeValue * // 18 decimals
      Constants.WeiPerEther) / // -> 36 decimals
    collateralAssetUnderlyingPrice / // -> 18 decimals
    SCALE_FACTOR_UNDERLYING_DECIMALS(collateralAsset); // -> decimals

  // Check if actual collateral is too low to seize seizeAmount; if so, recalculate liquidation amount

  if (seizeAmount > actualCollateral) {
    // 10 decimals
    seizeAmount = actualCollateral;
    // 18 decimals
    seizeValue =
      (seizeAmount *
        // 28 decimals
        collateralAssetUnderlyingPrice) /
      // 18 decimals
      10n ** BigInt(collateralAssetDecimals);

    // 18 decimals
    liquidationValue = (seizeValue * Constants.WeiPerEther) / penalty;
    // 18 decimals
    repayAmount =
      (liquidationValue * Constants.WeiPerEther) /
      debtAssetUnderlyingPrice /
      SCALE_FACTOR_UNDERLYING_DECIMALS(debtAsset);
  }

  if (repayAmount <= 0n) {
    sdk.logger.info("Liquidation amount is zero, doing nothing");
    return null;
  }
  // Depending on liquidation strategy
  let debtFundingStrategies: string[] = [];
  let debtFundingStrategiesData: string[] = [];
  let flashSwapFundingToken = Constants.AddressZero;

  if (chainLiquidationConfig.LIQUIDATION_STRATEGY == LiquidationStrategy.UNISWAP) {
    // chain some liquidation funding strategies
    const fundingStrategiesAndDatas = await getFundingStrategiesAndDatas(sdk, debtAssetUnderlyingToken);
    debtFundingStrategies = fundingStrategiesAndDatas.strategies;
    debtFundingStrategiesData = fundingStrategiesAndDatas.datas;
    flashSwapFundingToken = fundingStrategiesAndDatas.flashSwapFundingToken;
  }

  //  chain some collateral redemption strategies
  const [strategyAndData, tokenPath] = await getRedemptionStrategiesAndDatas(
    sdk,
    borrower.collateral[0].underlyingToken,
    flashSwapFundingToken
  );

  let flashSwapPair;

  if (flashSwapFundingToken != sdk.chainConfig.chainAddresses.W_TOKEN) {
    flashSwapPair = await sdk.publicClient.readContract({
      address: getAddress(sdk.chainSpecificAddresses.UNISWAP_V2_FACTORY),
      abi: IUniswapV2FactoryABI,
      functionName: "getPair",
      args: [getAddress(flashSwapFundingToken), getAddress(sdk.chainConfig.chainAddresses.W_TOKEN)],
    });
  } else {
    // flashSwapFundingToken is the W_TOKEN
    flashSwapPair = await sdk.publicClient.readContract({
      address: getAddress(sdk.chainSpecificAddresses.UNISWAP_V2_FACTORY),
      abi: IUniswapV2FactoryABI,
      functionName: "getPair",
      args: [getAddress(flashSwapFundingToken), getAddress(sdk.chainConfig.chainAddresses.STABLE_TOKEN)],
    });
    if (tokenPath.indexOf(flashSwapPair) > 0) {
      // in case the Uniswap pair LP token is on the path of redemptions, we should use
      // another pair because reentrancy checks prevent us from using the pair
      // when inside the execution of a flash swap from the same pair
      flashSwapPair = await sdk.publicClient.readContract({
        address: getAddress(sdk.chainSpecificAddresses.UNISWAP_V2_FACTORY),
        abi: IUniswapV2FactoryABI,
        functionName: "getPair",
        args: [getAddress(flashSwapFundingToken), getAddress(sdk.chainConfig.chainAddresses.W_BTC_TOKEN)],
      });
    } else {
      sdk.logger.info(`flash swap pair ${flashSwapPair} is not on the token path ${tokenPath}`);
    }
  }

  let expectedGasAmount: bigint;
  try {
    expectedGasAmount = await estimateGas(
      sdk,
      borrower,
      exchangeToTokenAddress,
      repayAmount,
      strategyAndData,
      flashSwapPair,
      chainLiquidationConfig.LIQUIDATION_STRATEGY,
      debtFundingStrategies,
      debtFundingStrategiesData
    );
  } catch {
    expectedGasAmount = 750000n;
  }
  // Get gas fee

  const gasPrice = await sdk.publicClient.getGasPrice();
  const expectedGasFee = gasPrice * expectedGasAmount;

  // calculate min profits
  const minProfitAmountEth = expectedGasFee + chainLiquidationConfig.MINIMUM_PROFIT_NATIVE;

  // const minSeizeAmount = liquidationValueWei.add(minProfitAmountEth).mul(Constants.WeiPerEther).div(outputPrice);

  if (seizeValue < minProfitAmountEth) {
    sdk.logger.info(
      `Seize amount of ${formatEther(seizeValue)} less than min break even of ${formatEther(
        minProfitAmountEth
      )}, doing nothing`
    );
    return null;
  }

  return await encodeLiquidateTx(
    sdk,
    chainLiquidationConfig.LIQUIDATION_STRATEGY,
    borrower,
    exchangeToTokenAddress,
    strategyAndData,
    repayAmount,
    flashSwapPair,
    debtFundingStrategies,
    debtFundingStrategiesData
  );
}
