import { bsc, evmos, moonbeam, polygon } from "@midas-capital/chains";
import { underlying } from "@midas-capital/types";
import { task, types } from "hardhat/config";

import { CErc20PluginRewardsDelegate } from "../../typechain/CErc20PluginRewardsDelegate";
import { MidasFlywheel } from "../../typechain/MidasFlywheel";

const underlyingsMapping = {
  [bsc.chainId]: bsc.assets,
  [moonbeam.chainId]: moonbeam.assets,
  [polygon.chainId]: polygon.assets,
  [evmos.chainId]: evmos.assets,
};

task("deploy-dynamic-rewards-market", "deploy dynamic rewards plugin with flywheels")
  .addParam("signer", "Named account to use for tx", "deployer", types.string)
  .addParam("comptroller", "Comptroller address", undefined, types.string)
  .addParam("symbol", "Symbols of assets for which to deploy the plugin", undefined, types.string)
  .addParam("contractName", "Name of the contract of the plugin", undefined, types.string)
  .addParam("pluginExtraParams", "Extra plugin parameters", undefined, types.string)
  .addParam("fwAddresses", "Flywheel address, one for each reward token", undefined, types.string)
  .addParam("rewardTokens", "Reward tokens", undefined, types.string)
  .setAction(async (taskArgs, { run, ethers, deployments }) => {
    const signer = await ethers.getNamedSigner(taskArgs.signer);
    // @ts-ignore
    const midasSdkModule = await import("../../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas();
    const underlyings = underlyingsMapping[sdk.chainId];

    // task argument parsing
    const comptroller = taskArgs.comptroller;
    const contractName = taskArgs.contractName;
    const pluginExtraParams = taskArgs.pluginExtraParams.split(",");
    const rewardTokens = taskArgs.rewardTokens.split(",");
    const fwAddresses = taskArgs.fwAddresses.split(",");
    const symbol = taskArgs.symbol;

    const underlyingAddress = underlying(underlyings, symbol);
    const marketAddress = await sdk
      .createComptroller(comptroller, signer)
      .callStatic.cTokensByUnderlying(underlyingAddress);
    const cToken = await sdk.createCErc20PluginRewardsDelegate(marketAddress);

    const cTokenImplementation = await cToken.callStatic.implementation();
    console.log({ marketAddress });
    const deployArgs = [underlyingAddress, ...pluginExtraParams, marketAddress, rewardTokens];

    // STEP 1: deploy plugins
    console.log(`Deploying plugin with arguments: ${JSON.stringify({ deployArgs })}`);
    const artifact = await deployments.getArtifact(contractName);
    const deployment = await deployments.deploy(`${contractName}_${symbol}_${marketAddress}`, {
      contract: artifact,
      from: signer.address,
      proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: deployArgs,
          },
        },
        owner: signer.address,
      },
      log: true,
    });

    console.log(deployment.transactionHash);
    if (deployment.transactionHash) await ethers.provider.waitForTransaction(deployment.transactionHash);

    const pluginAddress = deployment.address;
    console.log(`Plugin deployed successfully: ${pluginAddress}`);

    const plugin = await ethers.getContractAt(contractName, pluginAddress, signer);
    const pluginAsset = await plugin.callStatic.asset();
    console.log(`Plugin asset: ${pluginAsset}`);

    if (pluginAsset !== underlyingAddress) {
      throw new Error(`Plugin asset: ${pluginAsset} does not match underlying asset: ${underlyingAddress}`);
    }
    console.log({ pluginAddress: plugin.address });

    // STEP 2: whitelist plugins
    console.log(`Whitelisting plugin: ${pluginAddress} ...`);
    await run("plugin:whitelist", {
      oldImplementation: pluginAddress,
      newImplementation: pluginAddress,
      admin: taskArgs.signer,
    });

    // STEP 3: whitelist upgradfe path from CErc20Delegate-> CErc20PluginRewardsDelegate
    console.log(
      `Whitelisting upgrade path from CErc20Delegate: ${cTokenImplementation} -> CErc20PluginRewardsDelegate: ${sdk.chainDeployment.CErc20PluginRewardsDelegate.address}`
    );
    await run("market:updatewhitelist", {
      oldPluginRewardsDelegate: cTokenImplementation,
      admin: taskArgs.signer,
    });
    console.log("Upgrade path whitelisted");

    // STEP 4: upgrade markets to the new implementation
    console.log(`Upgrading market: ${underlyingAddress} to CErc20PluginRewardsDelegate with plugin: ${pluginAddress}`);
    await run("market:upgrade", {
      comptroller,
      underlying: underlyingAddress,
      implementationAddress: sdk.chainDeployment.CErc20PluginRewardsDelegate.address,
      pluginAddress: pluginAddress,
      signer: taskArgs.signer,
    });
    console.log("Market upgraded");

    // for each token and its flywheel, set up the market and its rewards
    for (const [idx, rewardToken] of rewardTokens.entries()) {
      console.log(`Setting up market for reward token: ${rewardToken}, fwAddress: ${fwAddresses[idx]}`);
      const flywheel = sdk.createMidasFlywheel(fwAddresses[idx]);
      const tokenRewards = await flywheel.callStatic.flywheelRewards();
      console.log(`token rewards ${tokenRewards}`);

      // Step 1: Approve fwc Rewards to get rewardTokens from it (!IMPORTANT to use "approve(address,address)", it has two approve functions)
      const approveRewardTx = await cToken["approve(address,address)"](rewardToken, tokenRewards);
      const approveRewardReceipt = await approveRewardTx.wait();
      console.log(`ctoken approved for rewards for ${rewardToken}`, approveRewardReceipt.status, approveRewardTx.hash);

      // Step 2: enable marketAddress on flywheels
      try {
        const fwAddTx = await flywheel.addStrategyForRewards(marketAddress);
        const feAddTxResult = await fwAddTx.wait(2);
        console.log("enabled market on FW with status: ", feAddTxResult.status);
      } catch (e) {
        console.log(marketAddress, "already added");
        console.log(e);
      }
      // Step 3: add Flywheels to market
      try {
        await sdk.addFlywheelCoreToComptroller(flywheel.address, comptroller);
        console.log(`FW ${flywheel.address} added to comptroller`);
      } catch (e) {
        console.log("already added");
        console.log(e);
      }
    }
  });

