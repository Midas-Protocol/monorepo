import { task, types } from "hardhat/config";

task("flywheel:deploy-static-rewards-fw", "Deploy static rewards flywheel for LM rewards")
  .addParam("signer", "Named account to use fo tx", "deployer", types.string)
  .addParam("name", "String to append to the flywheel contract name", undefined, types.string)
  .addParam("rewardToken", "Reward token of flywheel", undefined, types.string)
  .addParam("strategy", "address of strategy for which to enable the flywheel", undefined, types.string)
  .addParam("pool", "comptroller to which to add the flywheel", undefined, types.string)
  .setAction(async ({ signer, name, rewardToken, strategy, pool }, { ethers, deployments, run }) => {
    const deployer = await ethers.getNamedSigner(signer);
    // @ts-ignore
    const midasSdkModule = await import("../../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas(deployer);

    const flywheelBooster = await ethers.getContract("LooplessFlywheelBooster", deployer);

    const flywheel = await deployments.deploy(`MidasFlywheel_${name}`, {
      contract: "MidasFlywheel",
      from: deployer.address,
      log: true,
      proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: [rewardToken, ethers.constants.AddressZero, flywheelBooster.address, deployer.address],
          },
        },
        owner: deployer.address,
      },
      waitConfirmations: 1,
    });

    const rewards = await run("flywheel:deploy-static-rewards", { flywheel: flywheel.address, signer, name });

    const tx = await sdk.setFlywheelRewards(flywheel.address, rewards.address);
    await tx.wait();

    await run("flywheel:add-strategy-for-rewards", { flywheel: flywheel.address, strategy });
    await run("flywheel:add-to-pool", { flywheel: flywheel.address, pool });
  });

task("flywheel:deploy-static-rewards", "Deploy static rewards flywheel for LM rewards")
  .addParam("signer", "Named account to use fo tx", "deployer", types.string)
  .addParam("name", "String to append to the flywheel contract name", undefined, types.string)
  .addParam("flywheel", "flywheel to which to add the rewards contract", undefined, types.string)
  .setAction(async ({ signer, name, flywheel }, { ethers, deployments }) => {
    const deployer = await ethers.getNamedSigner(signer);
    const rewards = await deployments.deploy(`WithdrawableFlywheelStaticRewards_${name}`, {
      contract: "WithdrawableFlywheelStaticRewards",
      from: deployer.address,
      log: true,
      args: [
        flywheel, // flywheel
        deployer.address, // owner
        ethers.constants.AddressZero, // Authority
      ],
      waitConfirmations: 1,
    });
    // @ts-ignore
    const midasSdkModule = await import("../../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas(deployer);

    const tx = await sdk.setFlywheelRewards(flywheel, rewards.address);
    await tx.wait();
    return rewards.address;
  });

task("flywheel:add-strategy-for-rewards", "Create pool if does not exist")
  .addParam("signer", "Named account to use fo tx", "deployer", types.string)
  .addParam("flywheel", "address of flywheel", undefined, types.string)
  .addParam("strategy", "address of strategy", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const deployer = await hre.ethers.getNamedSigner(taskArgs.signer);

    let flywheelAddress, strategyAddress;

    try {
      flywheelAddress = hre.ethers.utils.getAddress(taskArgs.flywheel);
    } catch {
      throw `Invalid 'flywheel': ${taskArgs.flywheel}`;
    }

    try {
      strategyAddress = hre.ethers.utils.getAddress(taskArgs.strategy);
    } catch {
      throw `Invalid 'strategy': ${taskArgs.strategy}`;
    }

    // @ts-ignore
    const midasSdkModule = await import("../../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas(deployer);

    const addTx = await sdk.addStrategyForRewardsToFlywheelCore(flywheelAddress, strategyAddress);
    const receipt = await addTx.wait();
    console.log(receipt.transactionHash);
  });

task("flywheel:add-to-pool", "Create pool if does not exist")
  .addParam("signer", "Named account to use fo tx", "deployer", types.string)
  .addParam("flywheel", "address of flywheel", undefined, types.string)
  .addParam("pool", "address of comptroller", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const deployer = await hre.ethers.getNamedSigner(taskArgs.signer);
    let flywheelAddress, poolAddress;

    try {
      flywheelAddress = hre.ethers.utils.getAddress(taskArgs.flywheel);
    } catch {
      throw `Invalid 'flywheel': ${taskArgs.flywheel}`;
    }

    try {
      poolAddress = hre.ethers.utils.getAddress(taskArgs.pool);
    } catch {
      throw `Invalid 'pool': ${taskArgs.pool}`;
    }

    // @ts-ignore
    const midasSdkModule = await import("../../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas(deployer);
    console.log({ sdk });

    const addTx = await sdk.addFlywheelCoreToComptroller(flywheelAddress, poolAddress);
    console.log({ addTx });

    const receipt = await addTx.wait();
    console.log(receipt);
  });
