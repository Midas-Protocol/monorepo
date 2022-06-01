import { JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { BigNumber, constants, Contract, ContractFactory, utils } from "ethers";

import Deployments from "../../deployments.json";
import { AddressesProvider } from "../../lib/contracts/typechain/AddressesProvider";
import { Comptroller } from "../../lib/contracts/typechain/Comptroller";
import { FuseFeeDistributor } from "../../lib/contracts/typechain/FuseFeeDistributor";
import { FuseFlywheelLensRouter } from "../../lib/contracts/typechain/FuseFlywheelLensRouter.sol";
import { FusePoolDirectory } from "../../lib/contracts/typechain/FusePoolDirectory";
import { FusePoolLens } from "../../lib/contracts/typechain/FusePoolLens";
import { FusePoolLensSecondary } from "../../lib/contracts/typechain/FusePoolLensSecondary";
import { FuseSafeLiquidator } from "../../lib/contracts/typechain/FuseSafeLiquidator";
import { bytecode } from "../bytecode";
import {
  chainLiquidationDefaults,
  chainOracles,
  chainPluginConfig,
  chainRedemptionStrategies,
  chainSpecificAddresses,
  chainSupportedAssets,
  irmConfig,
  oracleConfig,
} from "../chainConfig";
import { RedemptionStrategy, SupportedChains } from "../enums";
import { withAsset } from "../modules/Asset";
import { withCreateContracts } from "../modules/CreateContracts";
import { withFlywheel } from "../modules/Flywheel";
import { withFundOperations } from "../modules/FundOperations";
import { withFusePoolLens } from "../modules/FusePoolLens";
import { withFusePools } from "../modules/FusePools";
import { ChainLiquidationConfig } from "../modules/liquidation/config";
import { withSafeLiquidator } from "../modules/liquidation/SafeLiquidator";
import { withRewardsDistributor } from "../modules/RewardsDistributor";
import {
  Artifact,
  AssetPluginConfig,
  ChainAddresses,
  ChainDeployment,
  InterestRateModel,
  InterestRateModelConf,
  InterestRateModelParams,
  SupportedAsset,
} from "../types";

import uniswapV3PoolAbiSlim from "./abi/UniswapV3Pool.slim.json";
import { CTOKEN_ERROR_CODES, JUMP_RATE_MODEL_CONF, WHITE_PAPER_RATE_MODEL_CONF } from "./config";
import DAIInterestRateModelV2 from "./irm/DAIInterestRateModelV2";
import JumpRateModel from "./irm/JumpRateModel";
import WhitePaperInterestRateModel from "./irm/WhitePaperInterestRateModel";

type OracleConfig = {
  [contractName: string]: {
    address: string;
  };
};

type IrmConfig = OracleConfig;

export class FuseBase {
  static CTOKEN_ERROR_CODES = CTOKEN_ERROR_CODES;
  public provider: JsonRpcProvider | Web3Provider;

  public contracts: {
    FuseFeeDistributor: FuseFeeDistributor;
    FusePoolDirectory: FusePoolDirectory;
    FusePoolLens: FusePoolLens;
    FusePoolLensSecondary: FusePoolLensSecondary;
    FuseSafeLiquidator: FuseSafeLiquidator;
    AddressesProvider: AddressesProvider;
    [contractName: string]: Contract;
  };
  public JumpRateModelConf: InterestRateModelConf;
  public WhitePaperRateModelConf: InterestRateModelConf;

  public availableOracles: Array<string>;
  public chainId: SupportedChains;
  public chainDeployment: ChainDeployment;
  public oracles: OracleConfig;
  public chainSpecificAddresses: ChainAddresses;
  public irms: IrmConfig;
  public chainPlugins: AssetPluginConfig;
  public liquidationConfig: ChainLiquidationConfig;
  public supportedAssets: SupportedAsset[];
  public redemptionStrategies: { [token: string]: RedemptionStrategy };

  constructor(
    web3Provider: JsonRpcProvider | Web3Provider,
    chainId: SupportedChains,
    chainDeployment?: ChainDeployment
  ) {
    this.provider = web3Provider;
    this.chainId = chainId;
    this.chainDeployment =
      chainDeployment ??
      (Deployments[chainId.toString()] &&
        Deployments[chainId.toString()][Object.keys(Deployments[chainId.toString()])[0]]?.contracts);
    if (!this.chainDeployment) {
      throw new Error(`Chain deployment not found or provided for chainId ${chainId}`);
    }
    this.WhitePaperRateModelConf = WHITE_PAPER_RATE_MODEL_CONF(chainId);
    this.JumpRateModelConf = JUMP_RATE_MODEL_CONF(chainId);

    this.contracts = {
      FusePoolDirectory: new Contract(
        this.chainDeployment.FusePoolDirectory.address,
        this.chainDeployment.FusePoolDirectory.abi,
        this.provider
      ) as FusePoolDirectory,
      FusePoolLens: new Contract(
        this.chainDeployment.FusePoolLens.address,
        this.chainDeployment.FusePoolLens.abi,
        this.provider
      ) as FusePoolLens,
      FusePoolLensSecondary: new Contract(
        this.chainDeployment.FusePoolLensSecondary.address,
        this.chainDeployment.FusePoolLensSecondary.abi,
        this.provider
      ) as FusePoolLensSecondary,
      FuseSafeLiquidator: new Contract(
        this.chainDeployment.FuseSafeLiquidator.address,
        this.chainDeployment.FuseSafeLiquidator.abi,
        this.provider
      ) as FuseSafeLiquidator,
      FuseFeeDistributor: new Contract(
        this.chainDeployment.FuseFeeDistributor.address,
        this.chainDeployment.FuseFeeDistributor.abi,
        this.provider
      ) as FuseFeeDistributor,
      AddressesProvider: new Contract(
        this.chainDeployment.AddressesProvider.address,
        this.chainDeployment.AddressesProvider.abi,
        this.provider
      ) as AddressesProvider,
    };
    if (this.chainDeployment.FuseFlywheelLensRouter) {
      this.contracts["FuseFlywheelLensRouter"] = new Contract(
        this.chainDeployment.FuseFlywheelLensRouter?.address || constants.AddressZero,
        this.chainDeployment.FuseFlywheelLensRouter.abi,
        this.provider
      ) as FuseFlywheelLensRouter;
    } else {
      console.warn(`FuseFlywheelLensRouter not deployed to chain ${this.chainId}`);
    }

    this.irms = irmConfig(this.chainDeployment);
    this.availableOracles = chainOracles[chainId].filter((o) => {
      if (this.chainDeployment[o] === undefined) {
        console.warn(`Oracle ${o} not deployed to chain ${this.chainId}`);
        return false;
      }
      return true;
    });
    this.oracles = oracleConfig(this.chainDeployment, this.availableOracles);

    this.chainSpecificAddresses = chainSpecificAddresses[chainId];
    this.liquidationConfig = chainLiquidationDefaults[chainId];
    this.supportedAssets = chainSupportedAssets[chainId];
    this.chainPlugins = chainPluginConfig[chainId];
    this.redemptionStrategies = chainRedemptionStrategies[chainId];
  }

  async deployPool(
    poolName: string,
    enforceWhitelist: boolean,
    closeFactor: BigNumber,
    liquidationIncentive: BigNumber,
    priceOracle: string, // Contract address
    options: { from: string }, // We might need to add sender as argument. Getting address from options will collide with the override arguments in ethers contract method calls. It doesn't take address.
    whitelist: string[] // An array of whitelisted addresses
  ): Promise<[string, string, string, number?]> {
    try {
      // Deploy Comptroller implementation if necessary
      const implementationAddress = this.chainDeployment.Comptroller.address;

      // no need to deploy a comptroller here, if it's not deployed then we can error
      if (!implementationAddress) {
        throw new Error("Comptroller implementation not deployed to chain");
      }

      // Register new pool with FusePoolDirectory
      const contract = this.contracts.FusePoolDirectory.connect(this.provider.getSigner(options.from));
      const deployTx = await contract.deployPool(
        poolName,
        implementationAddress,
        new utils.AbiCoder().encode(["address"], [this.chainDeployment.FuseFeeDistributor.address]),
        enforceWhitelist,
        closeFactor,
        liquidationIncentive,
        priceOracle
      );
      const deployReceipt = await deployTx.wait();
      console.log(`Deployment of pool ${poolName} succeeded!`, deployReceipt.status);

      let poolId: number | undefined;
      try {
        // Latest Event is PoolRegistered which includes the poolId
        const registerEvent = deployReceipt.events?.pop();
        poolId =
          registerEvent && registerEvent.args && registerEvent.args[0]
            ? (registerEvent.args[0] as BigNumber).toNumber()
            : undefined;
      } catch (e) {
        console.warn("Unable to retrieve pool ID from receipt events", e);
      }

      // Compute Unitroller address
      const saltsHash = utils.solidityKeccak256(
        ["address", "string", "uint"],
        [options.from, poolName, deployReceipt.blockNumber]
      );
      const byteCodeHash = utils.keccak256(
        bytecode.Unitroller +
          new utils.AbiCoder().encode(["address"], [this.chainDeployment.FuseFeeDistributor.address]).slice(2)
      );

      const poolAddress = utils.getCreate2Address(
        this.chainDeployment.FusePoolDirectory.address,
        saltsHash,
        byteCodeHash
      );

      // Accept admin status via Unitroller
      const unitroller = new Contract(
        poolAddress,
        // TODO: change to ABI
        this.chainDeployment.RewardsDistributorDelegate.abi,
        this.provider.getSigner(options.from)
      );
      const acceptTx = await unitroller._acceptAdmin();
      const acceptReceipt = await acceptTx.wait();
      console.log("Accepted admin status for admin:", acceptReceipt.status);

      // Whitelist
      console.log("enforceWhitelist: ", enforceWhitelist);
      if (enforceWhitelist) {
        const comptroller = new Contract(
          poolAddress,
          this.chainDeployment.Comptroller.abi,
          this.provider.getSigner(options.from)
        );

        // Was enforced by pool deployment, now just add addresses
        const whitelistTx = await comptroller._setWhitelistStatuses(whitelist, Array(whitelist.length).fill(true));
        const whitelistReceipt = await whitelistTx.wait();
        console.log("Whitelist updated:", whitelistReceipt.status);
      }

      return [poolAddress, implementationAddress, priceOracle, poolId];
    } catch (error) {
      throw Error("Deployment of new Fuse pool failed: " + (error.message ? error.message : error));
    }
  }

  async deployInterestRateModel(options: any, model?: string, conf?: InterestRateModelParams): Promise<string> {
    // Default model = JumpRateModel
    if (!model) {
      model = "JumpRateModel";
    }

    // Get deployArgs
    let deployArgs: any[] = [];
    let modelArtifact: Artifact;

    switch (model) {
      case "JumpRateModel":
        if (!conf) conf = JUMP_RATE_MODEL_CONF(this.chainId).interestRateModelParams;
        deployArgs = [
          conf.blocksPerYear,
          conf.baseRatePerYear,
          conf.multiplierPerYear,
          conf.jumpMultiplierPerYear,
          conf.kink,
        ];
        modelArtifact = {
          abi: this.chainDeployment.JumpRateModel.abi,
          bytecode: bytecode.JumpRateModel,
        };
        break;
      case "WhitePaperInterestRateModel":
        if (!conf) conf = WHITE_PAPER_RATE_MODEL_CONF(this.chainId).interestRateModelParams;
        conf = {
          blocksPerYear: conf.blocksPerYear,
          baseRatePerYear: conf.baseRatePerYear,
          multiplierPerYear: conf.multiplierPerYear,
        };
        deployArgs = [conf.blocksPerYear, conf.baseRatePerYear, conf.multiplierPerYear];
        modelArtifact = {
          abi: this.chainDeployment.WhitePaperInterestRateModel.abi,
          bytecode: bytecode.WhitePaperInterestRateModel,
        };
        break;
      default:
        throw "IRM model specified is invalid";
    }

    // Deploy InterestRateModel
    const interestRateModelContract = new ContractFactory(
      modelArtifact.abi,
      modelArtifact.bytecode,
      this.provider.getSigner(options.from)
    );

    const deployedInterestRateModel = await interestRateModelContract.deploy(...deployArgs);
    return deployedInterestRateModel.address;
  }

  async identifyPriceOracle(priceOracleAddress: string) {
    for (const [name] of Object.entries(this.oracles)) {
      const address = await this.contracts.AddressesProvider.getAddress(name);
      if (address.toLowerCase() === priceOracleAddress.toLowerCase()) {
        return name;
      }
    }
    return null;
  }

  async identifyInterestRateModel(interestRateModelAddress: string): Promise<InterestRateModel | null> {
    // Get interest rate model type from runtime bytecode hash and init class
    const interestRateModels: { [key: string]: any } = {
      JumpRateModel: JumpRateModel,
      DAIInterestRateModelV2: DAIInterestRateModelV2,
      WhitePaperInterestRateModel: WhitePaperInterestRateModel,
    };

    for (const [name, irm] of Object.entries(interestRateModels)) {
      const address = await this.contracts.AddressesProvider.getAddress(name);
      if (address.toLowerCase() === interestRateModelAddress.toLowerCase()) {
        return new irm();
      }
    }
    return null;
  }

  async getInterestRateModel(assetAddress: string): Promise<any | undefined | null> {
    // Get interest rate model address from asset address
    // TODO: change this to exported ABI
    const assetContract = new Contract(assetAddress, this.chainDeployment.CErc20Delegate.abi, this.provider);
    const interestRateModelAddress: string = await assetContract.callStatic.interestRateModel();

    const interestRateModel = await this.identifyInterestRateModel(interestRateModelAddress);
    if (interestRateModel === null) {
      return null;
    }
    await interestRateModel.init(
      interestRateModelAddress,
      assetAddress,
      this.chainDeployment[interestRateModel.name()].abi,
      this.chainDeployment.CErc20Delegate.abi,
      this.provider
    );
    return interestRateModel;
  }

  async getPriceOracle(oracleAddress: string): Promise<string | null> {
    // Get price oracle contract name from AddressesProvider
    for (const [name] of Object.entries(this.oracles)) {
      const address = await this.contracts.AddressesProvider.getAddress(name);
      if (address.toLowerCase() === oracleAddress.toLowerCase()) {
        return name;
      }
    }
    return null;
  }

  async checkCardinality(uniswapV3Pool: string) {
    const uniswapV3PoolContract = new Contract(uniswapV3Pool, uniswapV3PoolAbiSlim);
    return (await uniswapV3PoolContract.methods.slot0().call()).observationCardinalityNext < 64;
  }

  async primeUniswapV3Oracle(uniswapV3Pool, options) {
    const uniswapV3PoolContract = new Contract(uniswapV3Pool, uniswapV3PoolAbiSlim);
    await uniswapV3PoolContract.methods.increaseObservationCardinalityNext(64).send(options);
  }

  identifyInterestRateModelName = (irmAddress: string): string | null => {
    let irmName: string | null = null;
    for (const [name, irm] of Object.entries(this.irms)) {
      if (irm.address === irmAddress) {
        irmName = name;
        return irmName;
      }
    }
    return irmName;
  };

  getComptrollerInstance(comptrollerAddress: string, options: { from: string }) {
    return new Contract(
      comptrollerAddress,
      this.chainDeployment.Comptroller.abi,
      this.provider.getSigner(options.from)
    ) as Comptroller;
  }
}

const FuseBaseWithModules = withFlywheel(
  withFusePoolLens(
    withRewardsDistributor(
      withFundOperations(withSafeLiquidator(withFusePools(withAsset(withCreateContracts(FuseBase)))))
    )
  )
);

export default class Fuse extends FuseBaseWithModules {}
