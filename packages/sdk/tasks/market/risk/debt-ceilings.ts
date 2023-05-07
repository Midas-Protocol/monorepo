import { providers } from "ethers";
import { task, types } from "hardhat/config";

import ERC20UpgradeableAbi from "../../../abis/ERC20Upgradeable";

export default task("market:set-debt-ceiling", "Sets debt ceiling for market against another")
  .addParam("admin", "Named account from which to pause the minting on the market", "deployer", types.string)
  .addParam("collat", "The address of the collateral CToken", undefined, types.string)
  .addParam("borrow", "The address of the borrow CToken", undefined, types.string)
  .addParam(
    "maxDebt",
    "Maximum amount of debt that can be accrued, denominated in the borrowed asset",
    undefined,
    types.string
  )
  .setAction(async ({ admin, collat, borrow, maxDebt }, { ethers }) => {
    const signer = await ethers.getNamedSigner(admin);

    const midasSdkModule = await import("../../midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas(signer);

    const collatCToken = sdk.createCTokenWithExtensions(collat, signer);
    const borrowCToken = sdk.createCTokenWithExtensions(borrow, signer);
    const borrowUl = new ethers.Contract(await borrowCToken.callStatic.underlying(), ERC20UpgradeableAbi, signer);

    const comptroller = await collatCToken.callStatic.comptroller();
    if (comptroller !== (await borrowCToken.callStatic.comptroller())) {
      throw new Error("Comptrollers do not match");
    }

    const pool = sdk.createComptroller(comptroller, signer);

    const currentDebtCeilings = await pool.callStatic.borrowCapForCollateral(
      borrowCToken.address,
      collatCToken.address
    );

    console.log(`Current debt ceiling is ${currentDebtCeilings}`);
    const newDebtCeiling = ethers.utils.parseUnits(maxDebt, await borrowUl.decimals());

    if (currentDebtCeilings.eq(newDebtCeiling)) {
      console.log("Debt ceilings already set to this value");
      return;
    }

    const tx: providers.TransactionResponse = await pool._setBorrowCapForCollateral(
      borrowCToken.address,
      collatCToken.address,
      newDebtCeiling
    );
    await tx.wait();

    const newBorrowCapSet = await pool.callStatic.borrowCapForCollateral(borrowCToken.address, collatCToken.address);

    console.log(
      `New borrow cap set: ${newBorrowCapSet.toNumber()} for ${borrowCToken.address} borrows with ${
        collatCToken.address
      } collateral`
    );
  });

task("market:set-debt-ceiling-whitelist", "Whitelists an account for the borrowing against collateral cap")
  .addParam("admin", "Named account from which to pause the minting on the market", "deployer", types.string)
  .addParam("collat", "The address of the collateral CToken", undefined, types.string)
  .addParam("borrow", "The address of the borrow CToken", undefined, types.string)
  .addParam("account", "Address to whitelist", undefined, types.string)
  .addOptionalParam("whitelist", "Set whitelist to true ot false", true, types.boolean)
  .setAction(async ({ admin, collat, borrow, account, whitelist }, { ethers }) => {
    const signer = await ethers.getNamedSigner(admin);

    const midasSdkModule = await import("../../midasSdk");
    const sdk = await midasSdkModule.getOrCreateMidas(signer);

    const collatCToken = sdk.createCTokenWithExtensions(collat, signer);
    const borrowCToken = sdk.createCTokenWithExtensions(borrow, signer);

    const comptroller = await collatCToken.callStatic.comptroller();
    if (comptroller !== (await borrowCToken.callStatic.comptroller())) {
      throw new Error("Comptrollers do not match");
    }
    const pool = sdk.createComptroller(comptroller, signer);
    const whitelistStatus = await pool.callStatic.isBorrowCapForCollateralWhitelisted(
      borrowCToken.address,
      collatCToken.address,
      account
    );
    if (whitelistStatus == whitelist) {
      console.log(`Whitelist status is already ${whitelist}`);
      return;
    } else {
      console.log(`Whitelist status is ${whitelistStatus}, setting to ${whitelist}`);
      const tx = await pool._setBorrowCapForCollateralWhitelist(
        borrowCToken.address,
        collatCToken.address,
        account,
        whitelist
      );
      await tx.wait();
      console.log(
        `Whitelist status for ${account} set: ${await pool.isBorrowCapForCollateralWhitelisted(
          borrowCToken.address,
          collatCToken.address,
          account
        )}`
      );
    }
  });
