import { expect } from "chai";
import { providers, utils } from "ethers";
import { deployments, ethers } from "hardhat";

import MidasSdk from "../../src/MidasSdk";
import { setUpPriceOraclePrices } from "../utils";
import * as assetHelpers from "../utils/assets";
import { getOrCreateMidas } from "../utils/midasSdk";
import * as poolHelpers from "../utils/pool";
import { wrapNativeToken } from "../utils/setup";

describe("FundOperationsModule", function () {
  let poolAddress: string;
  let sdk: MidasSdk;
  let tx: providers.TransactionResponse;
  let rec: providers.TransactionReceipt;

  this.beforeEach(async () => {
    await deployments.fixture("prod");
    await setUpPriceOraclePrices();
    const { upgradesAdmin } = await ethers.getNamedSigners();

    sdk = await getOrCreateMidas();

    [poolAddress] = await poolHelpers.createPool({ signer: upgradesAdmin, poolName: "Pool-Fund-Operations-Test" });

    const assets = await assetHelpers.getAssetsConf(
      poolAddress,
      sdk.contracts.FuseFeeDistributor.address,
      sdk.chainDeployment.JumpRateModel.address,
      ethers
    );
    await poolHelpers.deployAssets(assets, upgradesAdmin);
    await wrapNativeToken({ account: "upgradesAdmin", amount: "500", weth: sdk.chainSpecificAddresses.W_TOKEN });
  });

  it("user can supply", async function () {
    const { upgradesAdmin } = await ethers.getNamedSigners();
    const poolId = (await poolHelpers.getPoolIndex(poolAddress, sdk)).toString();
    const assetsInPool = await sdk.fetchFusePoolData(poolId);
    const asset = assetsInPool.assets.find((asset) => asset.underlyingToken === sdk.chainSpecificAddresses.W_TOKEN);
    tx = await sdk.approve(asset?.cToken, asset?.underlyingToken);
    await tx.wait();
    tx = await sdk.enterMarkets(asset?.cToken, poolAddress);
    await tx.wait();
    const res = await sdk.mint(asset.cToken, utils.parseUnits("3", 18));
    tx = res.tx;
    rec = await tx.wait();
    expect(rec.status).to.eq(1);
    const assetAfterSupply = await poolHelpers.assetInPool(poolId, sdk, "WETH", upgradesAdmin.address);
    expect(utils.formatUnits(assetAfterSupply.supplyBalance, assetAfterSupply.underlyingDecimals)).to.eq("3.0");
  });

  it("borrow same token results in 1004 - insufficient liquidity", async function () {
    const poolId = (await poolHelpers.getPoolIndex(poolAddress, sdk)).toString();
    const assetsInPool = await sdk.fetchFusePoolData(poolId);
    const asset = assetsInPool.assets.find((asset) => asset.underlyingToken === sdk.chainSpecificAddresses.W_TOKEN);

    tx = await sdk.approve(asset?.cToken, asset?.underlyingToken);
    await tx.wait();
    tx = await sdk.enterMarkets(asset?.cToken, poolAddress);
    await tx.wait();
    const res = await sdk.mint(asset.cToken, utils.parseUnits("3", 18));
    tx = res.tx;
    rec = await tx.wait();
    expect(rec.status).to.eq(1);
    const resp = await sdk.borrow(asset.cToken, utils.parseUnits("2", 18));
    expect(resp.errorCode).to.eq(1004);
  });

  it("user can borrow", async function () {
    const { upgradesAdmin } = await ethers.getNamedSigners();
    const poolId = (await poolHelpers.getPoolIndex(poolAddress, sdk)).toString();
    const assetsInPool = await sdk.fetchFusePoolData(poolId);
    const asset = assetsInPool.assets.find((asset) => asset.underlyingToken === sdk.chainSpecificAddresses.W_TOKEN);
    const asset2 = assetsInPool.assets.find((asset) => asset.underlyingSymbol === "TRIBE");

    tx = await sdk.approve(asset?.cToken, asset?.underlyingToken);
    await tx.wait();
    tx = await sdk.enterMarkets(asset?.cToken, poolAddress);
    await tx.wait();
    const res = await sdk.mint(asset.cToken, utils.parseUnits("3", 18));
    tx = res.tx;
    rec = await tx.wait();

    tx = await sdk.approve(asset2?.cToken, asset2?.underlyingToken);
    await tx.wait();
    tx = await sdk.enterMarkets(asset2?.cToken, poolAddress);
    await tx.wait();
    const res2 = await sdk.mint(asset2.cToken, utils.parseUnits("1", 18));
    tx = res2.tx;
    rec = await tx.wait();

    expect(rec.status).to.eq(1);
    const resp = await sdk.borrow(asset.cToken, utils.parseUnits("1", 18));
    tx = resp.tx;
    rec = await tx.wait();
    expect(rec.status).to.eq(1);
    const assetAfterBorrow = await poolHelpers.assetInPool(poolId, sdk, await "WETH", upgradesAdmin.address);
    expect(utils.formatUnits(assetAfterBorrow.borrowBalance, assetAfterBorrow.underlyingDecimals)).to.eq("1.0");
  });

  it("user can withdraw", async function () {
    const { upgradesAdmin } = await ethers.getNamedSigners();
    const poolId = (await poolHelpers.getPoolIndex(poolAddress, sdk)).toString();
    const assetsInPool = await sdk.fetchFusePoolData(poolId);
    const asset = assetsInPool.assets.find((asset) => asset.underlyingToken === sdk.chainSpecificAddresses.W_TOKEN);
    tx = await sdk.approve(asset?.cToken, asset?.underlyingToken);
    await tx.wait();
    tx = await sdk.enterMarkets(asset?.cToken, poolAddress);
    await tx.wait();
    const res = await sdk.mint(asset.cToken, utils.parseUnits("3", 18));
    tx = res.tx;
    rec = await tx.wait();
    expect(rec.status).to.eq(1);
    const resp = await sdk.withdraw(asset.cToken, utils.parseUnits("2", 18));
    tx = resp.tx;
    rec = await tx.wait();
    expect(rec.status).to.eq(1);
    const assetAfterWithdraw = await poolHelpers.assetInPool(poolId, sdk, await "WETH", upgradesAdmin.address);
    expect(utils.formatUnits(assetAfterWithdraw.supplyBalance, assetAfterWithdraw.underlyingDecimals)).to.eq("1.0");
  });

  it("user can repay", async function () {
    const { upgradesAdmin } = await ethers.getNamedSigners();
    const poolId = (await poolHelpers.getPoolIndex(poolAddress, sdk)).toString();
    const assetsInPool = await sdk.fetchFusePoolData(poolId);
    const asset = assetsInPool.assets.find((asset) => asset.underlyingToken === sdk.chainSpecificAddresses.W_TOKEN);
    const asset2 = assetsInPool.assets.find((asset) => asset.underlyingSymbol === "TRIBE");

    tx = await sdk.approve(asset?.cToken, asset?.underlyingToken);
    await tx.wait();
    tx = await sdk.enterMarkets(asset?.cToken, poolAddress);
    await tx.wait();
    const res = await sdk.mint(asset.cToken, utils.parseUnits("3", 18));
    tx = res.tx;
    rec = await tx.wait();

    tx = await sdk.approve(asset2?.cToken, asset2?.underlyingToken);
    await tx.wait();
    tx = await sdk.enterMarkets(asset2?.cToken, poolAddress);
    await tx.wait();
    const res2 = await sdk.mint(asset2.cToken, utils.parseUnits("1", 18));
    tx = res2.tx;
    rec = await tx.wait();

    const resBorrow = await sdk.borrow(asset.cToken, utils.parseUnits("2", 18));
    tx = resBorrow.tx;
    rec = await tx.wait();
    expect(rec.status).to.eq(1);

    const assetBeforeRepay = await poolHelpers.assetInPool(poolId, sdk, "WETH", upgradesAdmin.address);

    const resRepay = await sdk.repay(asset.cToken, false, utils.parseUnits("2", 18));
    tx = resRepay.tx;
    rec = await tx.wait();
    expect(rec.status).to.eq(1);
    const assetAfterRepay = await poolHelpers.assetInPool(poolId, sdk, "WETH", upgradesAdmin.address);
    expect(assetBeforeRepay.borrowBalance.gt(assetAfterRepay.borrowBalance)).to.eq(true);
  });
});
