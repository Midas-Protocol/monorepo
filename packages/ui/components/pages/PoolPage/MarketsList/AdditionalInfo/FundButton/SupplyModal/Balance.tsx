import { Text } from '@chakra-ui/react';
import { utils } from 'ethers';

import { Column, Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { MarketData } from '@ui/types/TokensDataMap';
import { useMemo } from 'react';
import { ChainSupportedAssets } from '@ui/utils/networkData';
import { SupportedChains } from '@midas-capital/types';
import { tokenFormatter } from '@ui/utils/bigUtils';
import { useXMintAsset } from '@ui/hooks/useXMintAsset';

export const Balance = ({ asset, poolChainId }: { asset: MarketData; poolChainId: number }) => {
  const { currentChain, currentSdk } = useMultiMidas();

  if (!currentChain || !currentSdk) throw new Error('Connect your wallet');
  const xMintAsset = useXMintAsset(asset);

  const { data: myBalance } = useTokenBalance(xMintAsset?.underlying, undefined, currentSdk);
  const { data: myNativeBalance } = useTokenBalance(
    'NO_ADDRESS_HERE_USE_WETH_FOR_ADDRESS',
    undefined,
    currentSdk
  );
  const nativeSymbol = currentChain.nativeCurrency?.symbol;
  const optionToWrap =
    asset.underlyingToken === currentSdk.chainSpecificAddresses.W_TOKEN &&
    myBalance?.isZero() &&
    !myNativeBalance?.isZero();

  return (
    <Column crossAxisAlignment="flex-start" mainAxisAlignment="flex-start" width="100%">
      <Row crossAxisAlignment="center" mainAxisAlignment="flex-end" width="100%">
        <Text mr={2} size="sm">
          Wallet Balance:
        </Text>
        <SimpleTooltip
          label={`${myBalance ? tokenFormatter(myBalance, xMintAsset.decimals) : 0} ${
            xMintAsset.symbol
          }`}
        >
          <Text maxWidth="300px" overflow="hidden" textOverflow={'ellipsis'} whiteSpace="nowrap">
            {myBalance ? tokenFormatter(myBalance, xMintAsset.decimals) : 0} {xMintAsset.symbol}
          </Text>
        </SimpleTooltip>
      </Row>
      {optionToWrap && (
        <Row crossAxisAlignment="center" mainAxisAlignment="flex-end" mt={1} width="100%">
          <Text mr={2}>Native Token Balance:</Text>
          <Text>
            {myNativeBalance ? utils.formatUnits(myNativeBalance, 18) : 0} {nativeSymbol}
          </Text>
        </Row>
      )}
    </Column>
  );
};
