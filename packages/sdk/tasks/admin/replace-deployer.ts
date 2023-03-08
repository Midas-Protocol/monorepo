import { providers } from "ethers";
import { task, types } from "hardhat/config";

import { AddressesProvider } from "../../typechain/AddressesProvider";
import { AdrastiaPriceOracle } from "../../typechain/AdrastiaPriceOracle";
import { CErc20PluginDelegate } from "../../typechain/CErc20PluginDelegate";
import { ComptrollerFirstExtension } from "../../typechain/ComptrollerFirstExtension";
import { DiaPriceOracle } from "../../typechain/DiaPriceOracle";
import { FusePoolDirectory } from "../../typechain/FusePoolDirectory";
import { MasterPriceOracle } from "../../typechain/MasterPriceOracle";
import { MidasERC4626 } from "../../typechain/MidasERC4626";
import { MidasFlywheelCore } from "../../typechain/MidasFlywheelCore";
import { Ownable } from "../../typechain/Ownable";
import { OwnableUpgradeable } from "../../typechain/OwnableUpgradeable";
import { SaddleLpPriceOracle } from "../../typechain/SaddleLpPriceOracle";
import { SafeOwnableUpgradeable } from "../../typechain/SafeOwnableUpgradeable";
import { Unitroller } from "../../typechain/Unitroller";

