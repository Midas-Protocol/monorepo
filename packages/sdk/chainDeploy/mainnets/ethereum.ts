import { ethereum } from "@midas-capital/chains";
import { assetSymbols, underlying } from "@midas-capital/types";
import { ethers } from "ethers";

import {
  ChainDeployConfig,
  deployBalancerLinearPoolPriceOracle,
  deployBalancerLpPriceOracle,
  deployBalancerStableLpPriceOracle,
  deployChainlinkOracle,
  deployCurveV2Oracle,
  deployDiaOracle,
  deployErc4626PriceOracle,
  deployUniswapV3Oracle,
} from "../helpers";
import {
  BalancerLinearPoolAsset,
  BalancerLpAsset,
  BalancerStableLpAsset,
  ChainDeployFnParams,
  ChainlinkAsset,
  ChainlinkFeedBaseCurrency,
  ConcentratedLiquidityOracleConfig,
  CurveV2OracleConfig,
  DiaAsset,
  ERC4626Asset,
} from "../helpers/types";

const assets = ethereum.assets;
const USDC = underlying(assets, assetSymbols.USDC);
const WETH = underlying(assets, assetSymbols.WETH);

export const deployConfig: ChainDeployConfig = {
  wtoken: WETH,
  nativeTokenName: "Wrapped ETH",
  nativeTokenSymbol: "ETH",
  stableToken: USDC,
  nativeTokenUsdChainlinkFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  blocksPerYear: ethereum.specificParams.blocksPerYear.toNumber(), // 12 second blocks, 5 blocks per minute// 12 second blocks, 5 blocks per minute
  uniswap: {
    hardcoded: [],
    uniswapData: [],
    pairInitHashCode: ethers.utils.hexlify("0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"),
    uniswapV2RouterAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
    uniswapV2FactoryAddress: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
    uniswapV3FactoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    uniswapOracleInitialDeployTokens: [],
    uniswapOracleLpTokens: [],
    flashSwapFee: 30,
  },
  dynamicFlywheels: [],
  cgId: ethereum.specificParams.cgId,
};

const chainlinkAssets: ChainlinkAsset[] = [
  {
    symbol: assetSymbols.BAL,
    aggregator: "0xBE5eA816870D11239c543F84b71439511D70B94f",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.DAI,
    aggregator: "0xc5C8E77B397E531B8EC06BFb0048328B30E9eCfB",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.FRAX,
    aggregator: "0x0809E3d38d1B4214958faf06D8b1B1a2b73f2ab8",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.USDC,
    aggregator: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.USDT,
    aggregator: "0x3f3f5dF88dC9F13eac63DF89EC16ef6e7E25DdE7",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.MIM,
    aggregator: "0x7A364e8770418566e3eb2001A96116E6138Eb32F",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.OHM,
    aggregator: "0x9a72298ae3886221820B1c878d12D872087D3a23",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.ETH,
  },
  {
    symbol: assetSymbols.WBTC,
    aggregator: "0x6ce185860a4963106506C203335A2910413708e9",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.ANKR,
    aggregator: "0x7eed379bf00005CfeD29feD4009669dE9Bcc21ce",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.ANKR,
    aggregator: "0x7eed379bf00005CfeD29feD4009669dE9Bcc21ce",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.stETH,
    aggregator: "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.USD,
  },
  {
    symbol: assetSymbols.rETH,
    aggregator: "0x536218f9E9Eb48863970252233c8F271f554C2d0",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.ETH,
  },
  {
    symbol: assetSymbols.cbETH,
    aggregator: "0xF017fcB346A1885194689bA23Eff2fE6fA5C483b",
    feedBaseCurrency: ChainlinkFeedBaseCurrency.ETH,
  },
];

const erc4626Assets: ERC4626Asset[] = [
  {
    assetAddress: underlying(assets, assetSymbols.realYieldUSD),
  },
  {
    assetAddress: underlying(assets, assetSymbols.realYieldETH),
  },
  {
    assetAddress: underlying(assets, assetSymbols.ethBtcTrend),
  },
];

const uniswapV3OracleTokens: Array<ConcentratedLiquidityOracleConfig> = [
  {
    assetAddress: underlying(assets, assetSymbols.PAR),
    poolAddress: "0xD7Dcb0eb6AaB643b85ba74cf9997c840fE32e695",
    twapWindow: ethers.BigNumber.from(30 * 60),
    baseToken: USDC,
  },
  {
    assetAddress: underlying(assets, assetSymbols.GOHM),
    poolAddress: "0xcF7e21b96a7DAe8e1663b5A266FD812CBE973E70",
    twapWindow: ethers.BigNumber.from(30 * 60),
    baseToken: USDC,
  },
  {
    assetAddress: underlying(assets, assetSymbols.frxETH),
    poolAddress: "0x8a15b2Dc9c4f295DCEbB0E7887DD25980088fDCB",
    twapWindow: ethers.BigNumber.from(30 * 60),
    baseToken: WETH,
  },
];

