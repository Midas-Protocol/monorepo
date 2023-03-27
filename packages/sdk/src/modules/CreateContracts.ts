import { Contract, ContractInterface } from "ethers";

import { MidasBaseConstructor } from "..";
import CErc20DelegateABI from "../../abis/CErc20Delegate";
import CErc20PluginRewardsDelegateABI from "../../abis/CErc20PluginRewardsDelegate";
import CompoundMarketERC4626ABI from "../../abis/CompoundMarketERC4626";
import ComptrollerABI from "../../abis/Comptroller";
import ComptrollerFirstExtensionABI from "../../abis/ComptrollerFirstExtension";
import CTokenFirstExtensionABI from "../../abis/CTokenFirstExtension";
import FlywheelStaticRewardsABI from "../../abis/FlywheelStaticRewards";
import JumpRateModelABI from "../../abis/JumpRateModel";
import MasterPriceOracleABI from "../../abis/MasterPriceOracle";
import MidasFlywheelABI from "../../abis/MidasFlywheel";
import OptimizedAPRVaultABI from "../../abis/OptimizedAPRVault";
import UnitrollerABI from "../../abis/Unitroller";
import { CErc20Delegate } from "../../typechain/CErc20Delegate";
import { CErc20PluginRewardsDelegate } from "../../typechain/CErc20PluginRewardsDelegate";
import { CompoundMarketERC4626 } from "../../typechain/CompoundMarketERC4626";
import { Comptroller } from "../../typechain/Comptroller";
import { ComptrollerFirstExtension } from "../../typechain/ComptrollerFirstExtension";
import { CTokenFirstExtension } from "../../typechain/CTokenFirstExtension";
import { FlywheelStaticRewards } from "../../typechain/FlywheelStaticRewards";
import { JumpRateModel } from "../../typechain/JumpRateModel";
import { MasterPriceOracle } from "../../typechain/MasterPriceOracle";
import { MidasFlywheel } from "../../typechain/MidasFlywheel";
import { OptimizedAPRVault } from "../../typechain/OptimizedAPRVault";
import { Unitroller } from "../../typechain/Unitroller";
import { SignerOrProvider } from "../MidasSdk";

type ComptrollerWithExtensions = Comptroller & ComptrollerFirstExtension;
type CTokenWithExtensions = CErc20Delegate & CTokenFirstExtension;

export function withCreateContracts<TBase extends MidasBaseConstructor>(Base: TBase) {
  return class CreateContracts extends Base {
    createContractInstance<T extends Contract>(abi: ContractInterface) {
      return (address: string, signerOrProvider: SignerOrProvider = this.signer) =>
        new Contract(address, abi, signerOrProvider) as T;
    }

    createUnitroller = this.createContractInstance<Unitroller>(UnitrollerABI);
    createMidasFlywheel = this.createContractInstance<MidasFlywheel>(MidasFlywheelABI);
    createFlywheelStaticRewards = this.createContractInstance<FlywheelStaticRewards>(FlywheelStaticRewardsABI);
    createJumpRateModel = this.createContractInstance<JumpRateModel>(JumpRateModelABI);

    createComptroller(comptrollerAddress: string, signerOrProvider: SignerOrProvider = this.provider) {
      if (this.chainDeployment.ComptrollerFirstExtension) {
        return new Contract(
          comptrollerAddress,
          [...ComptrollerABI, ...ComptrollerFirstExtensionABI],
          signerOrProvider
        ) as ComptrollerWithExtensions;
      }

      return new Contract(comptrollerAddress, ComptrollerABI, signerOrProvider) as ComptrollerWithExtensions;
    }

    createCTokenWithExtensions(address: string, signerOrProvider: SignerOrProvider = this.provider) {
      if (this.chainDeployment.CTokenFirstExtension) {
        return new Contract(
          address,
          [...CErc20DelegateABI, ...CTokenFirstExtensionABI],
          signerOrProvider
        ) as CTokenWithExtensions;
      }

      return new Contract(address, CErc20DelegateABI, signerOrProvider) as CTokenWithExtensions;
    }

    createCErc20PluginRewardsDelegate(cTokenAddress: string, signerOrProvider: SignerOrProvider = this.provider) {
      return new Contract(
        cTokenAddress,
        CErc20PluginRewardsDelegateABI,
        signerOrProvider
      ) as CErc20PluginRewardsDelegate;
    }

    createMasterPriceOracle(signerOrProvider: SignerOrProvider = this.provider) {
      return new Contract(
        this.chainDeployment.MasterPriceOracle.address,
        MasterPriceOracleABI,
        signerOrProvider
      ) as MasterPriceOracle;
    }

    createOptimizedAPRVault(vaultAddress: string, signerOrProvider: SignerOrProvider = this.provider) {
      return new Contract(vaultAddress, OptimizedAPRVaultABI, signerOrProvider) as OptimizedAPRVault;
    }

    createCompoundMarketERC4626(adapterAddress: string, signerOrProvider: SignerOrProvider = this.provider) {
      return new Contract(adapterAddress, CompoundMarketERC4626ABI, signerOrProvider) as CompoundMarketERC4626;
    }
  };
}

export type CreateContractsModule = ReturnType<typeof withCreateContracts<MidasBaseConstructor>>;
