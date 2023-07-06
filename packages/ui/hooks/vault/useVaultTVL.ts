import type { MidasSdk } from '@ionicprotocol/sdk';
import { useQuery } from '@tanstack/react-query';
import { constants, utils } from 'ethers';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useAllUsdPrices } from '@ui/hooks/useAllUsdPrices';

export const fetchVaultNumberTVL = async (midasSdk: MidasSdk) => {
  const optimizedVaultsRegistry = midasSdk.createOptimizedVaultsRegistry();
  const vaultsData = await optimizedVaultsRegistry.callStatic.getVaultsData();
  const tvlNative = vaultsData.reduce(
    (tvl, vault) => (tvl = tvl.add(vault.estimatedTotalAssets)),
    constants.Zero
  );
  const decimals = midasSdk.chainSpecificParams.metadata.wrappedNativeCurrency.decimals;

  return Number(utils.formatUnits(tvlNative, decimals));
};

type CrossChainVaultTVL = Map<
  string,
  {
    logo: string;
    name: string;
    value: number;
  }
>;

export const useVaultTVL = () => {
  const { sdks } = useMultiMidas();
  const { data: prices, isLoading, error } = useAllUsdPrices();

  return useQuery<CrossChainVaultTVL | null | undefined>(
    [
      'useVaultTVL',
      prices && Object.values(prices).sort(),
      isLoading,
      sdks.map((sdk) => sdk.chainId).sort(),
    ],
    async () => {
      if (!isLoading && error) throw new Error('Could not get USD price');
      if (!isLoading && prices) {
        const chainVaultTVLs: CrossChainVaultTVL = new Map();
        await Promise.all(
          sdks.map(async (sdk) => {
            try {
              chainVaultTVLs.set(sdk.chainId.toString(), {
                logo: sdk.chainSpecificParams.metadata.img,
                name: sdk.chainSpecificParams.metadata.name,
                value: (await fetchVaultNumberTVL(sdk)) * prices[sdk.chainId.toString()].value,
              });
            } catch (e) {
              console.warn(`Unable to fetch TVL for chain ${sdk.chainId}`, e);
            }
          })
        );

        const sortedChainVaultTVLs = new Map(
          [...chainVaultTVLs].sort((a, b) => b[1].value - a[1].value)
        );

        return sortedChainVaultTVLs;
      }

      return null;
    },
    { cacheTime: Infinity, enabled: !!prices && !isLoading, staleTime: Infinity }
  );
};
