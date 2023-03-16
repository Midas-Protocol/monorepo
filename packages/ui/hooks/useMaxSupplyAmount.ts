import { NativePricedFuseAsset } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';
import { BigNumber, constants, utils } from 'ethers';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useSdk } from '@ui/hooks/fuse/useSdk';
import { fetchTokenBalance } from '@ui/hooks/useTokenBalance';
import { useXMintAsset } from './useXMintAsset';

export function useMaxSupplyAmount(
  asset: NativePricedFuseAsset,
  comptrollerAddress: string,
  chainId: number
) {
  const { address, currentChain, currentSdk } = useMultiMidas();
  const sdk = useSdk(chainId);
  const xMintAsset = useXMintAsset(asset);

  return useQuery(
    [
      'useMaxSupplyAmount',
      asset.underlyingToken,
      asset.cToken,
      comptrollerAddress,
      asset.totalSupply,
      sdk?.chainId,
      address,
      currentChain.id,
      xMintAsset.underlying,
    ],
    async () => {
      if (sdk && address && currentChain && currentSdk) {
        const isXMint = currentChain.id !== chainId;
        const tokenBalance = !isXMint
          ? await fetchTokenBalance(asset.underlyingToken, sdk, address)
          : await fetchTokenBalance(xMintAsset.underlying, currentSdk, address);

        const comptroller = sdk.createComptroller(comptrollerAddress);
        const supplyCap = await comptroller.callStatic.supplyCaps(asset.cToken);

        let bigNumber: BigNumber;

        // if asset has supply cap
        if (supplyCap.gt(constants.Zero)) {
          const availableCap = supplyCap.sub(asset.totalSupply);

          if (availableCap.lte(tokenBalance)) {
            bigNumber = availableCap;
          } else {
            bigNumber = tokenBalance;
          }
        } else {
          bigNumber = tokenBalance;
        }

        const decimals = !isXMint ? asset.underlyingDecimals : xMintAsset.decimals;
        return {
          bigNumber: bigNumber,
          number: Number(utils.formatUnits(bigNumber, decimals)),
          decimals,
        };
      } else {
        return null;
      }
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled: !!address && !!asset && !!sdk && !!comptrollerAddress && !!xMintAsset,
    }
  );
}
