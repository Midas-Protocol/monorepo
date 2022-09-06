import { assetSymbols, SupportedAsset } from "@midas-capital/types";
import { providers } from "ethers";

import { AddressesProvider } from "../../../lib/contracts/typechain/AddressesProvider";
import { PythPriceOracle } from "../../../lib/contracts/typechain/PythPriceOracle";
import { PythDeployFnParams } from "../types";

export const deployPythOracle = async ({
  ethers,
  getNamedAccounts,
  deployments,
  deployConfig,
  assets,
  pythAssets,
}: PythDeployFnParams): Promise<{ ppo: any }> => {
  const { deployer } = await getNamedAccounts();
  let tx: providers.TransactionResponse;

  const pyth = await deployments.deploy("Pyth", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });
  console.log("Pyth: ", pyth.address);

  const mpo = await ethers.getContract("MasterPriceOracle", deployer);

  // deploy pyth price oracle
  const pythOracle = await deployments.deploy("PythPriceOracle", {
    from: deployer,
    args: [
      true,
      deployConfig.wtoken,
      pyth.address,
      "7f57ca775216655022daa88e41c380529211cde01a1517735dbcf30e4a02bdaa",
      mpo.address,
      assets.find((a: SupportedAsset) => a.symbol === assetSymbols.USDC)!.underlying,
    ],
    log: true,
    waitConfirmations: 1,
  });
  console.log("PythPriceOracle: ", pythOracle.address);

  const pythPriceOracle = (await ethers.getContract("PythPriceOracle", deployer)) as PythPriceOracle;
  tx = await pythPriceOracle.setPriceFeeds(
    pythAssets.map((p) => assets.find((a: SupportedAsset) => a.symbol === p.symbol)!.underlying),
    pythAssets.map((p) => p.feed)
  );

  console.log(`Set price feeds for PythPriceOracle: ${tx.hash}`);
  await tx.wait();
  console.log(`Set price feeds for PythPriceOracle mined: ${tx.hash}`);

  const underlyings = pythAssets.map((p) => assets.find((a) => a.symbol === p.symbol)!.underlying);
  const oracles = Array(pythAssets.length).fill(pythOracle.address);

  tx = await mpo.add(underlyings, oracles);
  await tx.wait();

  console.log(`Master Price Oracle updated for tokens ${underlyings.join(", ")}`);

  const addressesProvider = (await ethers.getContract("AddressesProvider", deployer)) as AddressesProvider;
  const pythPriceOracleAddress = await addressesProvider.callStatic.getAddress("PythPriceOracle");
  if (pythPriceOracleAddress !== pythOracle.address) {
    tx = await addressesProvider.setAddress("PythPriceOracle", pythOracle.address);
    await tx.wait();
    console.log("setAddress PythPriceOracle: ", tx.hash);
  }

  return { ppo: pythOracle };
};
