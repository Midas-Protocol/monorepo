import { MidasSdk } from '@midas-capital/sdk';
import { useQuery } from '@tanstack/react-query';
import { BigNumber } from 'ethers';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { getCTokenContract } from '@ui/utils/contracts';

export const fetchTokenBalance = async (
  tokenAddress: string,
  currentSdk: MidasSdk,
  address?: string
): Promise<BigNumber> => {
  let balance: BigNumber;

  if (!address) {
    balance = BigNumber.from(0);
  } else {
    const contract = getCTokenContract(tokenAddress, currentSdk);
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
