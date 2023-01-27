import { task, types } from "hardhat/config";

task("oracle:update-price-resolver", "Update uniswap v2 oracle price resolver").setAction(async (args, hre) => {
  const { deployer } = await hre.ethers.getNamedSigners();

  const uniswapPriceOracleResolver = await hre.ethers.getContractAt(
    "UniswapTwapPriceOracleV2Resolver",
    "0x7e616687A5c426f51Debc41582Ccb5f60F2DB67A",
    deployer
  );

  const pairs = await uniswapPriceOracleResolver.callStatic.pairs();

  console.log("count: ", pairs.length);

  // for (let i = 0; i < pairs.length; i++) {
  //   await uniswapPriceOracleResolver.removeFromPairs(0);
  //   console.log("removed - ", i);
  // }

  // const updatedPairs = await uniswapPriceOracleResolver.getPairs();

  // console.log({ updatedPairs });
});
