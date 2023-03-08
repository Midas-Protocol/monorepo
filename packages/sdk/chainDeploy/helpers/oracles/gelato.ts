import { providers } from "ethers";

import { GelatoGUniPriceOracle } from "../../../typechain/GelatoGUniPriceOracle";
import { gelatoGUniPriceOracleDeployParams } from "../types";

export const deployGelatoGUniPriceOracle = async ({
  ethers,
  getNamedAccounts,
  deployments,
  deployConfig,
  gelatoAssets,
}: gelatoGUniPriceOracleDeployParams): Promise<{ gUniOracle: GelatoGUniPriceOracle }> => {
  const { upgradesAdmin, oraclesAdmin } = await getNamedAccounts();

  const mpo = await ethers.getContract("MasterPriceOracle", oraclesAdmin);

  //// Gelato GUni Price Oracle
  const gelatoGUniPriceOracle = await deployments.deploy("GelatoGUniPriceOracle", {
    from: upgradesAdmin,
    args: [deployConfig.wtoken],
    log: true,
  });

  if (gelatoGUniPriceOracle.transactionHash)
    await ethers.provider.waitForTransaction(gelatoGUniPriceOracle.transactionHash);

  console.log("GelatoGUniPriceOracle: ", gelatoGUniPriceOracle.address);

  const gUniOracle = (await ethers.getContract("GelatoGUniPriceOracle")) as GelatoGUniPriceOracle;

  const underlyings = gelatoAssets.map((d) => d.vaultAddress);
  const oracles = Array(gelatoAssets.length).fill(gUniOracle.address);

  const tx: providers.TransactionResponse = await mpo.add(underlyings, oracles);
  await tx.wait();

  console.log(`Master Price Oracle updated for tokens ${underlyings.join(", ")}`);

  return { gUniOracle };
};
