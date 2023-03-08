import { underlying } from "@midas-capital/types";
import { providers } from "ethers";

import { aXXXcDeployParams } from "../types";

export const deployAnkrCertificateTokenPriceOracle = async ({
  ethers,
  getNamedAccounts,
  deployments,
  assets,
  certificateAssetSymbol,
}: aXXXcDeployParams): Promise<{ ankrCertificateTokenPriceOracle: any }> => {
  const { upgradesAdmin, oraclesAdmin } = await getNamedAccounts();

  const mpo = await ethers.getContract("MasterPriceOracle", oraclesAdmin);

  const aXXXc = underlying(assets, certificateAssetSymbol);

  const ankrCertificateTokenPriceOracle = await deployments.deploy("AnkrCertificateTokenPriceOracle", {
    from: upgradesAdmin,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [aXXXc],
        },
      },
      proxyContract: "OpenZeppelinTransparentProxy",
      owner: upgradesAdmin,
    },
    log: true,
    waitConfirmations: 1,
  });
  if (ankrCertificateTokenPriceOracle.transactionHash)
    await ethers.provider.waitForTransaction(ankrCertificateTokenPriceOracle.transactionHash);
  console.log("ankrCertificateTokenPriceOracle: ", ankrCertificateTokenPriceOracle.address);

  const tx: providers.TransactionResponse = await mpo.add([aXXXc], [ankrCertificateTokenPriceOracle.address]);
  await tx.wait();
  return { ankrCertificateTokenPriceOracle };
};
