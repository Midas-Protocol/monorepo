import { task, types } from "hardhat/config";

import { ComptrollerFirstExtension } from "../../typechain/ComptrollerFirstExtension";
import { MidasFlywheel } from "../../typechain/MidasFlywheel";

export default task("flyhwheel:nonaccruing", "Sets a flywheel as non-accruing in the comptroller")
  .addParam("flywheel", "address of flywheel", undefined, types.string)
  .addParam("pool", "address of comptroller", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const { extrasAdmin } = await hre.ethers.getNamedSigners();

    const comptroller = (await hre.ethers.getContractAt(
      "ComptrollerFirstExtension",
      taskArgs.pool,
      extrasAdmin
    )) as ComptrollerFirstExtension;

    const tx = await comptroller.addNonAccruingFlywheel(taskArgs.flywheel);
    await tx.wait();
    console.log(`added the flywheel to the non-accruing with tx ${tx.hash}`);
  });

task("flywheel:remove", "remove a rewards distributor from a pool")
  .addParam("flywheel", "address of flywheel", undefined, types.string)
  .addParam("pool", "address of comptroller", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const { poolsSuperAdmin, extrasAdmin } = await hre.ethers.getNamedSigners();

    // extract the leftover rewards to the extrasAdmin
    const flywheel = (await hre.ethers.getContractAt("MidasFlywheel", taskArgs.flywheel, extrasAdmin)) as MidasFlywheel;
    let tx = await flywheel.setFlywheelRewards(extrasAdmin.address);
    await tx.wait();
    console.log("setFlywheelRewards: ", tx.hash);

    const asComptrollerExtension = (await hre.ethers.getContractAt(
      "ComptrollerFirstExtension",
      taskArgs.pool,
      poolsSuperAdmin
    )) as ComptrollerFirstExtension;

    tx = await asComptrollerExtension._removeFlywheel(taskArgs.flywheel);
    await tx.wait();
    console.log("_removeFlywheel: ", tx.hash);
  });
