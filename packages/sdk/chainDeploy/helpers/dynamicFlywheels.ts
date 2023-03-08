import { constants } from "ethers";

import { FuseFlywheelDeployFnParams } from "..";
import { MidasFlywheel } from "../../typechain/MidasFlywheel";

export const deployFlywheelWithDynamicRewards = async ({
  ethers,
  getNamedAccounts,
  deployments,
  deployConfig,
}: FuseFlywheelDeployFnParams): Promise<Array<string>> => {
  const { upgradesAdmin, extrasAdmin } = await getNamedAccounts();

  const dynamicFlywheels = [];

  for (const config of deployConfig.dynamicFlywheels) {
    if (config) {
      console.log(
        `Deploying MidasReplacingFlywheel & ReplacingFlywheelDynamicRewards for ${config.rewardToken} reward token`
      );
      const flywheelBooster = await ethers.getContract("LooplessFlywheelBooster", upgradesAdmin);
      const flywheelToReplace = config.flywheelToReplace ? config.flywheelToReplace : constants.AddressZero;

      //// MidasFlywheelCore with Dynamic Rewards
      const fwc = await deployments.deploy(`MidasFlywheel_${config.name}`, {
        contract: "MidasReplacingFlywheel",
        from: upgradesAdmin,
        log: true,
        proxy: {
          execute: {
            init: {
              methodName: "initialize",
              args: [config.rewardToken, constants.AddressZero, flywheelBooster.address, extrasAdmin],
            },
            onUpgrade: {
              methodName: "reinitialize",
              args: [flywheelToReplace],
            },
          },
          proxyContract: "OpenZeppelinTransparentProxy",
          owner: upgradesAdmin,
        },
        waitConfirmations: 1,
      });
      if (fwc.transactionHash) {
        await ethers.provider.waitForTransaction(fwc.transactionHash);
      }
      console.log("MidasFlywheel: ", fwc.address);

      const fdr = await deployments.deploy(`ReplacingFlywheelDynamicRewards_${config.name}`, {
        contract: "ReplacingFlywheelDynamicRewards",
        from: upgradesAdmin,
        args: [flywheelToReplace, fwc.address, config.cycleLength],
        log: true,
        waitConfirmations: 1,
      });
      if (fdr.transactionHash) {
        await ethers.provider.waitForTransaction(fdr.transactionHash);
      }
      console.log("ReplacingFlywheelDynamicRewards: ", fdr.address);

      const flywheelCore = (await ethers.getContract(`MidasFlywheel_${config.name}`, extrasAdmin)) as MidasFlywheel;
      const currentRewards = await flywheelCore.callStatic.flywheelRewards();
      if (currentRewards != fdr.address) {
        const tx = await flywheelCore.setFlywheelRewards(fdr.address);
        await tx.wait();
        console.log("setFlywheelRewards: ", tx.hash);
      } else {
        console.log(`rewards contract already set`);
      }

      dynamicFlywheels.push(fwc.address);
    }
  }
  return dynamicFlywheels;
};
