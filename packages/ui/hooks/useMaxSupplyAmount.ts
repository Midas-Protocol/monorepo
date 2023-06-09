import type { NativePricedFuseAsset } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';
import { BigNumber, constants, utils } from 'ethers';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useSdk } from '@ui/hooks/fuse/useSdk';
import { useSupplyCapsDataForAsset } from '@ui/hooks/fuse/useSupplyCapsDataForPool';
import { fetchTokenBalance } from '@ui/hooks/useTokenBalance';
import type { TokenData } from '@ui/types/ComponentPropsType';
import type { MarketData } from '@ui/types/TokensDataMap';

export function useMaxSupplyAmount(
  asset: Pick<NativePricedFuseAsset, 'cToken' | 'underlyingDecimals' | 'underlyingToken'>,
  comptrollerAddress: string,
  chainId: number
) {
  const { address } = useMultiMidas();
  const sdk = useSdk(chainId);
  const { data: supplyCapsDataForAsset } = useSupplyCapsDataForAsset(
    comptrollerAddress,
    asset.cToken,
    chainId
  );

  return useQuery(
    [
      'useMaxSupplyAmount',
      asset.underlyingToken,
      asset.cToken,
      asset.underlyingDecimals,
      comptrollerAddress,
      sdk?.chainId,
      address,
      supplyCapsDataForAsset,
    ],
    async () => {
      if (sdk && address && supplyCapsDataForAsset) {
        const tokenBalance = await fetchTokenBalance(asset.underlyingToken, sdk, address);

        const comptroller = sdk.createComptroller(comptrollerAddress);
        const [supplyCap, isWhitelisted] = await Promise.all([
          comptroller.callStatic.supplyCaps(asset.cToken),
          comptroller.callStatic.isSupplyCapWhitelisted(asset.cToken, address),
        ]);

        let bigNumber: BigNumber;

        // if address isn't in supply cap whitelist and asset has supply cap
        if (!isWhitelisted && supplyCap.gt(constants.Zero)) {
          const availableCap = supplyCap.sub(supplyCapsDataForAsset.nonWhitelistedTotalSupply);

          if (availableCap.lte(tokenBalance)) {
            bigNumber = availableCap;
          } else {
            bigNumber = tokenBalance;
          }
        } else {
          bigNumber = tokenBalance;
        }

        return {
          bigNumber: bigNumber,
          number: Number(utils.formatUnits(bigNumber, asset.underlyingDecimals)),
        };
      } else {
        return null;
      }
    },
    {
      cacheTime: Infinity,
      enabled: !!address && !!asset && !!sdk && !!comptrollerAddress,
      staleTime: Infinity,
    }
  );
}

export function useMaxSupplyTokenAmount(
  asset: MarketData,
  token: TokenData | undefined,
  comptrollerAddress: string,
  chainId: number
) {
  const { address, currentChain, currentSdk } = useMultiMidas();
  const sdk = useSdk(chainId);
  const { data: supplyCapsDataForAsset } = useSupplyCapsDataForAsset(
    comptrollerAddress,
    asset.cToken,
    chainId
  );

  return useQuery(
    [
      'useMaxSupplyTokenAmount',
      asset.cToken,
      token,
      comptrollerAddress,
      sdk?.chainId,
      address,
      currentChain?.id,
      supplyCapsDataForAsset,
    ],
    async () => {
      if (sdk && address && currentChain && currentSdk && token && supplyCapsDataForAsset) {
        const isXMint = currentChain.id !== chainId;
        const assetToken = token.address;

        const tokenBalance = !assetToken
          ? BigNumber.from(0)
          : await fetchTokenBalance(assetToken, !isXMint ? sdk : currentSdk, address);

        const comptroller = sdk.createComptroller(comptrollerAddress);
        const [supplyCap, isWhitelisted] = await Promise.all([
          comptroller.callStatic.supplyCaps(asset.cToken),
          comptroller.callStatic.isSupplyCapWhitelisted(asset.cToken, address),
        ]);

        let availableCap = constants.MaxInt256;

        // if address isn't in supply cap whitelist and asset has supply cap
        if (!isWhitelisted && supplyCap.gt(constants.Zero)) {
          availableCap = supplyCap.sub(supplyCapsDataForAsset.nonWhitelistedTotalSupply);
        }

        const decimals = !isXMint
          ? asset.underlyingDecimals.toNumber()
          : token
          ? token.decimals
          : 18;

        return {
          bigNumber: tokenBalance,
          cap: availableCap,
          decimals,
          number: Number(utils.formatUnits(tokenBalance, decimals)),
        };
      } else {
        return null;
      }
    },
    {
      cacheTime: Infinity,
      enabled: !!address && !!asset && !!sdk && !!comptrollerAddress && !!token,
      staleTime: Infinity,
    }
  );
}