// TODO add ERC20Wrapper from CErc20WrappingDelegate
export default task("system:admin:change", "Changes the system admin to a new address")
  .addParam("currentDeployer", "The address of the current deployer", undefined, types.string)
  .addParam("newDeployer", "The address of the new deployer", undefined, types.string)
  .setAction(async ({ currentDeployer, newDeployer }, { ethers }) => {
    let tx: providers.TransactionResponse;

    const deployer = await ethers.getSigner(currentDeployer);

    // hardcode it here
    if (newDeployer !== "hardcode it here") {
      throw new Error(`wrong new deployer`);
    } else {
      {
        // OwnableUpgradeable - transferOwnership(newDeployer)
        const fsl = (await ethers.getContract("FuseSafeLiquidator", deployer)) as OwnableUpgradeable;
        const currentOwnerFSL = await fsl.callStatic.owner();
        console.log(`current FSL owner ${currentOwnerFSL}`);

        if (currentOwnerFSL == currentDeployer) {
          tx = await fsl.transferOwnership(newDeployer);
          await tx.wait();
          console.log(`fsl.transferOwnership tx mined ${tx.hash}`);
        } else if (currentOwnerFSL != newDeployer) {
          console.error(`unknown  owner ${currentOwnerFSL}`);
        }

        const ap = (await ethers.getContract("AddressesProvider", deployer)) as AddressesProvider;
        const currentOwnerAp = await ap.callStatic.owner();
        console.log(`current AP owner ${currentOwnerAp}`);
        if (currentOwnerAp == currentDeployer) {
          tx = await ap.transferOwnership(newDeployer);
          await tx.wait();
          console.log(`ap.transferOwnership tx mined ${tx.hash}`);
        } else if (currentOwnerAp != newDeployer) {
          console.error(`unknown  owner ${currentOwnerAp}`);
        }
      }

      {
        // SafeOwnableUpgradeable - _setPendingOwner() / _acceptOwner()
        const ffd = (await ethers.getContract("FuseFeeDistributor", deployer)) as SafeOwnableUpgradeable;
        const currentOwnerFFD = await ffd.callStatic.owner();
        console.log(`current FFD owner ${currentOwnerFFD}`);
        if (currentOwnerFFD == currentDeployer) {
          const currentPendingOwner = await ffd.callStatic.pendingOwner();
          console.log(`current pending owner ${currentPendingOwner}`);
          if (currentPendingOwner != newDeployer) {
            tx = await ffd._setPendingOwner(newDeployer);
            await tx.wait();
            console.log(`ffd._setPendingOwner tx mined ${tx.hash}`);
          }
        } else if (currentOwnerFFD != newDeployer) {
          console.error(`unknown owner ${currentOwnerFFD}`);
        }

        const fpd = (await ethers.getContract("FusePoolDirectory", deployer)) as SafeOwnableUpgradeable;
        const currentOwnerFPD = await fpd.callStatic.owner();
        console.log(`current FPD owner ${currentOwnerFPD}`);
        if (currentOwnerFPD == currentDeployer) {
          const currentPendingOwner = await fpd.callStatic.pendingOwner();
          console.log(`current pending owner ${currentPendingOwner}`);
          if (currentPendingOwner != newDeployer) {
            tx = await fpd._setPendingOwner(newDeployer);
            await tx.wait();
            console.log(`fpd._setPendingOwner tx mined ${tx.hash}`);
          }
        } else if (currentOwnerFPD != newDeployer) {
          console.error(`unknown owner ${currentOwnerFPD}`);
        }

        const curveOracle = (await ethers.getContractOrNull(
          "CurveLpTokenPriceOracleNoRegistry",
          deployer
        )) as SafeOwnableUpgradeable;

        if (curveOracle) {
          const currentOwnerCurveOracle = await curveOracle.callStatic.owner();
          console.log(`current curve oracle owner ${currentOwnerCurveOracle}`);
          if (currentOwnerCurveOracle == currentDeployer) {
            const currentPendingOwner = await curveOracle.callStatic.pendingOwner();
            console.log(`current pending owner ${currentPendingOwner}`);
            if (currentPendingOwner != newDeployer) {
              tx = await curveOracle._setPendingOwner(newDeployer);
              await tx.wait();
              console.log(`curveOracle._setPendingOwner tx mined ${tx.hash}`);
            }
          } else if (currentOwnerCurveOracle != newDeployer) {
            console.error(`unknown  owner ${currentOwnerCurveOracle}`);
          }
        }
      }

      {
        // DefaultProxyAdmin / TransparentUpgradeableProxy
        const dpa = (await ethers.getContract("DefaultProxyAdmin", deployer)) as Ownable;
        const currentOwnerDPA = await dpa.callStatic.owner();
        console.log(`current dpa owner ${currentOwnerDPA}`);
        if (currentOwnerDPA == currentDeployer) {
          tx = await dpa.transferOwnership(newDeployer);
          await tx.wait();
          console.log(`dpa.transferOwnership tx mined ${tx.hash}`);
        } else if (currentOwnerDPA != newDeployer) {
          console.error(`unknown  owner ${currentOwnerDPA}`);
        }
      }

      {
        // custom
        const dpo = (await ethers.getContractOrNull("DiaPriceOracle", deployer)) as DiaPriceOracle;
        if (dpo) {
          const currentOwnerDpo = await dpo.callStatic.admin();
          console.log(`current DPO admin ${currentOwnerDpo}`);
          if (currentOwnerDpo == currentDeployer) {
            tx = await dpo.changeAdmin(newDeployer);
            await tx.wait();
            console.log(`dpo.changeAdmin tx mined ${tx.hash}`);
          } else if (currentOwnerDpo != newDeployer) {
            console.error(`unknown  owner ${currentOwnerDpo}`);
          }
        }

        const mpo = (await ethers.getContract("MasterPriceOracle", deployer)) as MasterPriceOracle;
        const currentAdminMPO = await mpo.callStatic.admin();
        console.log(`current MPO admin ${currentAdminMPO}`);
        if (currentAdminMPO == currentDeployer) {
          tx = await mpo.changeAdmin(newDeployer);
          await tx.wait();
          console.log(`mpo.changeAdmin tx mined ${tx.hash}`);
        } else if (currentAdminMPO != newDeployer) {
          console.error(`unknown  admin ${currentAdminMPO}`);
        }
      }

      const fusePoolDirectory = (await ethers.getContract("FusePoolDirectory", deployer)) as FusePoolDirectory;
      const [, pools] = await fusePoolDirectory.callStatic.getActivePools();
      for (let i = 0; i < pools.length; i++) {
        const pool = pools[i];
        console.log("pool name", pool.name);
        const unitroller = (await ethers.getContractAt("Unitroller", pool.comptroller, deployer)) as Unitroller;
        const admin = await unitroller.callStatic.admin();
        console.log("pool admin", admin);
        console.log("pool comptroller", pool.comptroller);

        if (admin === currentDeployer) {
          {
            // Unitroller - _setPendingAdmin/_acceptAdmin
            const pendingAdmin = await unitroller.callStatic.pendingAdmin();
            if (pendingAdmin != newDeployer) {
              tx = await unitroller._setPendingAdmin(newDeployer);
              await tx.wait();
              console.log(`unitroller._setPendingAdmin tx mined ${tx.hash}`);
            }
          }
        } else if (admin != newDeployer) {
          console.error(`unknown pool admin ${admin}`);
        }

        const comptrollerAsExtension = (await ethers.getContractAt(
          "ComptrollerFirstExtension",
          pool.comptroller,
          deployer
        )) as ComptrollerFirstExtension;
        const flywheels = await comptrollerAsExtension.callStatic.getRewardsDistributors();
        for (let k = 0; k < flywheels.length; k++) {
          const flywheelAddress = flywheels[k];
          {
            const flywheelCore = (await ethers.getContractAt(
              "MidasFlywheelCore",
              flywheelAddress,
              deployer
            )) as MidasFlywheelCore;

            const currentOwner = await flywheelCore.callStatic.owner();
            console.log(`current owner ${currentOwner} of the flywheel at ${flywheelCore.address}`);

            if (currentOwner == currentDeployer) {
              const currentPendingOwner = await flywheelCore.callStatic.pendingOwner();
              console.log(`current pending owner ${currentPendingOwner}`);
              if (currentPendingOwner != newDeployer) {
                tx = await flywheelCore._setPendingOwner(newDeployer);
                await tx.wait();
                console.log(`_setPendingOwner tx mined ${tx.hash}`);
              }
            } else if (currentOwner != newDeployer) {
              console.error(`unknown flywheel owner ${currentOwner}`);
            }
          }
        }

        const markets = await comptrollerAsExtension.callStatic.getAllMarkets();
        for (let j = 0; j < markets.length; j++) {
          const market = markets[j];
          console.log(`market ${market}`);
          const cTokenInstance = (await ethers.getContractAt(
            "CErc20PluginDelegate",
            market,
            deployer
          )) as CErc20PluginDelegate;

          console.log("market", {
            cTokenName: await cTokenInstance.callStatic.name(),
            cTokenNameSymbol: await cTokenInstance.callStatic.symbol(),
            implementation: await cTokenInstance.callStatic.implementation(),
          });

          let pluginAddress;
          try {
            pluginAddress = await cTokenInstance.callStatic.plugin();
          } catch (pluginError) {
            console.log(`most probably the market has no plugin`);
          }
          if (pluginAddress) {
            // Ownable - transferOwnership(address newOwner)
            const midasERC4626 = (await ethers.getContractAt("MidasERC4626", pluginAddress, deployer)) as MidasERC4626;

            let currentOwner;
            try {
              currentOwner = await midasERC4626.callStatic.owner();
            } catch (pluginError) {
              console.log(`most probably the market has no plugin`);
            }

            if (currentOwner == currentDeployer) {
              //tx = await midasERC4626.transferOwnership(newDeployer);
              const currentPendingOwner = await midasERC4626.callStatic.pendingOwner();
              console.log(`current pending owner ${currentPendingOwner}`);
              if (currentPendingOwner != newDeployer) {
                tx = await midasERC4626._setPendingOwner(newDeployer);
                await tx.wait();
                console.log(`midasERC4626._setPendingOwner tx mined ${tx.hash}`);
              }
            } else if (currentOwner != newDeployer) {
              console.error(`unknown plugin owner ${currentOwner} for ${pluginAddress}`);
            }
          }
        }
      }

      // transfer all the leftover funds to the new deployer
      const newDeployerSigner = await ethers.getSigner(newDeployer);
      const newDeployerBalance = await newDeployerSigner.getBalance();
      if (newDeployerBalance.isZero()) {
        const oldDeployerBalance = await deployer.getBalance();
        const transaction: providers.TransactionRequest = {
          to: newDeployer,
          value: oldDeployerBalance,
          gasLimit: 21000,
        };

        transaction.gasLimit = await ethers.provider.estimateGas(transaction);

        const feeData = await ethers.provider.getFeeData();
        let feePerGas;
        const chainId = ethers.provider.network.chainId;
        if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas && chainId != 137 && chainId != 250) {
          transaction.maxFeePerGas = feeData.maxFeePerGas;
          transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas; //.div(2);
          feePerGas = transaction.maxFeePerGas.add(transaction.maxPriorityFeePerGas);
        } else {
          transaction.gasPrice = feeData.gasPrice;
          feePerGas = transaction.gasPrice;
        }
        // leave 10% for the old to clean up any other holdings
        transaction.value = oldDeployerBalance.mul(9).div(10);

        tx = await deployer.sendTransaction(transaction);
        await tx.wait();
        console.log(`funding the new deployer tx mined ${tx.hash}`);
      }
    }

    console.log("now change the mnemonic in order to run the accept owner role task");
  });

