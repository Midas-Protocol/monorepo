import { getAddress, getContract, GetContractReturnType } from "viem";

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
import MidasFlywheelLensRouterABI from "../../abis/MidasFlywheelLensRouter";
import OptimizedAPRVaultFirstExtensionABI from "../../abis/OptimizedAPRVaultFirstExtension";
import OptimizedAPRVaultSecondExtensionABI from "../../abis/OptimizedAPRVaultSecondExtension";
import OptimizedVaultsRegistryABI from "../../abis/OptimizedVaultsRegistry";
import UnitrollerABI from "../../abis/Unitroller";

export function withCreateContracts<TBase extends MidasBaseConstructor>(Base: TBase) {
  return class CreateContracts extends Base {
    // createContractInstance(abi: GetContractParameters["abi"]) {
    //   return (address: string) =>
    //     getContract({
    //       address: getAddress(address),
    //       abi,
    //       publicClient: this.publicClient,
    //       walletClient: this.walletClient ? this.walletClient : undefined,
    //     });
    // }

    // createUnitroller1 = this.createContractInstance(UnitrollerABI);
    // createMidasFlywheel = this.createContractInstance(MidasFlywheelABI);
    // createFlywheelStaticRewards = this.createContractInstance(FlywheelStaticRewardsABI);
    // createJumpRateModel = this.createContractInstance(JumpRateModelABI);
    createUnitroller(address: string) {
      return getContract({
        address: getAddress(address),
        abi: UnitrollerABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createMidasFlywheel(address: string) {
      return getContract({
        address: getAddress(address),
        abi: MidasFlywheelABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createFlywheelStaticRewards(address: string) {
      return getContract({
        address: getAddress(address),
        abi: FlywheelStaticRewardsABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createJumpRateModel(address: string) {
      return getContract({
        address: getAddress(address),
        abi: JumpRateModelABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createComptroller(comptrollerAddress: string) {
      return getContract({
        address: getAddress(comptrollerAddress),
        abi: ComptrollerABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createComptrollerFirstExtension(comptrollerAddress: string) {
      return getContract({
        address: getAddress(comptrollerAddress),
        abi: ComptrollerFirstExtensionABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createCErc20Delegate(address: string) {
      return getContract({
        address: getAddress(address),
        abi: CErc20DelegateABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createCTokenWithExtensions(address: string) {
      return getContract({
        address: getAddress(address),
        abi: CTokenFirstExtensionABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createCErc20PluginRewardsDelegate(cTokenAddress: string) {
      return getContract({
        address: getAddress(cTokenAddress),
        abi: CErc20PluginRewardsDelegateABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createMasterPriceOracle() {
      return getContract({
        address: getAddress(this.chainDeployment.MasterPriceOracle.address),
        abi: MasterPriceOracleABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createCompoundMarketERC4626(address: string) {
      return getContract({
        address: getAddress(address),
        abi: CompoundMarketERC4626ABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createOptimizedAPRVaultFirstExtension(address: string) {
      return getContract({
        address: getAddress(address),
        abi: OptimizedAPRVaultFirstExtensionABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createOptimizedAPRVaultSecondExtension(address: string) {
      return getContract({
        address: getAddress(address),
        abi: OptimizedAPRVaultSecondExtensionABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createOptimizedVaultsRegistry() {
      return getContract({
        address: getAddress(this.chainDeployment.OptimizedVaultsRegistry.address),
        abi: OptimizedVaultsRegistryABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }

    createMidasFlywheelLensRouter() {
      return getContract({
        address: getAddress(this.chainDeployment.MidasFlywheelLensRouter.address),
        abi: MidasFlywheelLensRouterABI,
        publicClient: this.publicClient,
        walletClient: this.walletClient ? this.walletClient : undefined,
      });
    }
  };
}

export type CreateContractsModule = ReturnType<typeof withCreateContracts<MidasBaseConstructor>>;