const diaAssets: DiaAsset[] = [
  {
    symbol: assetSymbols.swETH,
    underlying: underlying(assets, assetSymbols.swETH),
    feed: "0xf5cECAc781d91b99db6935E975097F552786b7C3",
    key: "swETH/USD",
  },
];

const balancerStableLpAssets: BalancerStableLpAsset[] = [
  {
    lpTokenAddress: underlying(assets, assetSymbols.WSTETH_WETH_STABLE_BPT),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.WSTETH_RETH_FRXETH_STABLE_BPT),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.WBETH_WSTETH_STABLE_BPT),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.WSTETH_CBETH_STABLE_BPT),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.AAVE_BOOSTED_STABLE_BPT),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.SWETH_BBA_WETH_BPT),
  },
];

const balancerLinerPoolAssets: BalancerLinearPoolAsset[] = [
  {
    lpTokenAddress: underlying(assets, assetSymbols.AAVE_LINEAR_DAI),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.AAVE_LINEAR_USDC),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.AAVE_LINEAR_USDT),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.AAVE_LINEAR_WETH),
  },
];

const balancerLpAssets: BalancerLpAsset[] = [
  {
    lpTokenAddress: underlying(assets, assetSymbols.OHM50_DAI50_BPT),
  },
  {
    lpTokenAddress: underlying(assets, assetSymbols.OHM50_WETH50_BPT),
  },
];

const curveV2OraclePools: CurveV2OracleConfig[] = [
  {
    token: underlying(assets, assetSymbols.eUSD),
    pool: "0x880F2fB3704f1875361DE6ee59629c6c6497a5E3",
  },
];

export const deploy = async ({ run, ethers, getNamedAccounts, deployments }: ChainDeployFnParams): Promise<void> => {
  const { deployer } = await getNamedAccounts();

  //// ORACLES

  //// ChainLinkV2 Oracle
  await deployChainlinkOracle({
    run,
    ethers,
    getNamedAccounts,
    deployments,
    deployConfig,
    assets: assets,
    chainlinkAssets,
  });

  //// deploy Curve V2 price oracle
  await deployCurveV2Oracle({
    run,
    ethers,
    getNamedAccounts,
    deployments,
    deployConfig,
    curveV2OraclePools,
  });

  //// deploy uniswap v3 price oracle
  await deployUniswapV3Oracle({
    run,
    ethers,
    getNamedAccounts,
    deployments,
    deployConfig,
    concentratedLiquidityOracleTokens: uniswapV3OracleTokens,
  });

  /// Dia Price Oracle
  await deployDiaOracle({
    run,
    ethers,
    getNamedAccounts,
    deployments,
    diaAssets,
    deployConfig,
    diaNativeFeed: { feed: "0xf5cECAc781d91b99db6935E975097F552786b7C3", key: "ETH/USD" },
  });

  // ERC4626 Oracle
  await deployErc4626PriceOracle({ run, ethers, getNamedAccounts, deployments, erc4626Assets });

  /// Balancer Stable LP Price Oracle
  await deployBalancerLinearPoolPriceOracle({
    run,
    ethers,
    getNamedAccounts,
    deployments,
    deployConfig,
    balancerLinerPoolAssets,
  });

  /// Balancer LP Price Oracle
  await deployBalancerLpPriceOracle({
    run,
    ethers,
    getNamedAccounts,
    deployments,
    deployConfig,
    balancerLpAssets,
  });

  /// Balancer Stable LP Price Oracle
  await deployBalancerStableLpPriceOracle({
    run,
    ethers,
    getNamedAccounts,
    deployments,
    deployConfig,
    balancerLpAssets: balancerStableLpAssets,
  });

  // Quoter
  const quoter = await deployments.deploy("Quoter", {
    from: deployer,
    args: [deployConfig.uniswap.uniswapV3FactoryAddress],
    log: true,
    waitConfirmations: 1,
  });
  console.log("Quoter: ", quoter.address);

  // Liquidators

  //// ERC4626Liquidator
  const erc4626TokenLiquidator = await deployments.deploy("ERC4626Liquidator", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  if (erc4626TokenLiquidator.transactionHash)
    await ethers.provider.waitForTransaction(erc4626TokenLiquidator.transactionHash);
  console.log("ERC4626Liquidator: ", erc4626TokenLiquidator.address);

  ////

  // Plugins & Rewards
  //   const dynamicFlywheels = await deployFlywheelWithDynamicRewards({
  //     ethers,
  //     getNamedAccounts,
  //     deployments,
  //     run,
  //     deployConfig,
  //   });

  //   console.log("deployed dynamicFlywheels: ", dynamicFlywheels);
};