task("system:admin:accept", "Accepts the pending admin/owner roles as the new admin/owner")
  .addParam("newDeployer", "The address of the new deployer", undefined, types.string)
  .setAction(async ({ newDeployer }, { ethers }) => {
    let tx: providers.TransactionResponse;

    const deployer = await ethers.getSigner(newDeployer);

    const fusePoolDirectory = (await ethers.getContract("FusePoolDirectory", deployer)) as FusePoolDirectory;
    const [, pools] = await fusePoolDirectory.callStatic.getActivePools();
    for (let i = 0; i < pools.length; i++) {
      const pool = pools[i];
      console.log("pool name", pool.name);
      const unitroller = (await ethers.getContractAt("Unitroller", pool.comptroller, deployer)) as Unitroller;

      const admin = await unitroller.callStatic.admin();
      console.log("pool admin", admin);

      const pendingAdmin = await unitroller.callStatic.pendingAdmin();
      console.log("pool pending admin", pendingAdmin);

      if (pendingAdmin === newDeployer) {
        {
          // Unitroller - _setPendingAdmin/_acceptAdmin
          tx = await unitroller._acceptAdmin();
          await tx.wait();
          console.log(`unitroller._acceptAdmin tx mined ${tx.hash}`);
        }
      } else {
        if (pendingAdmin !== ethers.constants.AddressZero) {
          console.error(`the pending admin ${pendingAdmin} is not the new deployer`);
        }
      }

      // MidasFlywheelCore - SafeOwnableUpgradeable - _setPendingOwner() / _acceptOwner()
      {
        const comptroller = (await ethers.getContractAt(
          "ComptrollerFirstExtension",
          pool.comptroller,
          deployer
        )) as ComptrollerFirstExtension;
        const flywheels = await comptroller.callStatic.getRewardsDistributors();
        for (let k = 0; k < flywheels.length; k++) {
          const flywheelAddress = flywheels[k];
          {
            const flywheelCore = (await ethers.getContractAt(
              "MidasFlywheelCore",
              flywheelAddress,
              deployer
            )) as MidasFlywheelCore;
            const flywheelPendingOwner = await flywheelCore.callStatic.pendingOwner();
            if (flywheelPendingOwner == deployer.address) {
              console.log(`accepting the owner role for flywheel ${flywheelAddress}`);
              tx = await flywheelCore._acceptOwner();
              await tx.wait();
              console.log(`flywheelCore._acceptAdmin tx mined ${tx.hash}`);
            } else {
              console.log(`not the flywheel ${flywheelAddress} pending owner ${flywheelPendingOwner}`);
            }
          }
        }

        const comptrollerAsExtension = (await ethers.getContractAt(
          "ComptrollerFirstExtension",
          pool.comptroller,
          deployer
        )) as ComptrollerFirstExtension;

        const markets = await comptrollerAsExtension.callStatic.getAllMarkets();
        for (let j = 0; j < markets.length; j++) {
          const market = markets[j];
          console.log(`market ${market}`);
          const cTokenInstance = (await ethers.getContractAt(
            "CErc20PluginDelegate",
            market,
            deployer
          )) as CErc20PluginDelegate;

          let pluginAddress;
          try {
            pluginAddress = await cTokenInstance.callStatic.plugin();
          } catch (pluginError) {
            console.log(`most probably the market has no plugin`);
          }
          if (pluginAddress) {
            // SafeOwnableUpgradeable - _setPendingOwner() / _acceptOwner()
            const midasERC4626 = (await ethers.getContractAt("MidasERC4626", pluginAddress, deployer)) as MidasERC4626;

            try {
              const pendingOwner = await midasERC4626.callStatic.pendingOwner();
              if (pendingOwner == deployer.address) {
                tx = await midasERC4626._acceptOwner();
                await tx.wait();
                console.log(`midasERC4626._acceptOwner tx mined ${tx.hash}`);
              } else if (pendingOwner != ethers.constants.AddressZero) {
                console.error(`unknown plugin owner ${pendingOwner} for ${pluginAddress}`);
              }
            } catch (pluginError) {
              console.error(`check if ownable or safeownable - ${midasERC4626.address}`);
            }
          }
        }
      }
    }

    {
      // SafeOwnableUpgradeable - _setPendingOwner() / _acceptOwner()
      {
        const ffd = (await ethers.getContract("FuseFeeDistributor", deployer)) as SafeOwnableUpgradeable;
        const pendingOwner = await ffd.callStatic.pendingOwner();
        if (pendingOwner == newDeployer) {
          tx = await ffd._acceptOwner();
          await tx.wait();
          console.log(`ffd._acceptOwner tx mined ${tx.hash}`);
        }
      }

      {
        const fpd = (await ethers.getContract("FusePoolDirectory", deployer)) as SafeOwnableUpgradeable;
        const pendingOwner = await fpd.callStatic.pendingOwner();
        if (pendingOwner == newDeployer) {
          tx = await fpd._acceptOwner();
          await tx.wait();
          console.log(`fpd._acceptOwner tx mined ${tx.hash}`);
        }
      }

      const curveOracle = (await ethers.getContractOrNull(
        "CurveLpTokenPriceOracleNoRegistry",
        deployer
      )) as SafeOwnableUpgradeable;

      if (curveOracle) {
        const pendingOwner = await curveOracle.callStatic.pendingOwner();
        if (pendingOwner == newDeployer) {
          tx = await curveOracle._acceptOwner();
          await tx.wait();
          console.log(`curveOracle._acceptOwner tx mined ${tx.hash}`);
        }
      }
    }
  });

