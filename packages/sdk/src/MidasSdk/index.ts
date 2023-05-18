import {
  ChainAddresses,
  ChainConfig,
  ChainDeployment,
  ChainParams,
  DeployedPlugins,
  FundingStrategyContract,
  InterestRateModel,
  RedemptionStrategyContract,
  SupportedAsset,
  SupportedChains,
} from "@midas-capital/types";
import { encodeAbiParameters, getAddress, keccak256, parseAbiParameters } from "viem";
import type { Account, PublicClient, TransactionReceipt, WalletClient } from "viem";

import ComptrollerABI from "../../abis/Comptroller";
import CTokenInterfaceABI from "../../abis/CTokenInterface";
import FusePoolDirectoryABI from "../../abis/FusePoolDirectory";
import UnitrollerABI from "../../abis/Unitroller";
import { withAsset } from "../modules/Asset";
import { withConvertMantissa } from "../modules/ConvertMantissa";
import { withFlywheel } from "../modules/Flywheel";
import { withFundOperations } from "../modules/FundOperations";
import { withFusePoolLens } from "../modules/FusePoolLens";
import { withFusePools } from "../modules/FusePools";
import { ChainLiquidationConfig } from "../modules/liquidation/config";
import { withSafeLiquidator } from "../modules/liquidation/SafeLiquidator";
import { withVaults } from "../modules/Vaults";

import { CTOKEN_ERROR_CODES } from "./config";
import AdjustableAnkrBNBIrm from "./irm/AdjustableAnkrBNBIrm";
import AdjustableJumpRateModel from "./irm/AdjustableJumpRateModel";
import AnkrBNBInterestRateModel from "./irm/AnkrBNBInterestRateModel";
import AnkrFTMInterestRateModel from "./irm/AnkrFTMInterestRateModel";
import JumpRateModel from "./irm/JumpRateModel";
import WhitePaperInterestRateModel from "./irm/WhitePaperInterestRateModel";
import { getPoolAddress } from "./utils";

export type WalletOrPublicClient = WalletClient | PublicClient;

export interface Logger {
  trace(message?: string, ...optionalParams: any[]): void;
  debug(message?: string, ...optionalParams: any[]): void;
  info(message?: string, ...optionalParams: any[]): void;
  warn(message?: string, ...optionalParams: any[]): void;
  error(message?: string, ...optionalParams: any[]): void;
  [x: string]: any;
}

export class MidasBase {
  static CTOKEN_ERROR_CODES = CTOKEN_ERROR_CODES;
  public _publicClient: PublicClient;
  public _walletClient: WalletClient | null;
  public _account: Account | null;

  public chainConfig: ChainConfig;
  public availableOracles: Array<string>;
  public chainId: SupportedChains;
  public chainDeployment: ChainDeployment;
  public chainSpecificAddresses: ChainAddresses;
  public chainSpecificParams: ChainParams;
  public deployedPlugins: DeployedPlugins;
  public marketToPlugin: Record<string, string>;
  public liquidationConfig: ChainLiquidationConfig;
  public supportedAssets: SupportedAsset[];
  public redemptionStrategies: { [token: string]: [RedemptionStrategyContract, string] };
  public fundingStrategies: { [token: string]: [FundingStrategyContract, string] };

  public logger: Logger;

  public get publicClient(): PublicClient {
    return this._publicClient;
  }

  public get walletClient(): WalletClient {
    if (!this._walletClient) {
      throw new Error("No Wallet Client available.");
    }

    return this._walletClient;
  }

  public get account(): Account {
    if (!this._account) {
      throw new Error("No Wallet Account available.");
    }

    return this._account;
  }

  setWalletClient(publicClient: PublicClient, walletClient: WalletClient) {
    this._publicClient = publicClient;
    this._walletClient = walletClient;

    if (walletClient.account) {
      this._account = walletClient.account;
    }

    return this;
  }

