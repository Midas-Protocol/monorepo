import type { NativePricedFuseAsset } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';
import type { BigNumber } from 'ethers';
import { constants, utils } from 'ethers';

import { useXMintAsset } from './useXMintAsset';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useSdk } from '@ui/hooks/fuse/useSdk';
import { fetchTokenBalance } from '@ui/hooks/useTokenBalance';

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
      currentChain?.id,
      xMintAsset?.underlying,
    ],
    async () => {
      if (sdk && address && currentChain && currentSdk) {
        const isXMint = currentChain.id !== chainId;
        const assetToken = isXMint ? xMintAsset?.underlying : asset.underlyingToken;
        const tokenBalance = !assetToken
          ? BigNumber.from(0)
          : await fetchTokenBalance(assetToken, !isXMint ? sdk : currentSdk, address);

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

        const decimals = !isXMint
          ? asset.underlyingDecimals.toNumber()
          : xMintAsset
          ? xMintAsset.decimals
          : 18;
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
