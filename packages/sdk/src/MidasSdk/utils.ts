import Filter from "bad-words";
import {
  encodeAbiParameters,
  encodePacked,
  getAddress,
  getContract,
  getContractAddress,
  keccak256,
  numberToHex,
  parseAbiParameters,
} from "viem";
import type { PublicClient } from "viem";

import ComptrollerABI from "../../abis/Comptroller";
import UnitrollerAbi from "../../abis/Unitroller";
import ComptrollerArtifact from "../../artifacts/Comptroller.json";
import UnitrollerArtifact from "../../artifacts/Unitroller.json";
import { Comptroller } from "../../typechain/Comptroller";
import { Unitroller } from "../../typechain/Unitroller";

export function filterOnlyObjectProperties(obj: any) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => isNaN(k as any))) as any;
}

export const filter = new Filter({ placeHolder: " " });
filter.addWords(...["R1", "R2", "R3", "R4", "R5", "R6", "R7"]);

export const filterPoolName = (name: string) => {
  return filter.clean(name);
};

export const getSaltsHash = (from: string, poolName: string, blockNumber: number): string => {
  return keccak256(encodePacked(["address", "string", "uint"], [getAddress(from), poolName, BigInt(blockNumber)]));
};

export const getBytecode = (fuseFeeDistributorAddress: string): string => {
  return (
    UnitrollerArtifact.bytecode.object +
    encodeAbiParameters(parseAbiParameters("address"), [getAddress(fuseFeeDistributorAddress)]).slice(2)
  );
};

export const getPoolAddress = (
  from: string,
  poolName: string,
  marketsCounter: number,
  fuseFeeDistributorAddress: string,
  fusePoolDirectoryAddress: string
): string => {
  return getContractAddress({
    bytecode: numberToHex(BigInt(getBytecode(fuseFeeDistributorAddress))),
    from: getAddress(fusePoolDirectoryAddress),
    opcode: "CREATE2",
    salt: numberToHex(BigInt(getSaltsHash(from, poolName, marketsCounter))),
  });
};

export const getPoolUnitroller = (poolAddress: string, publicClient: PublicClient) => {
  return getContract({
    address: getAddress(poolAddress),
    abi: UnitrollerAbi,
    publicClient,
  });
};

export const getPoolComptroller = (poolAddress: string, publicClient: PublicClient) => {
  return getContract({
    address: getAddress(poolAddress),
    abi: ComptrollerABI,
    publicClient,
  });
};
