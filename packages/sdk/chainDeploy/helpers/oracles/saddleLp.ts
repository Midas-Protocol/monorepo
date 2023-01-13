import { constants, providers } from "ethers";

import { SaddleLpFnParams } from "../types";

export const deploySaddleLpOracle = async ({
  ethers,
  getNamedAccounts,
  deployments,
  saddlePools,
}: SaddleLpFnParams): Promise<void> => {
  const { upgradesAdmin, oraclesAdmin } = await getNamedAccounts();
  let tx: providers.TransactionResponse;
  let receipt: providers.TransactionReceipt;

  //// SaddleLpPriceOracle
  const cpo = await deployments.deploy("SaddleLpPriceOracle", {
    from: upgradesAdmin,
    args: [],
    log: true,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [[], [], []],
        },
      },
      owner: upgradesAdmin,
      proxyContract: "OpenZeppelinTransparentProxy",
    },
  });
  if (cpo.transactionHash) await ethers.provider.waitForTransaction(cpo.transactionHash);
  console.log("SaddleLpPriceOracle: ", cpo.address);

  const curveOracle = await ethers.getContract("SaddleLpPriceOracle", oraclesAdmin);

  for (const pool of saddlePools) {
    const registered = await curveOracle.poolOf(pool.lpToken);

    if (registered !== constants.AddressZero) {
      console.log("Pool already registered", pool);
      continue;
    }

    tx = await curveOracle.registerPool(pool.lpToken, pool.pool, pool.underlyings);
    console.log("registerPool sent: ", tx.hash);
    receipt = await tx.wait();
    console.log("registerPool mined: ", receipt.transactionHash);
  }

  const underlyings = saddlePools.map((c) => c.lpToken);
  const oracles = Array(saddlePools.length).fill(curveOracle.address);

  const mpo = await ethers.getContract("MasterPriceOracle", oraclesAdmin);
  tx = await mpo.add(underlyings, oracles);
  await tx.wait();

  console.log(`Master Price Oracle updated for tokens ${underlyings.join(", ")}`);
};
