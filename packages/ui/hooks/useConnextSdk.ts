import { getBridgeAmountOut } from '@connext/chain-abstraction';
import { chainIdToConfig } from 'chains/dist';
import { BigNumber, constants } from 'ethers';
import { formatUnits } from 'ethers/lib/utils.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SupportedAsset } from 'types/dist';

import {
  SUPPORTED_CHAINS_BY_CONNEXT,
  SUPPORTED_CHAINS_XMINT,
  SUPPORTED_SYMBOLS_BY_CONNEXT,
} from '../constants';

import { useMultiMidas } from '@ui/context/MultiMidasContext';
import type { TokenData } from '@ui/types/ComponentPropsType';
import type { MarketData } from '@ui/types/TokensDataMap';

export function useConnextSdk(
  asset: MarketData,

  poolChainId: number
) {
  const { currentChain, connextSdk } = useMultiMidas();

  const [relayerFee, setRelayerFee] = useState<BigNumber>(constants.Zero);

  const swapAssets = useMemo(() => {
    if (asset && currentChain && poolChainId) {
      const xMintSource = SUPPORTED_CHAINS_XMINT[currentChain.id];
      const xMintDestination = SUPPORTED_CHAINS_XMINT[poolChainId];
      const destinationSwapAsset: SupportedAsset | undefined =
        SUPPORTED_SYMBOLS_BY_CONNEXT.includes(asset.underlyingSymbol)
          ? ({
              decimals: asset.underlyingDecimals.toNumber(),
              name: asset.underlyingName,
              symbol: asset.underlyingSymbol,
              underlying: asset.underlyingToken,
            } as SupportedAsset)
          : xMintDestination.usdc ?? xMintDestination.weth;

      if (destinationSwapAsset) {
        const originSwapAsset =
          destinationSwapAsset.symbol === xMintDestination.usdc?.symbol
            ? xMintSource.usdc
            : xMintSource.weth;

        if (originSwapAsset) {
          return {
            destination: destinationSwapAsset,
            origin: originSwapAsset,
          };
        }
      }
    }
    return undefined;
  }, [asset, currentChain, poolChainId]);

  useEffect(() => {
    if (!currentChain || !connextSdk) {
      setRelayerFee(constants.Zero);
    } else {
      const origin = SUPPORTED_CHAINS_BY_CONNEXT[currentChain.id].domainId;
      const destination = SUPPORTED_CHAINS_BY_CONNEXT[poolChainId].domainId;

      // Calculate relayer fee
      const estimateRelayerFeeParams = {
        destinationDomain: destination,
        isHighPriority: true,
        originDomain: origin,
      };
      connextSdk.estimateRelayerFee(estimateRelayerFeeParams).then((res) => {
        setRelayerFee(res);
      });
    }
  }, [connextSdk, currentChain, poolChainId]);

  const estimateSupplyAmount = useCallback(
    async (fromAsset: TokenData, amount: BigNumber) => {
      if (currentChain && fromAsset && !amount.isZero() && swapAssets) {
        const supply = await getBridgeAmountOut(
          {
            amountIn: amount.toString(),
            domainId: SUPPORTED_CHAINS_BY_CONNEXT[currentChain.id].domainId,
            fromAsset: fromAsset.address,
            rpc: chainIdToConfig[currentChain.id].specificParams.metadata.rpcUrls.default.http[0],
            toAsset: swapAssets.origin.underlying,
          },
          {
            amountIn: amount.toString(),
            domainId: SUPPORTED_CHAINS_BY_CONNEXT[poolChainId].domainId,
            fromAsset: swapAssets.destination.underlying,
            rpc: chainIdToConfig[poolChainId].specificParams.metadata.rpcUrls.default.http[0],
            toAsset: asset.underlyingToken,
          },
          swapAssets.origin.decimals,
          swapAssets.destination.decimals
        );
        return {
          bigNumber: BigNumber.from(supply),
          decimals: asset.underlyingDecimals.toString(),
          number: formatUnits(supply, asset.underlyingDecimals),
        };
      }
      return null;
    },
    [asset, currentChain, poolChainId, swapAssets]
  );

  return {
    estimateSupplyAmount,
    relayerFee,
    swapAssets,
  };
}
