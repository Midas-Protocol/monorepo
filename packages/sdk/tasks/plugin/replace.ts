import { chainIdToConfig } from "@midas-capital/chains";
import { DeployedPlugins } from "@midas-capital/types";
import { task, types } from "hardhat/config";

import { CErc20PluginRewardsDelegate } from "../../typechain/CErc20PluginRewardsDelegate";
import { Comptroller } from "../../typechain/Comptroller";
import { FuseFeeDistributor } from "../../typechain/FuseFeeDistributor";
import { SafeOwnableUpgradeable } from "../../typechain/SafeOwnableUpgradeable";

task("plugins:deploy:upgradable", "Deploys the upgradable plugins from a config list").setAction(
  async ({}, { ethers, getChainId, deployments }) => {
    const { upgradesAdmin, poolsSuperAdmin, extrasAdmin } = await ethers.getNamedSigners();

    console.log({ deployer: poolsSuperAdmin.address });
    const ffd = (await ethers.getContract("FuseFeeDistributor", poolsSuperAdmin)) as FuseFeeDistributor;

    const chainid = parseInt(await getChainId());
    const pluginConfigs: DeployedPlugins = chainIdToConfig[chainid].deployedPlugins;

    const oldImplementations = [];
    const newImplementations = [];
    const arrayOfTrue = [];

    const pluginAddresses = Object.keys(pluginConfigs);

    for (const pluginAddress of pluginAddresses) {
      const conf = pluginConfigs[pluginAddress];
      console.log({ conf });

      const market = (await ethers.getContractAt(
        "CErc20PluginRewardsDelegate",
        conf.market
      )) as CErc20PluginRewardsDelegate;

      const currentPlugin = await market.callStatic.plugin();
      if (currentPlugin != pluginAddress) throw new Error(`wrong plugin address/config for market ${conf.market}`);
      oldImplementations.push(currentPlugin);

      let deployArgs;
      if (conf.otherParams) {
        deployArgs = [conf.underlying, ...conf.otherParams];
      } else {
        deployArgs = [conf.underlying];
      }

      console.log(deployArgs);
      const contractId = `${conf.strategy}_${conf.market}`;
      console.log(contractId);

      const artifact = await deployments.getArtifact(conf.strategy);
      const deployment = await deployments.deploy(contractId, {
        contract: artifact,
        from: upgradesAdmin.address,
        proxy: {
          proxyContract: "OpenZeppelinTransparentProxy",
          execute: {
            init: {
              methodName: "initialize",
              args: deployArgs,
            },
          },
          owner: upgradesAdmin.address,
        },
        log: true,
      });

      if (deployment.transactionHash) await ethers.provider.waitForTransaction(deployment.transactionHash);
      console.log("ERC4626 Strategy: ", deployment.address);

      let asOwnable = (await ethers.getContract(contractId, upgradesAdmin)) as SafeOwnableUpgradeable;
      let tx = await asOwnable._setPendingOwner(extrasAdmin.address);
      await tx.wait();
      console.log(`transferring the admin to ${extrasAdmin.address} with tx ${tx.hash}`);

      asOwnable = (await ethers.getContract(contractId, extrasAdmin)) as SafeOwnableUpgradeable;
      tx = await asOwnable._acceptOwner();
      await tx.wait();
      console.log(`accepted to be the owner ${extrasAdmin.address} with tx ${tx.hash}`);

      newImplementations.push(deployment.address);
      arrayOfTrue.push(true);
    }

    const tx = await ffd._editPluginImplementationWhitelist(oldImplementations, newImplementations, arrayOfTrue);
    await tx.wait();
    console.log("_editPluginImplementationWhitelist: ", tx.hash);

    for (const pluginAddress in pluginConfigs) {
      const conf = pluginConfigs[pluginAddress];
      console.log(conf);

      const market = (await ethers.getContractAt(
        "CErc20PluginRewardsDelegate",
        conf.market,
        poolsSuperAdmin
      )) as CErc20PluginRewardsDelegate;

      const comptrollerAddress = await market.callStatic.comptroller();

      const comptroller = (await ethers.getContractAt(
        "Comptroller.sol:Comptroller",
        comptrollerAddress,
        poolsSuperAdmin
      )) as Comptroller;

      const admin = await comptroller.callStatic.admin();
      if (admin == poolsSuperAdmin.address) {
        const currentPluginAddress = await market.callStatic.plugin();
        const contractId = `${conf.strategy}_${conf.market}`;
        const newPlugin = await ethers.getContract(contractId);
        const newPluginAddress = newPlugin.address;

        if (currentPluginAddress != newPluginAddress) {
          console.log(`changing ${currentPluginAddress} with ${newPluginAddress}`);
          const tx = await market._updatePlugin(newPluginAddress);
          await tx.wait();
          console.log("_updatePlugin: ", tx.hash);
        }
      } else {
        console.log(`market and pool have different admins ${admin}`);
      }
    }
  }
);

task("plugins:replace", "Replaces an old plugin contract with a new one")
  .addParam("market", "The address of the market", undefined, types.string)
  .addParam("newPlugin", "The address of the new plugin", undefined, types.string)
  .setAction(async ({ market: marketAddress, newPlugin: newPluginAddress }, { ethers }) => {
    const { poolsSuperAdmin } = await ethers.getNamedSigners();

    const market = (await ethers.getContractAt(
      "CErc20PluginRewardsDelegate",
      marketAddress,
      poolsSuperAdmin
    )) as CErc20PluginRewardsDelegate;
    try {
      const currentPluginAddress = await market.callStatic.plugin();
      if (currentPluginAddress != newPluginAddress) {
        console.log(`changing ${currentPluginAddress} with ${newPluginAddress}`);
        const tx = await market._updatePlugin(newPluginAddress);
        await tx.wait();
        console.log(`plugin changed with ${tx.hash}`);
      }
    } catch (e) {
      console.log(`market ${marketAddress} is probably not a plugin market`, e);
    }
  });
