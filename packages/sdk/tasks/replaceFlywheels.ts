import {task, types} from "hardhat/config";
import { constants } from "ethers";
import { MidasFlywheel } from "../lib/contracts/typechain/MidasFlywheel";
import { MidasReplacingFlywheel } from "../lib/contracts/typechain/MidasReplacingFlywheel";
import { FuseFlywheelDynamicRewardsPlugin } from "../lib/contracts/typechain/FuseFlywheelDynamicRewardsPlugin.sol/FuseFlywheelDynamicRewardsPlugin";
import { ComptrollerFirstExtension } from "../lib/contracts/typechain/ComptrollerFirstExtension";
import { Comptroller } from "../lib/contracts/typechain/Comptroller";

task("flywheel:replace:dynamic", "Replaces a flywheel with dynamic rewards")
  .addParam("flywheelToReplaceAddress", "address of flywheel to replace", undefined, types.string)
  .addParam("flywheelName", "name of the deploy artifact of the replacing flywheel", undefined, types.string)
  .addParam("pool", "address of comptroller", undefined, types.string)
  .setAction(async ({ flywheelToReplaceAddress, flywheelName, pool }, { ethers, getChainId, deployments }) => {
    const deployer = await ethers.getNamedSigner("deployer");

    if (flywheelToReplaceAddress == "0xC6431455AeE17a08D6409BdFB18c4bc73a4069E4") {
      if (flywheelName != "EPX") throw new Error(`name EPX`);
    }
    if (flywheelToReplaceAddress == "0x851Cc0037B6923e60dC81Fa79Ac0799cC983492c") {
      if (flywheelName != "DDD") throw new Error(`name DDD`);
    }
    const chainid = await getChainId();
    if (chainid == 56) {
      const flywheelContractName = `MidasReplacingFlywheel_${flywheelName}`;

      const flywheelToReplace = await ethers.getContractAt("MidasFlywheel", flywheelToReplaceAddress, deployer) as MidasFlywheel;

      const oldRewardsAddress = await flywheelToReplace.callStatic.flywheelRewards();
      const oldRewards = await ethers.getContractAt("FuseFlywheelDynamicRewardsPlugin", oldRewardsAddress, deployer) as FuseFlywheelDynamicRewardsPlugin;

      const rewardToken = flywheelToReplace.callStatic.rewardToken();
      const booster = flywheelToReplace.callStatic.flywheelBooster();

      //// deploy a replacing flywheel
      const replacingFw = await deployments.deploy(flywheelContractName, {
        contract: "MidasReplacingFlywheel",
        from: deployer.address,
        log: true,
        proxy: {
          execute: {
            init: {
              methodName: "initialize",
              args: [rewardToken, constants.AddressZero, booster, deployer.address, flywheelToReplaceAddress],
            },
          },
          proxyContract: "OpenZeppelinTransparentProxy",
          owner: deployer.address,
        },
        waitConfirmations: 1,
      });
      if (replacingFw.transactionHash) {
        await ethers.provider.waitForTransaction(replacingFw.transactionHash);
      }
      console.log("MidasReplacingFlywheel: ", replacingFw.address);

      const replacingFlywheel = await ethers.getContractAt("MidasReplacingFlywheel", replacingFw.address, deployer) as MidasReplacingFlywheel;

      const oldRewardsCycleLen = await oldRewards.callStatic.rewardsCycleLength();

      const replacingRewards = await deployments.deploy("ReplacingFlywheelDynamicRewards", {
        from: deployer.address,
        log: true,
        args: [flywheelToReplaceAddress, replacingFw.address, oldRewardsCycleLen],
      });
      if (replacingRewards.transactionHash) {
        await ethers.provider.waitForTransaction(replacingRewards.transactionHash);
      }
      console.log("ReplacingFlywheelDynamicRewards: ", replacingRewards.address);

      let tx = await flywheelToReplace.setFlywheelRewards(replacingRewards.address);
      await tx.wait();
      console.log(`old flywheel setFlywheelRewards`, tx.hash);

      tx = await replacingFlywheel.setFlywheelRewards(replacingRewards.address);
      await tx.wait();
      console.log(`new flywheel setFlywheelRewards`, tx.hash);

      const comptrollerAsExtension = (await ethers.getContractAt(
        "ComptrollerFirstExtension",
        pool,
        deployer
      )) as ComptrollerFirstExtension;

      tx = await comptrollerAsExtension.addNonAccruingFlywheel(flywheelToReplaceAddress);
      await tx.wait();
      console.log(`added the flywheel to the non-accruing with tx ${tx.hash}`);

      const comptroller = (await ethers.getContractAt(
        "Comptroller",
        pool,
        deployer
      )) as Comptroller;

      tx = await comptroller._addRewardsDistributor(replacingFlywheel.address);
      await tx.wait();
      console.log(`added the flywheel ${tx.hash}`);
    }
  });
