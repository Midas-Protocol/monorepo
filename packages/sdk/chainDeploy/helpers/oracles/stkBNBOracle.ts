import { assetSymbols, underlying } from "@midas-capital/types";
import { providers } from "ethers";

import { stkBNBOracleDeployParams } from "../types";

export const deployStkBNBOracle = async ({
  ethers,
  getNamedAccounts,
  deployments,
  assets,
}: stkBNBOracleDeployParams): Promise<{ stkBNBOracle: any }> => {
  const { upgradesAdmin, oraclesAdmin } = await getNamedAccounts();

  const mpo = await ethers.getContract("MasterPriceOracle", oraclesAdmin);

  const stkBNB = underlying(assets, assetSymbols.stkBNB);

  const stkBNBOracle = await deployments.deploy("StkBNBPriceOracle", {
    from: upgradesAdmin,
    args: [],
    log: true,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [],
        },
      },
      owner: upgradesAdmin,
      proxyContract: "OpenZeppelinTransparentProxy",
    },
  });
  if (stkBNBOracle.transactionHash) await ethers.provider.waitForTransaction(stkBNBOracle.transactionHash);
  console.log("stkBNBOracle: ", stkBNBOracle.address);

  const tx: providers.TransactionResponse = await mpo.add([stkBNB], [stkBNBOracle.address]);
  await tx.wait();
  return { stkBNBOracle };
};
