import { BigNumber } from "ethers";
import { getAddress } from "viem";

import FusePoolLensABI from "../../../abis/FusePoolLens";
import { MidasSdk } from "../../MidasSdk";

import { ChainLiquidationConfig } from "./config";
import {
  EncodedLiquidationTx,
  ErroredPool,
  ExtendedFusePoolAssetStructOutput,
  FusePoolUserStruct,
  FusePoolUserWithAssets,
  LiquidatablePool,
  PublicPoolUserWithData,
} from "./utils";

import { getPotentialLiquidation } from "./index";

async function getLiquidatableUsers(
  sdk: MidasSdk,
  poolUsers: FusePoolUserStruct[],
  pool: PublicPoolUserWithData,
  chainLiquidationConfig: ChainLiquidationConfig
): Promise<Array<EncodedLiquidationTx>> {
  const users: Array<EncodedLiquidationTx> = [];
  for (const user of poolUsers) {
    const { result } = await sdk.publicClient.simulateContract({
      address: getAddress(sdk.chainDeployment.FusePoolLens.address),
      abi: FusePoolLensABI,
      functionName: "getPoolAssetsByUser",
      args: [getAddress(pool.comptroller), getAddress(user.account)],
    });

    const userWithAssets: FusePoolUserWithAssets = {
      ...user,
      debt: [],
      collateral: [],
      assets: result as ExtendedFusePoolAssetStructOutput[],
    };

    const encodedLiquidationTX = await getPotentialLiquidation(
      sdk,
      userWithAssets,
      pool.closeFactor,
      pool.liquidationIncentive,
      chainLiquidationConfig
    );
    if (encodedLiquidationTX !== null) users.push(encodedLiquidationTX);
  }
  return users;
}

export default async function gatherLiquidations(
  sdk: MidasSdk,
  pools: Array<PublicPoolUserWithData>,
  chainLiquidationConfig: ChainLiquidationConfig
): Promise<[Array<LiquidatablePool>, Array<ErroredPool>]> {
  const liquidations: Array<LiquidatablePool> = [];
  const erroredPools: Array<ErroredPool> = [];

  for (const pool of pools) {
    const poolUsers = pool.users.slice().sort((a, b) => {
      const right = BigNumber.from(b.totalBorrow);
      const left = BigNumber.from(a.totalBorrow);
      if (right.gt(left)) return 1;
      if (right.lt(left)) return -1;
      return 0;
    });
    try {
      const liquidatableUsers = await getLiquidatableUsers(sdk, poolUsers, pool, chainLiquidationConfig);
      if (liquidatableUsers.length > 0) {
        liquidations.push({
          comptroller: pool.comptroller,
          liquidations: liquidatableUsers,
        });
      }
    } catch (e) {
      erroredPools.push({
        msg: "Error while fetching liquidatable users " + (e as Error).stack,
        comptroller: pool.comptroller,
        error: e,
      });
    }
  }
  return [liquidations, erroredPools];
}
