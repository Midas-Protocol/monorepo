import { SupportedChains } from '@midas-capital/types';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ethers } from 'ethers';
import { useMemo } from 'react';

import { config } from '@ui/config/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { TokenData } from '@ui/types/ComponentPropsType';
import { TokensDataMap } from '@ui/types/TokensDataMap';
import { ChainSupportedAssets } from '@ui/utils/networkData';

export const fetchTokenData = async (
  addresses: string[],
  chainId: number
): Promise<TokenData[]> => {
  let data: Partial<TokenData>[] = [];

  const apiAddresses: string[] = [];

  if (addresses.length !== 0) {
    addresses.map(async (address) => {
      const asset = ChainSupportedAssets[chainId as SupportedChains].find(
        (asset) => address === asset.underlying
      );

      if (asset) {
        data.push({
          address: asset.underlying,
          symbol: asset.symbol,
          decimals: asset.decimals,
          name: asset.name,
          logoURL: config.iconServerURL + '/token/96x96/' + asset.symbol.toLowerCase() + '.png',
        });
      } else {
        apiAddresses.push(address);
      }
    });

    if (apiAddresses.length !== 0) {
      const res = await axios.post('/api/tokenData', {
        chain: chainId,
        addresses: apiAddresses,
      });

      data = [...data, ...res.data];
    }
  }

  return data as TokenData[];
};

export const useTokenData = (address: string, chainId?: number) => {
  const validAddress = useMemo(() => {
    if (address) {
      try {
        return ethers.utils.getAddress(address);
      } catch {}
    }

    return undefined;
  }, [address]);

  return useQuery<TokenData | null>(
    ['useTokenData', chainId, validAddress],
    async () => {
      if (chainId && validAddress) {
        const res = await fetchTokenData([validAddress], chainId);

        return res[0];
      } else {
        return null;
      }
    },
    { cacheTime: Infinity, staleTime: Infinity, enabled: !!chainId }
  );
};

export const useTokensDataAsMap = (addresses: string[] = []): TokensDataMap => {
  const { currentChain } = useMultiMidas();

  const { data: tokensData } = useQuery(
    ['useTokensDataAsMap', addresses, currentChain?.id],
    async () => {
      if (addresses && currentChain?.id) {
        return await fetchTokenData(addresses, currentChain.id);
      }
    },
    {
      cacheTime: Infinity,
      staleTime: Infinity,
      enabled: !!addresses && addresses.length !== 0 && !!currentChain?.id,
    }
  );

  return useMemo(() => {
    const ret: TokensDataMap = {};
    if (!tokensData || tokensData.length === 0) return {};

    tokensData.forEach((data) => {
      const _data = data;
      if (_data && _data.address) {
        ret[_data.address] = {
          address: _data.address,
          color: _data.color ?? '',
          decimals: _data.decimals ?? 18,
          logoURL: _data.logoURL ?? '',
          name: _data.name ?? '',
          overlayTextColor: _data.overlayTextColor ?? '',
          symbol: _data.symbol ?? '',
        };
      }
    });

    return ret;
  }, [tokensData]);
};
