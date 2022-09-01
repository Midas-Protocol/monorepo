import { BigNumber, ethers } from "ethers";

import { Comptroller } from "../../../lib/contracts/typechain/Comptroller";
import { FusePoolLens as FusePoolLensType } from "../../../lib/contracts/typechain/FusePoolLens";
import { MidasBase } from "../../MidasSdk";

import { FusePoolUserStruct, PublicPoolUserWithData } from "./utils";

function getUserTotals(assets: FusePoolLensType.FusePoolAssetStructOutput[]): {
  totalBorrow: BigNumber;
  totalCollateral: BigNumber;
} {
  let totalBorrow = BigNumber.from(0);
  let totalCollateral = BigNumber.from(0);

  for (const a of assets) {
    totalBorrow = totalBorrow.add(a.borrowBalance.mul(a.underlyingPrice).div(ethers.utils.parseEther("1")));
    if (a.membership) {
      totalCollateral = totalCollateral.add(
        a.supplyBalance
          .mul(a.underlyingPrice)
          .div(ethers.utils.parseEther("1"))
          .mul(a.collateralFactor)
          .div(ethers.utils.parseEther("1"))
      );
    }
  }
  return { totalBorrow, totalCollateral };
}

function getPositionHealth(totalBorrow: BigNumber, totalCollateral: BigNumber): BigNumber {
  return totalBorrow.gt(BigNumber.from(0))
    ? totalCollateral.mul(ethers.utils.parseEther("1")).div(totalBorrow)
    : BigNumber.from(10).pow(36);
}

async function getFusePoolUsers(
  fuse: MidasBase,
  comptroller: string,
  maxHealth: BigNumber
): Promise<PublicPoolUserWithData> {
  const poolUsers: FusePoolUserStruct[] = [];
  const comptrollerInstance: Comptroller = fuse.getComptrollerInstance(comptroller);
  const users = await comptrollerInstance.callStatic.getAllBorrowers();
  for (const user of users) {
    const assets = await fuse.contracts.FusePoolLens.callStatic.getPoolAssetsWithData(comptrollerInstance.address, {
      from: user,
    });

    const { totalBorrow, totalCollateral } = getUserTotals(assets);
    const health = getPositionHealth(totalBorrow, totalCollateral);

    if (maxHealth.gt(health)) {
      poolUsers.push({ account: user, totalBorrow, totalCollateral, health });
    }
  }
  return {
    comptroller,
    users: poolUsers,
    closeFactor: await comptrollerInstance.callStatic.closeFactorMantissa(),
    liquidationIncentive: await comptrollerInstance.callStatic.liquidationIncentiveMantissa(),
  };
}

export default async function getAllFusePoolUsers(
  fuse: MidasBase,
  maxHealth: BigNumber,

  excludedComptrollers: Array<string>
): Promise<PublicPoolUserWithData[]> {
  const allPools = await fuse.contracts.FusePoolDirectory.getAllPools();
  const fusePoolUsers: PublicPoolUserWithData[] = [];
  for (const pool of allPools) {
    if (!excludedComptrollers.includes(pool.comptroller)) {
      const poolUserParams: PublicPoolUserWithData = await getFusePoolUsers(fuse, pool.comptroller, maxHealth);
      fusePoolUsers.push(poolUserParams);
    }
    // if (pool.comptroller !== "0xfeB4f9080Ad40ce33Fd47Ff6Da6e4822fE26C7d5") {
  }
  // }
  return fusePoolUsers;
}
