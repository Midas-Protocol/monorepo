import { constants, Contract } from "ethers";
import { task, types } from "hardhat/config";

import { Comptroller } from "../lib/contracts/typechain/Comptroller";
import { FuseFeeDistributor } from "../lib/contracts/typechain/FuseFeeDistributor";
import { FusePoolDirectory } from "../lib/contracts/typechain/FusePoolDirectory";

export default task("comptroller:implementation:whitelist", "Whitelists a new comptroller implementation upgrade")
  .addParam("oldImplementation", "The address of the old comptroller implementation", undefined, types.string)
  .addParam("newImplementation", "The address of the new comptroller implementation", undefined, types.string)
  .addFlag("setLatest", "Set the new implementation as the latest for the autoimplementations")
  .setAction(async ({ oldImplementation, newImplementation, setLatest }, { ethers }) => {
    const deployer = await ethers.getNamedSigner("deployer");

    // @ts-ignoreutils/fuseSdk
    const midasSdkModule = await import("../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas();

    const fuseFeeDistributor = new ethers.Contract(
      sdk.chainDeployment.FuseFeeDistributor.address,
      sdk.chainDeployment.FuseFeeDistributor.abi,
      deployer
    );

    const oldComptrollerImplementations = [oldImplementation];
    const newComptrollerImplementations = [newImplementation];
    const comptrollerArrayOfTrue = [true];

    let tx = await fuseFeeDistributor._editComptrollerImplementationWhitelist(
      oldComptrollerImplementations,
      newComptrollerImplementations,
      comptrollerArrayOfTrue
    );
    await tx.wait();
    console.log("FuseFeeDistributor comptroller whitelist set", tx.hash);

    if (setLatest) {
      const latestComptrollerImplementation = await fuseFeeDistributor.latestComptrollerImplementation(
        oldImplementation
      );
      if (
        latestComptrollerImplementation === constants.AddressZero ||
        latestComptrollerImplementation !== newImplementation
      ) {
        tx = await fuseFeeDistributor._setLatestComptrollerImplementation(oldImplementation, newImplementation);
        await tx.wait();
        console.log(`Set the latest Comptroller implementation for ${oldImplementation} to ${newImplementation}`);
      } else {
        console.log(`No change in the latest Comptroller implementation ${newImplementation}`);
      }
    }
  });

task("pools:all:upgrade", "Upgrades all pools comptroller implementations whose autoimplementatoins are on").setAction(
  async (taskArgs, { ethers }) => {
    const deployer = await ethers.getNamedSigner("deployer");

    // @ts-ignoreutils/fuseSdk
    const midasSdkModule = await import("../tests/utils/midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas();

    const fusePoolDirectory = (await ethers.getContract("FusePoolDirectory", deployer)) as FusePoolDirectory;
    const fuseFeeDistributor = new ethers.Contract(
      sdk.chainDeployment.FuseFeeDistributor.address,
      sdk.chainDeployment.FuseFeeDistributor.abi,
      deployer
    ) as FuseFeeDistributor;

    const pools = await fusePoolDirectory.callStatic.getAllPools();
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i];
      console.log("pool name", pool.name);
      const comptroller = (await new Contract(
        pool.comptroller,
        sdk.chainDeployment.Comptroller.abi,
        deployer
      )) as Comptroller;
      const admin = await comptroller.callStatic.admin();
      console.log("pool admin", admin);

      try {
        const implBefore = await comptroller.callStatic.comptrollerImplementation();
        const latestImpl = await fuseFeeDistributor.callStatic.latestComptrollerImplementation(implBefore);
        if (latestImpl == constants.AddressZero || latestImpl == implBefore) {
          console.log(`No auto upgrade with latest implementation ${latestImpl}`);
        } else {
          if (admin == deployer.address) {
            const autoImplOn = await comptroller.callStatic.autoImplementation();
            if (!autoImplOn) {
              const tx = await comptroller._toggleAutoImplementations(true);
              await tx.wait();
              console.log(`turned autoimpl on ${tx.hash}`);
            }
          } else {
            console.log(`the admin of the pool ${admin} is not the deployer`);
          }

          console.log(`Making an empty call to upgrade ${pool.comptroller} from ${implBefore} to ${latestImpl}`);
          const tx = await comptroller.enterMarkets([]);
          await tx.wait();
          const implAfter = await comptroller.callStatic.comptrollerImplementation();
          console.log(`Comptroller implementation after ${implAfter}`);

          if (admin == deployer.address) {
            const tx = await comptroller._toggleAutoImplementations(false);
            await tx.wait();
            console.log(`turned autoimpl off ${tx.hash}`);
          }
        }
      } catch (e) {
        console.error(`error while upgrading the pool ${JSON.stringify(pool)}`, e);
      }
    }
  }
);
