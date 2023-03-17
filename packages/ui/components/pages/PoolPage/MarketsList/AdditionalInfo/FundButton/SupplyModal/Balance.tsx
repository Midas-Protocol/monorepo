import { Text } from '@chakra-ui/react';
import { utils } from 'ethers';

import { Column, Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { useXMintAsset } from '@ui/hooks/useXMintAsset';
import { MarketData } from '@ui/types/TokensDataMap';
import { tokenFormatter } from '@ui/utils/bigUtils';

export const Balance = ({ asset }: { asset: MarketData }) => {
  const { currentChain, currentSdk } = useMultiMidas();

  if (!currentChain || !currentSdk) throw new Error('Connect your wallet');
  const xMintAsset = useXMintAsset(asset);
  const xMintAssetDecimals = xMintAsset?.decimals ?? 18;
  const xMintAssetSymbol = xMintAsset?.symbol ?? '';

  const { data: myBalance } = useTokenBalance(xMintAsset?.underlying ?? '', undefined, currentSdk);
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
          label={`${
            myBalance ? tokenFormatter(myBalance, xMintAssetDecimals) : 0
          } ${xMintAssetSymbol}`}
        >
          <Text maxWidth="300px" overflow="hidden" textOverflow={'ellipsis'} whiteSpace="nowrap">
            {myBalance ? tokenFormatter(myBalance, xMintAssetDecimals) : 0} {xMintAssetSymbol}
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
