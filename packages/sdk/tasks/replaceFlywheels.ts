import { constants } from "ethers";
import { task, types } from "hardhat/config";

import { Comptroller } from "../typechain/Comptroller";
import { ComptrollerFirstExtension } from "../typechain/ComptrollerFirstExtension";
import { FuseFlywheelDynamicRewardsPlugin } from "../typechain/FuseFlywheelDynamicRewardsPlugin";
import { MidasFlywheel } from "../typechain/MidasFlywheel";
import { MidasReplacingFlywheel } from "../typechain/MidasReplacingFlywheel";

task("flywheel:replace:dynamic", "Replaces a flywheel with dynamic rewards")
  .addParam("flywheelToReplaceAddress", "address of flywheel to replace", undefined, types.string)
  .addParam("flywheelName", "name of the deploy artifact of the replacing flywheel", undefined, types.string)
  .addParam("pool", "address of comptroller", undefined, types.string)
  .setAction(
    async ({ flywheelToReplaceAddress, flywheelName, pool }, { ethers, getNamedAccounts, getChainId, deployments }) => {
      const { upgradesAdmin, poolsSuperAdmin, extrasAdmin } = await getNamedAccounts();

      if (flywheelToReplaceAddress == "0xC6431455AeE17a08D6409BdFB18c4bc73a4069E4") {
        if (flywheelName != "EPX") throw new Error(`name EPX`);
      }
      if (flywheelToReplaceAddress == "0x851Cc0037B6923e60dC81Fa79Ac0799cC983492c") {
        if (flywheelName != "DDD") throw new Error(`name DDD`);
      }
      const chainid = await getChainId();
      if (chainid == 56) {
        const flywheelContractName = `MidasFlywheel_${flywheelName}`;

        const flywheelToReplace = (await ethers.getContractAt(
          "MidasFlywheel",
          flywheelToReplaceAddress,
          extrasAdmin
        )) as MidasFlywheel;

        const oldRewardsAddress = await flywheelToReplace.callStatic.flywheelRewards();
        const oldRewards = (await ethers.getContractAt(
          "FuseFlywheelDynamicRewardsPlugin",
          oldRewardsAddress
        )) as FuseFlywheelDynamicRewardsPlugin;

        const rewardToken = flywheelToReplace.callStatic.rewardToken();
        const booster = flywheelToReplace.callStatic.flywheelBooster();

        //// deploy a replacing flywheel
        const replacingFw = await deployments.deploy(flywheelContractName, {
          contract: "MidasReplacingFlywheel",
          from: upgradesAdmin,
          log: true,
          proxy: {
            execute: {
              init: {
                methodName: "initialize",
                args: [rewardToken, constants.AddressZero, booster, extrasAdmin],
              },
              onUpgrade: {
                methodName: "reinitialize",
                args: [flywheelToReplaceAddress],
              },
            },
            proxyContract: "OpenZeppelinTransparentProxy",
            owner: upgradesAdmin,
          },
          waitConfirmations: 1,
        });
        if (replacingFw.transactionHash) {
          await ethers.provider.waitForTransaction(replacingFw.transactionHash);
        }
        console.log("MidasReplacingFlywheel: ", replacingFw.address);

        const replacingFlywheel = (await ethers.getContractAt(
          "MidasReplacingFlywheel",
          replacingFw.address,
          extrasAdmin
        )) as MidasReplacingFlywheel;

        let tx = await replacingFlywheel.reinitialize(flywheelToReplaceAddress);
        await tx.wait();
        console.log(`reinitialize`, tx.hash);

        const oldRewardsCycleLen = await oldRewards.callStatic.rewardsCycleLength();

        const replacingRewards = await deployments.deploy("ReplacingFlywheelDynamicRewards", {
          from: extrasAdmin,
          log: true,
          args: [flywheelToReplaceAddress, replacingFw.address, oldRewardsCycleLen],
        });
        if (replacingRewards.transactionHash) {
          await ethers.provider.waitForTransaction(replacingRewards.transactionHash);
        }
        console.log("ReplacingFlywheelDynamicRewards: ", replacingRewards.address);

        tx = await flywheelToReplace.setFlywheelRewards(replacingRewards.address);
        await tx.wait();
        console.log(`old flywheel setFlywheelRewards`, tx.hash);

        tx = await replacingFlywheel.setFlywheelRewards(replacingRewards.address);
        await tx.wait();
        console.log(`new flywheel setFlywheelRewards`, tx.hash);

        const comptrollerAsExtension = (await ethers.getContractAt(
          "ComptrollerFirstExtension",
          pool,
          poolsSuperAdmin
        )) as ComptrollerFirstExtension;

        const comptroller = (await ethers.getContractAt("Comptroller", pool, poolsSuperAdmin)) as Comptroller;

        tx = await comptroller._addRewardsDistributor(replacingFlywheel.address);
        await tx.wait();
        console.log(`added the flywheel ${tx.hash}`);

        tx = await comptrollerAsExtension.addNonAccruingFlywheel(flywheelToReplaceAddress);
        await tx.wait();
        console.log(`added the flywheel to the non-accruing with tx ${tx.hash}`);
      }
    }
  );
