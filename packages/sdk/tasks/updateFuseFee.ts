import { Contract } from "ethers";
import { task, types } from "hardhat/config";

export default task("fusefee:update", "Update FuseFee")
  .addParam("signer", "Named account to use fo tx", "deployer", types.string)
  .addParam("cToken", "Asset cToken Address", undefined, types.string)
  .addParam("adminFee", "AdminFee", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    const adminFee = taskArgs.adminFee;

    const signer = await hre.ethers.getNamedSigner(taskArgs.signer);

    // @ts-ignore
    const fuseModule = await import("../tests/utils/fuseSdk");
    const sdk = await fuseModule.getOrCreateFuse();

    const cToken = new Contract(taskArgs.cToken, sdk.chainDeployment.CErc20Delegate.abi, signer);

    await cToken._setAdminFee(adminFee);
  });