task("system:admins:split", "Split the contracts admin to different roles")
  .addParam("currentDeployer", "The address of the current deployer", undefined, types.string)
  .addParam("newDeployer", "The address of the new deployer", undefined, types.string)
  .setAction(async ({ currentDeployer }, { ethers, getNamedAccounts }) => {
    let tx: providers.TransactionResponse;

    const deployer = await ethers.getSigner(currentDeployer);

    // TODO probably hardcode these
    const { upgradesAdmin, liquidator, poolsSuperAdmin, testConfigAdmin, oraclesAdmin, extrasAdmin } =
      await getNamedAccounts();

    // OwnableUpgradeable - transferOwnership(newDeployer)
    const fsl = (await ethers.getContract("FuseSafeLiquidator", deployer)) as OwnableUpgradeable;
    const currentOwnerFSL = await fsl.callStatic.owner();
    console.log(`current FSL owner ${currentOwnerFSL}`);

    if (currentOwnerFSL == currentDeployer) {
      tx = await fsl.transferOwnership(liquidator);
      await tx.wait();
      console.log(`fsl.transferOwnership tx mined ${tx.hash}`);
    } else if (currentOwnerFSL != liquidator) {
      console.error(`unknown  owner ${currentOwnerFSL}`);
    }

    const saddleLpOracle = (await ethers.getContractOrNull("SaddleLpPriceOracle", deployer)) as SafeOwnableUpgradeable;
    if (saddleLpOracle) {
      const currentOwner = await saddleLpOracle.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await saddleLpOracle.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await saddleLpOracle._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`saddleLpOracle._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown  owner ${currentOwner}`);
      }
    }

    const adrastiaPriceOracle = (await ethers.getContractOrNull(
      "AdrastiaPriceOracle",
      deployer
    )) as SafeOwnableUpgradeable;
    if (adrastiaPriceOracle) {
      const currentOwner = await adrastiaPriceOracle.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await adrastiaPriceOracle.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await adrastiaPriceOracle._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`adrastiaPriceOracle._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown  owner ${currentOwner}`);
      }
    }

    const ankrCertificateTokenPriceOracle = (await ethers.getContractOrNull(
      "AnkrCertificateTokenPriceOracle",
      deployer
    )) as SafeOwnableUpgradeable;
    if (ankrCertificateTokenPriceOracle) {
      const currentOwner = await ankrCertificateTokenPriceOracle.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await ankrCertificateTokenPriceOracle.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await ankrCertificateTokenPriceOracle._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`ankrCertificateTokenPriceOracle._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown  owner ${currentOwner}`);
      }
    }

    const blpo = (await ethers.getContractOrNull("BalancerLpTokenPriceOracle", deployer)) as SafeOwnableUpgradeable;
    if (blpo) {
      const currentOwner = await blpo.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await blpo.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await blpo._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`blpo._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown  owner ${currentOwner}`);
      }
    }

    const curveOracle = (await ethers.getContractOrNull(
      "CurveLpTokenPriceOracleNoRegistry",
      oraclesAdmin
    )) as SafeOwnableUpgradeable;
    if (curveOracle) {
      const currentOwner = await curveOracle.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await curveOracle.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await curveOracle._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`curveOracle._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown  owner ${currentOwner}`);
      }
    }

    const curveV2Oracle = (await ethers.getContractOrNull(
      "CurveV2LpTokenPriceOracleNoRegistry",
      deployer
    )) as SafeOwnableUpgradeable;
    if (curveV2Oracle) {
      const currentOwner = await curveV2Oracle.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await curveV2Oracle.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await curveV2Oracle._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`curveV2Oracle._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown owner ${currentOwner}`);
      }
    }

    const diaPriceOracle = (await ethers.getContractOrNull("DiaPriceOracle", deployer)) as DiaPriceOracle;
    if (diaPriceOracle) {
      const currentAdmin = await diaPriceOracle.callStatic.admin();
      if (currentAdmin == oraclesAdmin) {
        tx = await diaPriceOracle.changeAdmin(oraclesAdmin);
        await tx.wait();
        console.log(`diaPriceOracle.changeAdmin tx mined ${tx.hash}`);
      } else if (currentAdmin != oraclesAdmin) {
        console.error(`unknown owner ${currentAdmin}`);
      }
    }

    const dspo = (await ethers.getContractOrNull("DiaStDotPriceOracle", deployer)) as SafeOwnableUpgradeable;
    if (dspo) {
      const currentOwner = await dspo.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await dspo.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await dspo._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`dspo._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown owner ${currentOwner}`);
      }
    }

    const flux = (await ethers.getContractOrNull("FluxPriceOracle", deployer)) as SafeOwnableUpgradeable;
    if (flux) {
      const currentOwner = await flux.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await flux.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await flux._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`flux._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown owner ${currentOwner}`);
      }
    }

    const nativeUsdPriceOracle = (await ethers.getContractOrNull(
      "NativeUSDPriceOracle",
      deployer
    )) as SafeOwnableUpgradeable;
    if (nativeUsdPriceOracle) {
      const currentOwner = await nativeUsdPriceOracle.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await nativeUsdPriceOracle.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await nativeUsdPriceOracle._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`nativeUsdPriceOracle._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown owner ${currentOwner}`);
      }
    }

    const stkBNBOracle = (await ethers.getContractOrNull("StkBNBPriceOracle", deployer)) as SafeOwnableUpgradeable;
    if (stkBNBOracle) {
      const currentOwner = await stkBNBOracle.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await stkBNBOracle.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await stkBNBOracle._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`stkBNBOracle._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown owner ${currentOwner}`);
      }
    }

    const twapPriceOracleResolver = (await ethers.getContractOrNull(
      "UniswapTwapPriceOracleV2Resolver",
      deployer
    )) as Ownable;
    if (twapPriceOracleResolver) {
      const currentOwner = await twapPriceOracleResolver.callStatic.owner();
      if (currentOwner == currentDeployer) {
        tx = await twapPriceOracleResolver.transferOwnership(oraclesAdmin);
        await tx.wait();
        console.log(`twapPriceOracleResolver._setPendingOwner tx mined ${tx.hash}`);
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown owner ${currentOwner}`);
      }
    }

    const midasSafeLiquidator = (await ethers.getContractOrNull(
      "MidasSafeLiquidator",
      deployer
    )) as SafeOwnableUpgradeable;
    if (midasSafeLiquidator) {
      const currentOwner = await midasSafeLiquidator.callStatic.owner();
      if (currentOwner == currentDeployer) {
        const currentPendingOwner = await midasSafeLiquidator.callStatic.pendingOwner();
        console.log(`current pending owner ${currentPendingOwner}`);
        if (currentPendingOwner != oraclesAdmin) {
          tx = await midasSafeLiquidator._setPendingOwner(oraclesAdmin);
          await tx.wait();
          console.log(`midasSafeLiquidator._setPendingOwner tx mined ${tx.hash}`);
        }
      } else if (currentOwner != oraclesAdmin) {
        console.error(`unknown owner ${currentOwner}`);
      }
    }
  });
