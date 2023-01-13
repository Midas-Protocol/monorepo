import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

import { ChainDeployConfig, chainDeployConfig } from "../chainDeploy";

import func from "./deploy";

// use with mainnet forking to simulate the prod environment
const forkMainnet: DeployFunction = async (hre): Promise<void> => {
  const chainId = await hre.getChainId();
  console.log("chainId: ", chainId);
  if (!chainDeployConfig[chainId]) {
    throw new Error(`Config invalid for ${chainId}`);
  }
  const fundingValue = hre.ethers.utils.parseEther("10");

  const { deployer } = await hre.getNamedAccounts();

  // in case hardhat_impersonateAccount is failing, make sure to be running `hardhat node` instead of deploy
  await hre.network.provider.send("evm_setAutomine", [true]);
  await hre.ethers.provider.send("hardhat_impersonateAccount", [deployer]);

  const signer = hre.ethers.provider.getSigner(deployer);
  await signer.sendTransaction({ to: deployer, value: fundingValue });
  await func(hre);
};
forkMainnet.tags = ["simulate", "fork", "local"];

export default forkMainnet;
