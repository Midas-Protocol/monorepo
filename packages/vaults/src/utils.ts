import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';

export const provider = new JsonRpcProvider(process.env.WEB3_HTTP_PROVIDER_URL);

export async function getPools(vaultAddress: string): Promise<ethers.Contract[]> {
  // Initialize the provider and the contracts
  const vault = new ethers.Contract(
    vaultAddress,
    ['function pools() external view returns (address[] memory)'],
    provider
  );
  const poolAbi = [
    'function aprAfterDeposit(int256) external view returns (uint256)',
    'function nav() external view returns (uint256)',
  ];
  return (await vault.pools()).map(
    (poolAddress) => new ethers.Contract(poolAddress, poolAbi, provider)
  );
}