task("approve-market-flywheel").setAction(async ({}, { ethers, getChainId }) => {
  const deployer = await ethers.getNamedSigner("deployer");
  const chainId = parseInt(await getChainId());

  let pairs: [string, string][];

  if (chainId == 137) {
    pairs = [
      ["0x5ff63e442ac4724ec342f4a3d26924233832ecbb", "0x4ded2939a2a8912e9cc9eaefabecc43cc9864723"],
      ["0x5ff63e442ac4724ec342f4a3d26924233832ecbb", "0xa5a14c3814d358230a56e8f011b8fc97a508e890"],
      ["0x5ff63e442ac4724ec342f4a3d26924233832ecbb", "0xcb67bd2ae0597edb2426802cdf34bb4085d9483a"],
    ];
  } else if (chainId == 56) {
    pairs = [["0xf2e46295c684c541d618243558a0af17fb4a6862", "0xf0a2852958ad041a9fb35c312605482ca3ec17ba"]];
  }

  for (let i = 0; i < pairs.length; i++) {
    const flywheelAddress = pairs[i][0];
    const marketAddress = pairs[i][1];

    const flywheel = (await ethers.getContractAt("MidasFlywheel", flywheelAddress, deployer)) as MidasFlywheel;
    const market = (await ethers.getContractAt(
      "CErc20PluginDelegate",
      marketAddress,
      deployer
    )) as CErc20PluginRewardsDelegate;

    const rewardToken = flywheel.callStatic.rewardToken();
    const tx = await market.approve(rewardToken, flywheelAddress);
    console.log(`mining tx ${tx.hash}`);
    await tx.wait();
    console.log(`approved flywheel ${flywheelAddress} to pull reward tokens from market ${marketAddress}`);
  }
});