  removeWalletClient(publicClient: PublicClient) {
    this._publicClient = publicClient;
    this._walletClient = null;
  }

  constructor(
    publicClient: PublicClient,
    walletClient: WalletClient | null,
    chainConfig: ChainConfig,
    logger: Logger = console
  ) {
    this.logger = logger;
    if (!publicClient) throw Error("No Public Client.");

    this._publicClient = publicClient;

    if (walletClient) {
      this._walletClient = walletClient;

      if (walletClient.account) {
        this._account = walletClient.account;
      } else {
        this._account = null;
      }
    } else {
      this._walletClient = null;
      this._account = null;
    }

    this.chainConfig = chainConfig;
    this.chainId = chainConfig.chainId;
    this.chainDeployment = chainConfig.chainDeployments;
    this.chainSpecificAddresses = chainConfig.chainAddresses;
    this.chainSpecificParams = chainConfig.specificParams;
    this.liquidationConfig = chainConfig.liquidationDefaults;
    this.supportedAssets = chainConfig.assets;
    this.deployedPlugins = chainConfig.deployedPlugins;
    this.marketToPlugin = Object.entries(this.deployedPlugins).reduce((acc, [plugin, pluginData]) => {
      return { ...acc, [pluginData.market]: plugin };
    }, {});
    this.redemptionStrategies = chainConfig.redemptionStrategies;
    this.fundingStrategies = chainConfig.fundingStrategies;
    this.availableOracles = chainConfig.oracles.filter((o) => {
      if (this.chainDeployment[o] === undefined) {
        this.logger.warn(`Oracle ${o} not deployed to chain ${this.chainId}`);
        return false;
      }
      return true;
    });
  }

  async deployPool(
    poolName: string,
    enforceWhitelist: boolean,
    closeFactor: bigint,
    liquidationIncentive: bigint,
    priceOracle: string, // Contract address
    whitelist: string[] // An array of whitelisted addresses
  ): Promise<[string, string, string, number?]> {
    try {
      // Deploy Comptroller implementation if necessary
      const implementationAddress = this.chainDeployment.Comptroller.address;

      if (this.walletClient) {
        // Register new pool with FusePoolDirectory
        const [account] = await this.walletClient.getAddresses();

        const hash = await this.walletClient.writeContract({
          address: getAddress(this.chainDeployment.FusePoolDirectory.address),
          abi: FusePoolDirectoryABI,
          functionName: "deployPool",
          args: [
            poolName,
            getAddress(implementationAddress),
            encodeAbiParameters(parseAbiParameters("address"), [
              getAddress(this.chainDeployment.FuseFeeDistributor.address),
            ]),
            enforceWhitelist,
            closeFactor,
            liquidationIncentive,
            getAddress(priceOracle),
          ],
          account,
          chain: this.walletClient.chain,
        });

        const receipt: TransactionReceipt = await this.publicClient.waitForTransactionReceipt({ hash });

        this.logger.info(`Deployment of pool ${poolName} succeeded!`, receipt.status);

        let poolId: number | undefined;
        try {
          // Latest Event is PoolRegistered which includes the poolId
          console.log(receipt.logs);
          const registerEvent = receipt.logs?.pop();
          console.log({ registerEvent });
          poolId =
            registerEvent && registerEvent.args && registerEvent.args[0] ? registerEvent.args[0].toNumber() : undefined;
        } catch (e) {
          this.logger.warn("Unable to retrieve pool ID from receipt events", e);
        }

        const [, existingPools] = await this.publicClient.readContract({
          address: getAddress(this.chainDeployment.FusePoolDirectory.address),
          abi: FusePoolDirectoryABI,
          functionName: "getActivePools",
        });

        // Compute Unitroller address
        const poolAddress = getPoolAddress(
          account,
          poolName,
          existingPools.length,
          this.chainDeployment.FuseFeeDistributor.address,
          this.chainDeployment.FusePoolDirectory.address
        );

        // Accept admin status via Unitroller
        const acceptTx = await this.walletClient.writeContract({
          address: getAddress(poolAddress),
          abi: UnitrollerABI,
          functionName: "_acceptAdmin",
          account,
          chain: this.walletClient.chain,
        });

        const acceptReceipt = await this.publicClient.waitForTransactionReceipt({ hash: acceptTx });
        this.logger.info(`Accepted admin status for admin: ${acceptReceipt.status}`);

        // Whitelist
        this.logger.info(`enforceWhitelist: ${enforceWhitelist}`);
        if (enforceWhitelist) {
          const whitelistTx = await this.walletClient.writeContract({
            address: getAddress(poolAddress),
            abi: ComptrollerABI,
            functionName: "_setWhitelistStatuses",
            args: [whitelist.map((addr) => getAddress(addr)), Array(whitelist.length).fill(true)],
            account,
            chain: this.walletClient.chain,
          });

          // Was enforced by pool deployment, now just add addresses
          const whitelistReceipt = await this.publicClient.waitForTransactionReceipt({ hash: whitelistTx });
          this.logger.info(`Whitelist updated: ${whitelistReceipt.status}`);
        }

        return [poolAddress, implementationAddress, priceOracle, poolId];
      } else {
        throw Error("Wallet Client not found");
      }
    } catch (error) {
      throw Error(`Deployment of new Fuse pool failed:  ${error instanceof Error ? error.message : error}`);
    }
  }

