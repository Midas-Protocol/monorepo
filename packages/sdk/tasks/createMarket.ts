import { task, types } from "hardhat/config";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {MarketConfig} from "../src";

// example
// hardhat market:create --pool-name BOMB --creator deployer --symbol BTCB-BOMB --strategy-code BeefyERC4626_BOMBBTCLP --strategy-address 0x6B8B935dfC9Dcd0754eced708b1b633BF73FE854 --network bsc

export default task("market:create", "Create Market")
  .addParam("poolName", "Name of pool", undefined, types.string)
  .addParam("creator", "Signer name", undefined, types.string)
  .addParam("symbol", "Asset symbol", undefined, types.string)
  .addOptionalParam("strategyCode", "If using strategy, pass its code", undefined, types.string)
  .addOptionalParam("strategyAddress", "Override the strategy address", undefined, types.string)
  .addOptionalParam("flywheels", "Override the flywheels", undefined, types.string)
  .addOptionalParam("rewardTokens", "Override the reward tokens", undefined, types.string)

  .setAction(async (taskArgs, hre) => {
    const symbol = taskArgs.symbol;
    const poolName = taskArgs.poolName;

    const signer = await hre.ethers.getNamedSigner(taskArgs.creator);

    // @ts-ignore
    const enumsModule = await import("../src/enums");
    // @ts-ignore
    const fuseModule = await import("../tests/utils/fuseSdk");
    const sdk = await fuseModule.getOrCreateFuse();
    // @ts-ignore
    const assetModule = await import("../tests/utils/assets");
    // @ts-ignore
    const poolModule = await import("../tests/utils/pool");
    const pool = await poolModule.getPoolByName(poolName, sdk);

    const assets = await assetModule.getAssetsConf(
      pool.comptroller,
      sdk.contracts.FuseFeeDistributor.address,
      sdk.irms.JumpRateModel.address,
      hre.ethers,
      poolName
    );

    const marketConfig = assets.find((a) => a.symbol === symbol);

    if (taskArgs.strategyCode) {
      marketConfig.plugin = sdk.chainPlugins[marketConfig.underlying].find((p) => p.strategyCode === taskArgs.strategyCode);
      marketConfig.plugin.cTokenContract = enumsModule.DelegateContractName.CErc20PluginDelegate;

      if (taskArgs.strategyAddress) {
        marketConfig.plugin.strategyAddress = taskArgs.strategyAddress;
      }
      if (taskArgs.flywheels) {
        marketConfig.plugin.cTokenContract = enumsModule.DelegateContractName.CErc20PluginRewardsDelegate;
        const rds: Array<string> = taskArgs.flywheels.split(",");
        const rts: Array<string> = taskArgs.rewardTokens.split(",");
        if (rds.length !== rts.length) {
          throw "Length of RDs and RTs must be equal";
        }
        (marketConfig.plugin as any).flywheels = rds.map((r, i) => {
          return {
            address: r,
            rewardToken: rts[i],
          };
        });
        // @ts-ignore
        console.log("Flywheel config: ", marketConfig.plugin.flywheels);
      }
    }

    console.log(
      `Creating market for token ${marketConfig.underlying}, pool ${poolName}, impl: ${
        marketConfig.plugin ? marketConfig.plugin.cTokenContract : enumsModule.DelegateContractName.CErc20Delegate
      }`
    );

    console.log("Asset config: ", marketConfig);
    const [assetAddress, implementationAddress, interestRateModel, receipt] = await sdk.deployAsset(
      sdk.JumpRateModelConf,
      marketConfig,
      { from: signer.address }
    );

    console.log("CToken: ", assetAddress);
  });

