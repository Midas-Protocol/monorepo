import { task, types } from "hardhat/config";

task("oracle:update-twap", "Call update on twap oracle to update the last price observation")
  .addParam("pair", "pair address for which to run the update", undefined, types.string)
  .setAction(async ({ pair: _pair }, { ethers }) => {
    const { oraclesAdmin } = await ethers.getNamedSigners();

    // @ts-ignore
    const midasSdkModule = await import("../../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas();

    const uniswapTwapRoot = await ethers.getContractAt(
      "UniswapTwapPriceOracleV2Root",
      sdk.chainDeployment.UniswapTwapPriceOracleV2Root.address,
      oraclesAdmin
    );

    const tx = await uniswapTwapRoot["update(address)"](_pair);
    await tx.wait();
  });

task("oracle:remove-twap-pair", "Call update on twap oracle to update the last price observation")
  .addParam("pairIndex", "pair address for which to run the update", undefined, types.string)
  .setAction(async ({ pairIndex: _pairIndex }, { ethers }) => {
    const { oraclesAdmin } = await ethers.getNamedSigners();

    // @ts-ignore
    const midasSdkModule = await import("../../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas();

    const uniswapTwapRoot = await ethers.getContractAt(
      "UniswapTwapPriceOracleV2Resolver",
      sdk.chainDeployment.UniswapTwapPriceOracleV2Resolver.address,
      oraclesAdmin
    );
    const existingPairs = await uniswapTwapRoot.callStatic.getPairs();
    console.log("Existing Pairs", existingPairs);

    const tx = await uniswapTwapRoot.removeFromPairs(_pairIndex);
    await tx.wait();
    console.log("Updated Pairs", await uniswapTwapRoot.callStatic.getPairs());
  });