  async identifyInterestRateModel(interestRateModelAddress: string): Promise<InterestRateModel> {
    // Get interest rate model type from runtime bytecode hash and init class
    const interestRateModels: { [key: string]: any } = {
      JumpRateModel: JumpRateModel,
      WhitePaperInterestRateModel: WhitePaperInterestRateModel,
      AnkrBNBInterestRateModel: AnkrBNBInterestRateModel,
      AnkrFTMInterestRateModel: AnkrFTMInterestRateModel,
      AdjustableJumpRateModel: AdjustableJumpRateModel,
      AdjustableAnkrBNBIrm: AdjustableAnkrBNBIrm,
    };
    const bytecode = await this.publicClient.getBytecode({ address: getAddress(interestRateModelAddress) });

    if (!bytecode) {
      throw Error("Bytecode not found");
    }

    const runtimeBytecodeHash = keccak256(bytecode);

    let irmModel = null;

    for (const irm of Object.values(interestRateModels)) {
      if (runtimeBytecodeHash === irm.RUNTIME_BYTECODE_HASH) {
        irmModel = new irm();
        break;
      }
    }
    if (irmModel === null) {
      throw Error("InterestRateModel not found");
    }
    return irmModel;
  }

  async getInterestRateModel(assetAddress: string): Promise<InterestRateModel> {
    // Get interest rate model address from asset address
    const interestRateModelAddress: string = await this.publicClient.readContract({
      address: getAddress(assetAddress),
      abi: CTokenInterfaceABI,
      functionName: "interestRateModel",
    });

    const interestRateModel = await this.identifyInterestRateModel(interestRateModelAddress);
    if (!interestRateModel) {
      throw Error(`No Interest Rate Model found for asset: ${assetAddress}`);
    }
    await interestRateModel.init(interestRateModelAddress, assetAddress, this.publicClient);
    return interestRateModel;
  }

  getPriceOracle(oracleAddress: string): string {
    let oracle = this.availableOracles.find((o) => this.chainDeployment[o].address === oracleAddress);

    if (!oracle) {
      oracle = "Unrecognized Oracle";
    }

    return oracle;
  }
}

const MidasBaseWithModules = withFusePoolLens(
  withFundOperations(
    withSafeLiquidator(withFusePools(withAsset(withFlywheel(withVaults(withConvertMantissa(MidasBase))))))
  )
);
export class MidasSdk extends MidasBaseWithModules {}
export default MidasSdk;
