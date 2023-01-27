import { constants, providers } from "ethers";

import { CurveLpFnParams, CurveV2LpFnParams } from "../types";

export const deployCurveLpOracle = async ({
  ethers,
  getNamedAccounts,
  deployments,
  curvePools,
}: CurveLpFnParams): Promise<void> => {
  const { upgradesAdmin, oraclesAdmin } = await getNamedAccounts();
  let tx: providers.TransactionResponse;
  let receipt: providers.TransactionReceipt;

  //// CurveLpTokenPriceOracleNoRegistry
  const cpo = await deployments.deploy("CurveLpTokenPriceOracleNoRegistry", {
    from: upgradesAdmin,
    args: [],
    log: true,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [[], [], []],
        },
        onUpgrade: {
          methodName: "reinitialize",
          args: [curvePools.map((c) => c.lpToken)],
        },
      },
      owner: upgradesAdmin,
      proxyContract: "OpenZeppelinTransparentProxy",
    },
  });
  if (cpo.transactionHash) await ethers.provider.waitForTransaction(cpo.transactionHash);
  console.log("CurveLpTokenPriceOracleNoRegistry: ", cpo.address);

  const curveOracle = await ethers.getContract("CurveLpTokenPriceOracleNoRegistry", oraclesAdmin);

  for (const pool of curvePools) {
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

  const underlyings = curvePools.map((c) => c.lpToken);
  const oracles = Array(curvePools.length).fill(curveOracle.address);

  const mpo = await ethers.getContract("MasterPriceOracle", oraclesAdmin);
  tx = await mpo.add(underlyings, oracles);
  await tx.wait();

  console.log(`Master Price Oracle updated for tokens ${underlyings.join(", ")}`);
};

export const deployCurveV2LpOracle = async ({
  ethers,
  getNamedAccounts,
  deployments,
  curveV2Pools,
}: CurveV2LpFnParams): Promise<void> => {
  const { upgradesAdmin, oraclesAdmin } = await getNamedAccounts();
  let tx: providers.TransactionResponse;
  let receipt: providers.TransactionReceipt;

  const mpo = await ethers.getContract("MasterPriceOracle", oraclesAdmin);

  //// CurveLpTokenPriceOracleNoRegistry
  const cpo = await deployments.deploy("CurveV2LpTokenPriceOracleNoRegistry", {
    from: upgradesAdmin,
    args: [],
    log: true,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [[], []],
        },
        onUpgrade: {
          methodName: "reinitialize",
          args: [curveV2Pools.map((c) => c.lpToken)],
        },
      },
      owner: upgradesAdmin,
      proxyContract: "OpenZeppelinTransparentProxy",
    },
  });
  if (cpo.transactionHash) await ethers.provider.waitForTransaction(cpo.transactionHash);
  console.log("CurveV2LpTokenPriceOracleNoRegistry: ", cpo.address);

  const curveOracle = await ethers.getContract("CurveV2LpTokenPriceOracleNoRegistry", oraclesAdmin);

  for (const pool of curveV2Pools) {
    const registered = await curveOracle.poolOf(pool.lpToken);

    if (registered !== constants.AddressZero) {
      console.log("Pool already registered", pool);
      continue;
    }

    tx = await curveOracle.registerPool(pool.lpToken, pool.pool);
    console.log("registerPool sent: ", tx.hash);
    receipt = await tx.wait();
    console.log("registerPool mined: ", receipt.transactionHash);
  }

  const underlyings = curveV2Pools.map((c) => c.lpToken);
  const oracles = Array(curveV2Pools.length).fill(curveOracle.address);

  tx = await mpo.add(underlyings, oracles);
  await tx.wait();

  console.log(`Master Price Oracle updated for tokens ${underlyings.join(", ")}`);
};
