import { expect } from "chai";
import { BigNumber, providers, utils } from "ethers";
import { deployments, ethers } from "hardhat";

import { SimplePriceOracle } from "../../lib/contracts/typechain/SimplePriceOracle";
import * as chainConfig from "../../src/chainConfig";
import MidasSdk from "../../src/MidasSdk";
import { setUpPriceOraclePrices, tradeNativeForAsset } from "../utils";
import * as assetHelpers from "../utils/assets";
import { BSC_POOLS } from "../utils/assets";
import { getOrCreateMidas } from "../utils/midasSdk";
import * as poolHelpers from "../utils/pool";
import { tradeAssetForAsset, wrapNativeToken } from "../utils/setup";

(process.env.FORK_CHAIN_ID ? describe.skip : describe.skip)("FundOperationsERC4626Module", function () {
  let poolAddress: string;
  let sdk: MidasSdk;
  let tx: providers.TransactionResponse;
  let rec: providers.TransactionReceipt;
  const poolName = "Fund ERC4626 Pool";

  this.beforeEach(async () => {
    await deployments.fixture("prod");

    const { deployer } = await ethers.getNamedSigners();

    sdk = await getOrCreateMidas();

    [poolAddress] = await poolHelpers.createPool({
      signer: deployer,
      poolName,
    });
    const bombAssets = await assetHelpers.getAssetsConf(
      poolAddress,
      sdk.contracts.FuseFeeDistributor.address,
      sdk.irms.JumpRateModel.address,
      ethers,
      BSC_POOLS.BOMB
    );
    const alpacaAssets = (
      await assetHelpers.getAssetsConf(
        poolAddress,
        sdk.contracts.FuseFeeDistributor.address,
        sdk.irms.JumpRateModel.address,
        ethers,
        BSC_POOLS.ALPACA
      )
    ).filter((a) => a.symbol === chainConfig.assetSymbols.WBNB);
    const baseAssets = (
      await assetHelpers.getAssetsConf(
        poolAddress,
        sdk.contracts.FuseFeeDistributor.address,
        sdk.irms.JumpRateModel.address,
        ethers
      )
    ).filter((a) => a.symbol !== chainConfig.assetSymbols.BTCB && a.symbol !== chainConfig.assetSymbols.WBNB);

    const assets = bombAssets.concat(...baseAssets).concat(...alpacaAssets);

    await setUpPriceOraclePrices(assets.map((a) => a.underlying));
    const simpleOracle = (await ethers.getContractAt(
      "SimplePriceOracle",
      sdk.oracles.SimplePriceOracle.address,
      deployer
    )) as SimplePriceOracle;
    for (const a of assets) {
      await simpleOracle.setDirectPrice(a.underlying, BigNumber.from(1));
    }

    console.log("deploying assets: \n", assets);
    await poolHelpers.deployAssets(assets, deployer);

    const BTCB = assets.find((a) => a.symbol === "BTCB");
    const BOMB = assets.find((a) => a.symbol === "BOMB");

    // acquire some test tokens
    await tradeNativeForAsset({ account: "bob", token: BTCB.underlying, amount: "500" });
    await tradeAssetForAsset({ account: "bob", token1: BTCB.underlying, token2: BOMB.underlying, amount: "0.2" });
    await wrapNativeToken({ account: "bob", amount: "100", weth: undefined });
  });
  it("user can supply any asset", async function () {
    const { bob } = await ethers.getNamedSigners();
    const poolId = (await poolHelpers.getPoolIndex(poolAddress, sdk)).toString();

    const assetsInPool = await sdk.fetchFusePoolData(poolId);
    const BTCB = assetsInPool.assets.find((asset) => asset.underlyingSymbol === "BTCB");
    const BOMB = assetsInPool.assets.find((asset) => asset.underlyingSymbol === "BOMB");
    const WBNB = assetsInPool.assets.find((asset) => asset.underlyingSymbol === "WBNB");

    const amounts = ["0.1", "1000", "4"];
    for (const [idx, asset] of [BTCB, BOMB, WBNB].entries()) {
      console.log(`Supplying: ${asset.underlyingSymbol}`);
      const res = await sdk.supply(
        asset.cToken,
        asset.underlyingToken,
        poolAddress,
        true,
        utils.parseUnits(amounts[idx], 18),
        { from: bob.address }
      );
      tx = res.tx;
      rec = await tx.wait();
      expect(rec.status).to.eq(1);
      const assetAfterSupply = await poolHelpers.assetInPool(poolId, sdk, asset.underlyingSymbol, bob.address);
      expect(parseFloat(utils.formatUnits(assetAfterSupply.supplyBalance, 18))).to.closeTo(
        parseFloat(amounts[idx]),
        0.00000001
      );
    }
  });
});
