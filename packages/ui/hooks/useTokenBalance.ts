import { Web3Provider } from '@ethersproject/providers';
import { MidasSdk } from '@midas-capital/sdk';
import { useQuery } from '@tanstack/react-query';
import { BigNumber, Contract } from 'ethers';
import { erc20ABI } from 'wagmi';

import { useMultiMidas } from '@ui/context/MultiMidasContext';

export const fetchTokenBalance = async (
  tokenAddress: string,
  currentSdk: MidasSdk,
  address?: string
): Promise<BigNumber> => {
  let balance: BigNumber;

  if (!address) {
    balance = BigNumber.from(0);
  } else if (tokenAddress === 'NO_ADDRESS_HERE_USE_WETH_FOR_ADDRESS') {
    balance = await currentSdk.provider.getBalance(address);
  } else {
    const contract = new Contract(tokenAddress, erc20ABI, currentSdk.provider as Web3Provider);
    balance = (await contract.callStatic.balanceOf(address)) as BigNumber;
  }

  return balance;
};

export function useTokenBalance(tokenAddress: string, customAddress?: string) {
  const { currentSdk, currentChain, address } = useMultiMidas();

  const addressToCheck = customAddress ?? address;

  return useQuery(
    ['TokenBalance', currentChain?.id, tokenAddress, addressToCheck, currentSdk?.chainId],
    () => currentSdk && fetchTokenBalance(tokenAddress, currentSdk, addressToCheck),
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled: !!currentChain && !!tokenAddress && !!addressToCheck && !!currentSdk,
    }
  );
}
