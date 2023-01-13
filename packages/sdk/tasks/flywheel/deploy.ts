import { task, types } from "hardhat/config";

task("flywheel:deploy-static-rewards", "Deploy static rewards flywheel for LM rewards")
  .addParam("name", "String to append to the flywheel contract name", undefined, types.string)
  .addParam("rewardToken", "Reward token of flywheel", undefined, types.string)
  .addParam("strategy", "address of strategy for which to enable the flywheel", undefined, types.string)
  .addParam("pool", "comptroller to which to add the flywheel", undefined, types.string)
  .setAction(async ({ name, rewardToken, strategy, pool }, { ethers, deployments, run }) => {
    const { extrasAdmin } = await ethers.getNamedSigners();

    const flywheelBooster = await ethers.getContract("LooplessFlywheelBooster");

    const flywheel = await deployments.deploy(`MidasFlywheel_${name}`, {
      contract: "MidasFlywheel",
      from: extrasAdmin.address,
      log: true,
      proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: [rewardToken, ethers.constants.AddressZero, flywheelBooster.address, extrasAdmin.address],
          },
        },
        owner: extrasAdmin.address,
      },
      waitConfirmations: 1,
    });

    const rewards = await deployments.deploy(`FlywheelStaticRewards_${name}`, {
      contract: "FlywheelStaticRewards",
      from: extrasAdmin.address,
      log: true,
      args: [
        flywheel.address, // flywheel
        extrasAdmin.address, // owner
        ethers.constants.AddressZero, // Authority
      ],
      waitConfirmations: 1,
    });
    // @ts-ignore
    const midasSdkModule = await import("../../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas(extrasAdmin);

    await sdk.setFlywheelRewards(flywheel.address, rewards.address);

    await run("flywheel:add-strategy-for-rewards", { flywheel: flywheel.address, strategy });
    await run("flywheel:add-to-pool", { flywheel: flywheel.address, pool });
  });

task("flywheel:add-strategy-for-rewards", "Create pool if does not exist")
  .addParam("flywheel", "address of flywheel", undefined, types.string)
  .addParam("strategy", "address of strategy", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const { extrasAdmin } = await hre.ethers.getNamedSigners();

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
    const sdk = await midasSdkModule.getOrCreateMidas(extrasAdmin);

    const addTx = await sdk.addStrategyForRewardsToFlywheelCore(flywheelAddress, strategyAddress);
    console.log(addTx);

    const receipt = await addTx.wait();
    console.log(receipt);
  });

task("flywheel:add-to-pool", "Create pool if does not exist")
  .addParam("flywheel", "address of flywheel", undefined, types.string)
  .addParam("pool", "address of comptroller", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const { extrasAdmin } = await hre.ethers.getNamedSigners();

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
    const sdk = await midasSdkModule.getOrCreateMidas(extrasAdmin);
    console.log({ sdk });

    const addTx = await sdk.addFlywheelCoreToComptroller(flywheelAddress, poolAddress);
    console.log({ addTx });

    const receipt = await addTx.wait();
    console.log(receipt);
  });
