import { FlywheelRewardsInfoForVault, FundOperationMode, SupportedChains, VaultData } from "@midas-capital/types";
import { formatUnits, getAddress } from "viem";

import { MidasBaseConstructor } from "..";
import EIP20InterfaceABI from "../../abis/EIP20Interface";
import MasterPriceOracleABI from "../../abis/MasterPriceOracle";
import OptimizedAPRVaultFirstExtensionABI from "../../abis/OptimizedAPRVaultFirstExtension";
import OptimizedAPRVaultSecondExtensionABI from "../../abis/OptimizedAPRVaultSecondExtension";
import OptimizedVaultsRegistryABI from "../../abis/OptimizedVaultsRegistry";
import { MaxUint256 } from "../MidasSdk/constants";

import { ChainSupportedAssets } from "./FusePools";

export function withVaults<TBase extends MidasBaseConstructor>(Base: TBase) {
  return class Vaults extends Base {
    async getAllVaults(): Promise<VaultData[]> {
      if (this.chainId === SupportedChains.chapel) {
        try {
          const vaultsData = await this.publicClient.readContract({
            address: getAddress(this.chainDeployment.OptimizedVaultsRegistry.address),
            abi: OptimizedVaultsRegistryABI,
            functionName: "getVaultsData",
          });

          return await Promise.all(
            vaultsData.map(async (data) => {
              let symbol = data.assetSymbol;
              let extraDocs: string | undefined;

              const asset = ChainSupportedAssets[this.chainId as SupportedChains].find(
                (ass) => ass.underlying === data.asset
              );

              if (asset) {
                symbol = asset.symbol;
                extraDocs = asset.extraDocs;
              }

              const underlyingPrice = await this.publicClient.readContract({
                address: getAddress(this.chainDeployment.MasterPriceOracle.address),
                abi: MasterPriceOracleABI,
                functionName: "price",
                args: [data.asset],
              });

              const totalSupplyNative =
                Number(formatUnits(data.estimatedTotalAssets, data.assetDecimals)) *
                Number(formatUnits(underlyingPrice, 18));

              const adapters = data.adaptersData.map((data) => {
                return {
                  adapter: data.adapter.toString(),
                  allocation: data.allocation,
                  market: data.market.toString(),
                  pool: data.pool.toString(),
                };
              });

              return {
                vault: data.vault,
                chainId: this.chainId,
                totalSupply: data.estimatedTotalAssets,
                totalSupplyNative,
                asset: data.asset,
                symbol,
                supplyApy: data.apr,
                adaptersCount: Number(data.adaptersCount),
                isEmergencyStopped: data.isEmergencyStopped,
                adapters,
                decimals: data.assetDecimals,
                underlyingPrice,
                extraDocs,
                performanceFee: data.performanceFee,
                depositFee: data.depositFee,
                withdrawalFee: data.withdrawalFee,
                managementFee: data.managementFee,
              };
            })
          );
        } catch (error) {
          this.logger.error(`get vaults error in chain ${this.chainId}:  ${error}`);

          throw Error(
            `Getting vaults failed in chain ${this.chainId}: ` + (error instanceof Error ? error.message : error)
          );
        }
      } else {
        return [];
      }
    }

    async getClaimableRewardsForVaults(account: string): Promise<FlywheelRewardsInfoForVault[]> {
      if (this.chainId === SupportedChains.chapel) {
        try {
          const rewardsInfoForVaults: FlywheelRewardsInfoForVault[] = [];

          const { result } = await this.publicClient.simulateContract({
            address: getAddress(this.chainDeployment.OptimizedVaultsRegistry.address),
            abi: OptimizedVaultsRegistryABI,
            functionName: "getClaimableRewards",
            args: [getAddress(account)],
          });

          result.map((reward) => {
            if (reward.rewards > 0n) {
              const vault = reward.vault;
              const chainId = Number(this.chainId);

              // trying to get reward token symbol from defined assets list in sdk
              const asset = ChainSupportedAssets[this.chainId as SupportedChains].find(
                (ass) => ass.underlying === reward.rewardToken
              );
              const rewardTokenSymbol = asset ? asset.symbol : reward.rewardTokenSymbol;

              const rewardsInfo = {
                rewardToken: reward.rewardToken,
                flywheel: reward.flywheel,
                rewards: reward.rewards,
                rewardTokenDecimals: reward.rewardTokenDecimals,
                rewardTokenSymbol,
              };

              const rewardsAdded = rewardsInfoForVaults.find((info) => info.vault === vault);
              if (rewardsAdded) {
                rewardsAdded.rewardsInfo.push(rewardsInfo);
              } else {
                rewardsInfoForVaults.push({ vault, chainId, rewardsInfo: [rewardsInfo] });
              }
            }
          });

          return rewardsInfoForVaults;
        } catch (error) {
          this.logger.error(
            `get claimable rewards of vaults error for account ${account} in chain ${this.chainId}:  ${error}`
          );

          throw Error(
            `get claimable rewards of vaults error for account ${account} in chain ${this.chainId}: ` +
              (error instanceof Error ? error.message : error)
          );
        }
      } else {
        return [];
      }
    }

    async vaultApprove(vault: string, asset: string) {
      this.walletClient.writeContract({
        address: getAddress(asset),
        abi: EIP20InterfaceABI,
        functionName: "approve",
        args: [getAddress(vault), MaxUint256],
        account: this.account,
        chain: this.walletClient.chain,
      });
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(asset),
        abi: EIP20InterfaceABI,
        functionName: "approve",
        args: [getAddress(vault), MaxUint256],
      });
      const tx = await this.walletClient.writeContract(request);

      return tx;
    }

    async vaultDeposit(vault: string, amount: bigint) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(vault),
        abi: OptimizedAPRVaultSecondExtensionABI,
        functionName: "deposit",
        args: [amount],
      });

      const tx = await this.walletClient.writeContract(request);

      return { tx };
    }

    async vaultWithdraw(vault: string, amount: bigint) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(vault),
        abi: OptimizedAPRVaultSecondExtensionABI,
        functionName: "withdraw",
        args: [amount],
      });

      const tx = await this.walletClient.writeContract(request);

      return { tx };
    }

    async getUpdatedVault(mode: FundOperationMode, vault: VaultData, amount: bigint) {
      let updatedVault: VaultData = vault;

      if (mode === FundOperationMode.SUPPLY) {
        const totalSupply = vault.totalSupply + amount;
        const totalSupplyNative =
          Number(formatUnits(totalSupply, vault.decimals)) * Number(formatUnits(vault.underlyingPrice, 18));
        const supplyApy = await this.publicClient.readContract({
          address: getAddress(vault.vault),
          abi: OptimizedAPRVaultSecondExtensionABI,
          functionName: "supplyAPY",
          args: [amount],
        });

        updatedVault = {
          ...vault,
          totalSupply,
          totalSupplyNative,
          supplyApy,
        };
      } else if (mode === FundOperationMode.WITHDRAW) {
        const totalSupply = vault.totalSupply - amount;
        const totalSupplyNative =
          Number(formatUnits(totalSupply, vault.decimals)) * Number(formatUnits(vault.underlyingPrice, 18));
        const supplyApy = await this.publicClient.readContract({
          address: getAddress(vault.vault),
          abi: OptimizedAPRVaultSecondExtensionABI,
          functionName: "supplyAPY",
          args: [amount],
        });

        updatedVault = {
          ...vault,
          totalSupply,
          totalSupplyNative,
          supplyApy,
        };
      }

      return updatedVault;
    }

    async getMaxWithdrawVault(vault: string) {
      return await this.publicClient.readContract({
        address: getAddress(vault),
        abi: OptimizedAPRVaultSecondExtensionABI,
        functionName: "maxWithdraw",
        args: [this.account.address],
      });
    }

    async getMaxDepositVault(vault: string) {
      return await this.publicClient.readContract({
        address: getAddress(vault),
        abi: OptimizedAPRVaultSecondExtensionABI,
        functionName: "maxDeposit",
        args: [this.account.address],
      });
    }

    async claimRewardsForVault(vault: string) {
      const { request } = await this.publicClient.simulateContract({
        address: getAddress(vault),
        abi: OptimizedAPRVaultFirstExtensionABI,
        functionName: "claimRewards",
      });

      const tx = await this.walletClient.writeContract(request);

      return { tx };
    }
  };
}
