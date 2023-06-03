import { formatEther, getAddress, parseEther } from "viem";

import ComptrollerABI from "../../../abis/Comptroller";
import ComptrollerFirstExtensionABI from "../../../abis/ComptrollerFirstExtension";
import FusePoolDirectoryABI from "../../../abis/FusePoolDirectory";
import FusePoolLensABI from "../../../abis/FusePoolLens";
import { MidasSdk } from "../../MidasSdk";

import { ErroredPool, ExtendedFusePoolAssetStructOutput, FusePoolUserStruct, PublicPoolUserWithData } from "./utils";

function getUserTotals(assets: ExtendedFusePoolAssetStructOutput[]): {
  totalBorrow: bigint;
  totalCollateral: bigint;
} {
  let totalBorrow = BigInt(0);
  let totalCollateral = BigInt(0);

  for (const a of assets) {
    totalBorrow = totalBorrow + (a.borrowBalance * a.underlyingPrice) / parseEther(`${1}`);
    if (a.membership) {
      totalCollateral =
        totalCollateral +
        (((a.supplyBalance * a.underlyingPrice) / parseEther(`${1}`)) * a.collateralFactor) / parseEther(`${1}`);
    }
  }
  return { totalBorrow, totalCollateral };
}

function getPositionHealth(totalBorrow: bigint, totalCollateral: bigint): bigint {
  return totalBorrow > BigInt(0) ? (totalCollateral * parseEther(`${1}`)) / totalBorrow : 10n ** 36n;
}

async function getFusePoolUsers(
  sdk: MidasSdk,
  comptroller: string,
  maxHealth: bigint
): Promise<PublicPoolUserWithData> {
  const poolUsers: FusePoolUserStruct[] = [];
  const [users, closeFactor, liquidationIncentive] = await Promise.all([
    sdk.publicClient.readContract({
      address: getAddress(comptroller),
      abi: ComptrollerFirstExtensionABI,
      functionName: "getAllBorrowers",
    }),
    sdk.publicClient.readContract({
      address: getAddress(comptroller),
      abi: ComptrollerFirstExtensionABI,
      functionName: "closeFactorMantissa",
    }),
    sdk.publicClient.readContract({
      address: getAddress(comptroller),
      abi: ComptrollerFirstExtensionABI,
      functionName: "liquidationIncentiveMantissa",
    }),
  ]);
  for (const user of users) {
    const { result: assets } = await sdk.publicClient.simulateContract({
      address: getAddress(sdk.chainDeployment.FusePoolLens.address),
      abi: FusePoolLensABI,
      functionName: "getPoolAssetsWithData",
      args: [getAddress(comptroller)],
      account: user,
    });

    const { totalBorrow, totalCollateral } = getUserTotals(assets as ExtendedFusePoolAssetStructOutput[]);
    const health = getPositionHealth(totalBorrow, totalCollateral);

    if (maxHealth > health) {
      poolUsers.push({ account: user, totalBorrow, totalCollateral, health });
    }
  }
  return {
    comptroller,
    users: poolUsers,
    closeFactor,
    liquidationIncentive,
  };
}

async function getPoolsWithShortfall(sdk: MidasSdk, comptroller: string) {
  const users = await sdk.publicClient.readContract({
    address: getAddress(comptroller),
    abi: ComptrollerFirstExtensionABI,
    functionName: "getAllBorrowers",
  });
  const promises = users.map((user) => {
    return sdk.publicClient.readContract({
      address: getAddress(comptroller),
      abi: ComptrollerABI,
      functionName: "getAccountLiquidity",
      args: [user],
    });
  });
  const allResults = await Promise.all(promises.map((p) => p.catch((e) => e)));

  const validResults = allResults.filter((r) => !(r instanceof Error));
  const erroredResults = allResults.filter((r) => r instanceof Error);

  if (erroredResults.length > 0) {
    sdk.logger.error("Errored results", { erroredResults });
  }
  const results = validResults.map((r, i) => {
    return { user: users[i], liquidity: r[1], shortfall: r[2] };
  });
  const minimumTransactionCost = await sdk.publicClient.getGasPrice().then((g) => g * 500000n);

  return results.filter((user) => user.shortfall > minimumTransactionCost);
}

export default async function getAllFusePoolUsers(
  sdk: MidasSdk,
  maxHealth: bigint,
  excludedComptrollers: Array<string>
): Promise<[PublicPoolUserWithData[], Array<ErroredPool>]> {
  const [, allPools] = await sdk.publicClient.readContract({
    address: getAddress(sdk.chainDeployment.FusePoolDirectory.address),
    abi: FusePoolDirectoryABI,
    functionName: "getActivePools",
  });
  const fusePoolUsers: PublicPoolUserWithData[] = [];
  const erroredPools: Array<ErroredPool> = [];
  for (const pool of allPools) {
    const { comptroller, name } = pool;
    if (!excludedComptrollers.includes(comptroller)) {
      try {
        const hasShortfall = await getPoolsWithShortfall(sdk, comptroller);
        if (hasShortfall.length > 0) {
          const users = hasShortfall.map((user) => {
            return `- user: ${user.user}, shortfall: ${formatEther(user.shortfall)}\n`;
          });
          sdk.logger.info(`Pool ${name} (${comptroller}) has ${hasShortfall.length} users with shortfall: \n${users}`);
          try {
            const poolUserParams: PublicPoolUserWithData = await getFusePoolUsers(sdk, comptroller, maxHealth);
            fusePoolUsers.push(poolUserParams);
          } catch (e) {
            const msg = `Error getting pool users for ${comptroller}` + e;
            erroredPools.push({ comptroller, msg, error: e });
          }
        } else {
          sdk.logger.info(`Pool ${name} (${comptroller}) has no users with shortfall`);
        }
      } catch (e) {
        const msg = `Error getting shortfalled users for pool ${name} (${comptroller})` + e;
        erroredPools.push({ comptroller, msg, error: e });
      }
    }
  }
  return [fusePoolUsers, erroredPools];
}
