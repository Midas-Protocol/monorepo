import { constants } from "ethers";

import { LiquidatorDeployFnParams } from "./types";
import { FuseSafeLiquidator } from "../../lib/contracts/typechain";
import { chainRedemptionStrategies } from "../../src/chainConfig";

export const deployFuseSafeLiquidator = async ({
  ethers,
  getNamedAccounts,
  chainId,
  deployments,
  deployConfig,
}: LiquidatorDeployFnParams): Promise<void> => {
  const { deployer } = await getNamedAccounts();
  const fsl = await deployments.deploy("FuseSafeLiquidator", {
    from: deployer,
    log: true,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [
            deployConfig.wtoken,
            deployConfig.uniswap.uniswapV2RouterAddress,
            deployConfig.stableToken ?? constants.AddressZero,
            deployConfig.wBTCToken ?? constants.AddressZero,
            deployConfig.uniswap.pairInitHashCode ?? "0x",
          ],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
      owner: deployer,
    },
  });
  if (fsl.transactionHash) await ethers.provider.waitForTransaction(fsl.transactionHash);
  console.log("FuseSafeLiquidator: ", fsl.address);

  const strategies: string[] = [];
  const arrayOfTrue: boolean[] = [];
  const fuseSafeLiquidator = (await ethers.getContract("FuseSafeLiquidator", deployer)) as FuseSafeLiquidator;

  for(const address in chainRedemptionStrategies[chainId]) {
    let whitelistedAlready = await fuseSafeLiquidator.redemptionStrategiesWhitelist(address);
    if (!whitelistedAlready) {
      strategies.push(address);
      arrayOfTrue.push(true);
    }
  }

  if (strategies.length > 0) {
    const tx = await fuseSafeLiquidator._whitelistRedemptionStrategies(strategies, arrayOfTrue);
    await tx.wait();
    console.log("_whitelistRedemptionStrategies: ", tx.hash);
  } else {
    console.log("no redemption strategies for whitelisting");
  }
};
