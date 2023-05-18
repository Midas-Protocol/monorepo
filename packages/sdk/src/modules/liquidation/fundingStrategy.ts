import { FundingStrategyContract } from "@midas-capital/types";
import { encodeAbiParameters, getAddress, parseAbiParameters } from "viem";

import IUniswapV2FactoryABI from "../../../abis/IUniswapV2Factory";
import { MidasBase } from "../../MidasSdk";
import { AddressZero } from "../../MidasSdk/constants";

export type FundingStrategiesAndDatas = {
  strategies: string[];
  datas: string[];
  flashSwapFundingToken: string;
};

export const getFundingStrategiesAndDatas = async (
  midasSdk: MidasBase,
  debtToken: string
): Promise<FundingStrategiesAndDatas> => {
  const strategies: string[] = [];
  const datas: string[] = [];
  const tokenPath: string[] = [];

  let fundingToken = debtToken;
  while (fundingToken in midasSdk.fundingStrategies) {
    // chain the funding strategy that can give us the needed funding token
    const [fundingStrategyContract, inputToken] = midasSdk.fundingStrategies[fundingToken];

    // avoid going in an endless loop
    if (tokenPath.find((p) => p == inputToken)) {
      // if we can supply the funding token with flash loan on uniswap, that's enough
      const pair = await midasSdk.publicClient.readContract({
        address: getAddress(midasSdk.chainSpecificAddresses.UNISWAP_V2_FACTORY),
        abi: IUniswapV2FactoryABI,
        functionName: "getPair",
        args: [getAddress(midasSdk.chainSpecificAddresses.W_TOKEN), getAddress(fundingToken)],
      });

      if (pair !== AddressZero) {
        break;
      } else {
        throw new Error(
          `circular path in the chain of funding for ${debtToken}: ${JSON.stringify(
            tokenPath
          )} already includes ${inputToken}`
        );
      }
    }

    tokenPath.push(inputToken);

    const strategyAddress = midasSdk.chainDeployment[fundingStrategyContract].address;
    const strategyData = getStrategyData(midasSdk, fundingStrategyContract, inputToken, fundingToken);

    strategies.push(strategyAddress);
    datas.push(strategyData);

    // the new input token on the chain is the next funding token that we should find a way to supply it
    fundingToken = inputToken;
  }

  return {
    strategies,
    datas,
    flashSwapFundingToken: fundingToken,
  };
};

function getStrategyData(
  midasSdk: MidasBase,
  contract: FundingStrategyContract,
  inputToken: string,
  fundingToken: string
): string {
  switch (contract) {
    // IFundsConversionStrategy should be also configured here
    case FundingStrategyContract.UniswapV3LiquidatorFunder:
      const quoter = midasSdk.chainDeployment["Quoter"].address;

      return encodeAbiParameters(parseAbiParameters("address, address, uint24, address, address"), [
        getAddress(inputToken),
        getAddress(fundingToken),
        midasSdk.chainConfig.specificParams.metadata.uniswapV3Fees?.[inputToken][fundingToken] || 1000,
        getAddress(midasSdk.chainConfig.chainAddresses.UNISWAP_V3_ROUTER ?? AddressZero),
        getAddress(quoter),
      ]);

    case FundingStrategyContract.JarvisLiquidatorFunder:
      const jarvisPool = midasSdk.chainConfig.liquidationDefaults.jarvisPools.find(
        (p) => p.collateralToken == inputToken && p.syntheticToken == fundingToken
      );
      if (jarvisPool == null) {
        throw new Error(
          `wrong config for the jarvis funding strategy for ${fundingToken} - no such pool with syntheticToken ${inputToken}`
        );
      }
      const poolAddress = jarvisPool.liquidityPoolAddress;
      const expirationTime = jarvisPool.expirationTime;

      return encodeAbiParameters(parseAbiParameters("address, address, uint256"), [
        getAddress(inputToken),
        getAddress(poolAddress),
        BigInt(expirationTime),
      ]);

    case FundingStrategyContract.XBombLiquidatorFunder:
      return encodeAbiParameters(parseAbiParameters("address"), [getAddress(inputToken)]);
    case FundingStrategyContract.CurveSwapLiquidatorFunder:
      const curveV1Oracle = midasSdk.chainDeployment.CurveLpTokenPriceOracleNoRegistry;
      const curveV2Oracle = midasSdk.chainDeployment.CurveV2LpTokenPriceOracleNoRegistry;
      const curveV1OracleAddress = curveV1Oracle ? curveV1Oracle.address : AddressZero;
      const curveV2OracleAddress = curveV2Oracle ? curveV2Oracle.address : AddressZero;

      return encodeAbiParameters(parseAbiParameters("address, address, address, address, address"), [
        getAddress(curveV1OracleAddress),
        getAddress(curveV2OracleAddress),
        getAddress(inputToken),
        getAddress(fundingToken),
        getAddress(midasSdk.chainSpecificAddresses.W_TOKEN),
      ]);
    default:
      return "";
  }
}
