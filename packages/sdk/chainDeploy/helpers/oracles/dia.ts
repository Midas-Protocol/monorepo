import { constants, providers } from "ethers";

import { DiaPriceOracle } from "../../../typechain/DiaPriceOracle";
import { DiaDeployFnParams } from "../types";

export const deployDiaOracle = async ({
  ethers,
  getNamedAccounts,
  deployments,
  deployConfig,
  diaAssets,
  diaNativeFeed,
}: DiaDeployFnParams): Promise<{ diaOracle: DiaPriceOracle }> => {
  const { upgradesAdmin, oraclesAdmin } = await getNamedAccounts();
  let tx: providers.TransactionResponse;

  const mpo = await ethers.getContract("MasterPriceOracle", oraclesAdmin);

  //// Dia Oracle
  const dia = await deployments.deploy("DiaPriceOracle", {
    from: upgradesAdmin,
    args: [
      oraclesAdmin,
      true,
      deployConfig.wtoken,
      diaNativeFeed.feed,
      diaNativeFeed.key,
      diaNativeFeed.feed === constants.AddressZero ? mpo.address : constants.AddressZero,
      diaNativeFeed.feed === constants.AddressZero ? deployConfig.stableToken : constants.AddressZero,
    ],
    log: true,
  });
  if (dia.transactionHash) await ethers.provider.waitForTransaction(dia.transactionHash);
  console.log("DiaPriceOracle: ", dia.address);

  const diaOracle = (await ethers.getContract("DiaPriceOracle", oraclesAdmin)) as DiaPriceOracle;
  tx = await diaOracle.setPriceFeeds(
    diaAssets.map((d) => d.underlying),
    diaAssets.map((d) => d.feed),
    diaAssets.map((d) => d.key)
  );
  console.log(`Set price feeds for DiaPriceOracle: ${tx.hash}`);
  await tx.wait();
  console.log(`Set price feeds for DiaPriceOracle mined: ${tx.hash}`);

  const underlyings = diaAssets.map((d) => d.underlying);
  const oracles = Array(diaAssets.length).fill(diaOracle.address);

  tx = await mpo.add(underlyings, oracles);
  await tx.wait();

  console.log(`Master Price Oracle updated for tokens ${underlyings.join(", ")}`);

  return { diaOracle };
};