task("market:plugin:create", "Create a Market together with a plugin")
  .addParam("poolName", "Name of pool", undefined, types.string)
  .addParam("creator", "Signer name", undefined, types.string)
  .addParam("symbol", "Asset symbol", undefined, types.string)
  .addParam("pluginContract", "The contract name for the plugin", undefined, types.string)
  .addOptionalParam("flywheels", "Override the flywheels", undefined, types.string)
  .addOptionalParam("rewardTokens", "Override the reward tokens", undefined, types.string)
  .addOptionalParam("otherParams", "Other plugin constructor params", undefined, types.string)
  .setAction(async (taskArgs, hre) => {
    // @ts-ignore
    const assetModule = await import("../tests/utils/assets");
    // @ts-ignore
    const poolModule = await import("../tests/utils/pool");
    // @ts-ignore
    const fuseModule = await import("../tests/utils/fuseSdk");
    // @ts-ignore
    const enumsModule = await import("../src/enums");

    const sdk = await fuseModule.getOrCreateFuse();
    const poolName = taskArgs.poolName;
    const pluginContract = taskArgs.pluginContract;
    const pool = await poolModule.getPoolByName(poolName, sdk);

    const assets = await assetModule.getAssetsConf(
      pool.comptroller,
      sdk.contracts.FuseFeeDistributor.address,
      sdk.irms.JumpRateModel.address,
      hre.ethers,
      poolName
    );

    const symbol = taskArgs.symbol;
    const signer = await hre.ethers.getNamedSigner(taskArgs.creator);
    const assetConfig = assets.find((a) => a.symbol === symbol);

    if (taskArgs.flywheels) {
      // TODO
      // assetConfig.plugin =?
      assetConfig.plugin.cTokenContract = enumsModule.DelegateContractName.CErc20PluginRewardsDelegate;
      const rds: Array<string> = taskArgs.flywheels.split(",");
      const rts: Array<string> = taskArgs.rewardTokens.split(",");
      if (rds.length !== rts.length) {
        throw "Length of RDs and RTs must be equal";
      }
      (assetConfig.plugin as any).flywheels = rds.map((r, i) => {
        return {
          address: r,
          rewardToken: rts[i],
        };
      });
      // @ts-ignore
      console.log("Flywheel config: ", assetConfig.plugin.flywheels);
    }

    const args = taskArgs.flywheels
      ? [
        assetConfig.underlying,
        ...taskArgs.flywheels.split(","),
        ...taskArgs.otherParams.split(","),
      ]
      : [assetConfig.underlying, ...taskArgs.otherParams.split(",")];

    console.log(`Deploying an instance of ${pluginContract}`, args);

    const marketAddress = await generateMarketAddress(assetConfig, hre);

    console.log("Asset config: ", assetConfig);
    const [assetAddress, implementationAddress, interestRateModel, receipt] = await sdk.deployAsset(
      sdk.JumpRateModelConf,
      assetConfig,
      { from: signer.address }
    );

    const erc4626 = await hre.deployments.deploy(`${pluginContract}_${marketAddress}`, {
      contract: pluginContract,
      from: signer.address,
      args: args,
      log: true,
      waitConfirmations: 1,
    });
    console.log(`${pluginContract}_${marketAddress}: `, erc4626.address);
  });

  async function generateMarketAddress(config: MarketConfig, hre: HardhatRuntimeEnvironment): Promise<string> {
    const abiCoder = new hre.ethers.utils.AbiCoder();

    const reserveFactorBN = hre.ethers.utils.parseUnits((config.reserveFactor / 100).toString());
    const adminFeeBN = hre.ethers.utils.parseUnits((config.adminFee / 100).toString());

    // Use Default CErc20Delegate
    let implementationAddress = this.chainDeployment.CErc20Delegate.address;
    let implementationData = "0x00";

    if (config.plugin) {
      implementationAddress = this.chainDeployment[config.plugin.cTokenContract].address;
      implementationData = abiCoder.encode(["address"], [config.plugin.strategyAddress]);
    }

    const deployArgs = [
      config.underlying,
      config.comptroller,
      config.fuseFeeDistributor,
      config.interestRateModel,
      config.name,
      config.symbol,
      implementationAddress,
      implementationData,
      reserveFactorBN,
      adminFeeBN,
    ];

    const constructorData = abiCoder.encode(
      ["address", "address", "address", "address", "string", "string", "address", "bytes", "uint256", "uint256"],
      deployArgs
    );

    const marketCounter = await this.contracts.FuseFeeDistributor.callStatic.marketsCounter();

    const saltsHash = hre.ethers.utils.solidityKeccak256(
      ["address", "address", "uint"],
      [config.comptroller, config.underlying, marketCounter]
    );
    const byteCodeHash = hre.ethers.utils.keccak256(
      this.artifacts.CErc20Delegator.bytecode.object + constructorData.substring(2)
    );
    const cErc20DelegatorAddress = hre.ethers.utils.getCreate2Address(
      this.chainDeployment.FuseFeeDistributor.address,
      saltsHash,
      byteCodeHash
    );

    console.log(`expected CErc20 market address is ${cErc20DelegatorAddress}`);

    return cErc20DelegatorAddress;
  }
