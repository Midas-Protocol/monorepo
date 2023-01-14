import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import { config as dotEnvConfig } from "dotenv";
import "hardhat-abi-exporter";
import "hardhat-deploy";
import "hardhat-tracer";
import { HardhatUserConfig } from "hardhat/types";

import "./tasks/fork";
import "./tasks/irm";
import "./tasks/market";
import "./tasks/oracle";
import "./tasks/plugin";
import "./tasks/pool";
import "./tasks/swap";
import "./tasks/admin";

import "./tasks/flywheel";
import "./tasks/liquidation";
import "./tasks/replaceFlywheels";
import "./tasks/sendTestTokens";

import "./tasks/one-time/liquidate-take-bad-debt";
import "./tasks/oracle/add-apeswap-oracle";
import "./tasks/configureApStrategies";

dotEnvConfig();

const OVERRIDE_RPC_URL = process.env.OVERRIDE_RPC_URL || process.env.ETH_PROVIDER_URL; // Deprecated: ETH_PROVIDER_URL
const FORK_RPC_URL = process.env.FORK_RPC_URL;
const FORK_CHAIN_ID = process.env.FORK_CHAIN_ID;
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER;

console.info({
  OVERRIDE_RPC_URL,
  FORK_RPC_URL,
  FORK_CHAIN_ID,
  FORK_BLOCK_NUMBER,
});

const mnemonic =
  process.env.SUGAR_DADDY ||
  process.env.MNEMONIC ||
  "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

const config: HardhatUserConfig = {
  mocha: {
    timeout: 200_000,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  external: {
    contracts: [{ artifacts: "./lib/contracts/out" }],
  },
  paths: {
    sources: "./none",
    tests: "./tests",
    artifacts: "./lib/contracts/out",
  },

  namedAccounts: {
    upgradesAdmin: { default: 0 },
    liquidator: { default: 0 },
    poolsSuperAdmin: { default: 0 },
    oraclesAdmin: { default: 0 },
    extrasAdmin: { default: 0 },
    testConfigAdmin: { default: 0 },
    deployer: { hardhat: 0 },
    // alice: { default: 1 },
    // bob: { default: 2 },
    // rando: { default: 3 },
  },
  networks: {
    // This is the unchangeable default network which is started with `hardhat node`
    hardhat: {
      accounts: { mnemonic },
      allowUnlimitedContractSize: true,
      chainId: FORK_CHAIN_ID ? Number(FORK_CHAIN_ID) : 1337,
      gas: 25e6,
      gasPrice: 20e10,
      forking: FORK_RPC_URL
        ? {
            url: FORK_RPC_URL,
            blockNumber: FORK_BLOCK_NUMBER ? Number(FORK_BLOCK_NUMBER) : undefined,
          }
        : undefined,
    },
    fork: {
      allowUnlimitedContractSize: true,
      accounts: { mnemonic },
      chainId: FORK_CHAIN_ID ? Number(FORK_CHAIN_ID) : 1337,
      gasPrice: 20e9,
      gas: 7500000,
      url: "http://localhost:8545",
    },
    localbsc: {
      accounts: { mnemonic },
      chainId: 56,
      gas: 25e6,
      gasPrice: 20e10,
      url: "http://localhost:8545",
    },
    localchapel: {
      accounts: { mnemonic },
      chainId: 97,
      gas: 25e6,
      gasPrice: 20e10,
      url: "http://localhost:8547",
    },
    localpolygon: {
      accounts: { mnemonic },
      chainId: 137,
      gas: 25e6,
      gasPrice: 20e10,
      url: "http://localhost:8546",
    },
    localarbitrum: {
      accounts: { mnemonic },
      chainId: 42161,
      gas: 25e6,
      gasPrice: 20e10,
      url: "http://localhost:8548",
    },
    bsc: {
      accounts: { mnemonic },
      chainId: 56,
      url: OVERRIDE_RPC_URL || process.env.BSC_PROVIDER_URL || "https://bsc-dataseed.binance.org/",
    },
    chapel: {
      accounts: { mnemonic },
      chainId: 97,
      url: OVERRIDE_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
    },
    mainnet: {
      accounts: { mnemonic },
      chainId: 1,
      url: OVERRIDE_RPC_URL || "https://rpc.ankr.com/eth",
    },
    evmos: {
      accounts: { mnemonic },
      chainId: 9001,
      url: OVERRIDE_RPC_URL || "https://eth.bd.evmos.org:8545",
    },
    moonbeam: {
      accounts: { mnemonic },
      url: OVERRIDE_RPC_URL || `https://rpc.api.moonbeam.network`,
      chainId: 1284,
    },
    neondevnet: {
      accounts: { mnemonic },
      url: OVERRIDE_RPC_URL || `https://proxy.devnet.neonlabs.org/solana`,
      chainId: 245022926,
    },
    polygon: {
      url: OVERRIDE_RPC_URL || `https://rpc-mainnet.maticvigil.com/`,
      accounts: { mnemonic },
      chainId: 137,
    },
    arbitrum: {
      url: OVERRIDE_RPC_URL || `https://arb1.arbitrum.io/rpc`,
      accounts: { mnemonic },
      chainId: 42161,
    },
    fantom: {
      url: OVERRIDE_RPC_URL || `https://rpcapi.fantom.network`,
      accounts: { mnemonic },
      chainId: 250,
    },
  },
};

export default config;
