import { Text } from '@chakra-ui/react';
import { utils } from 'ethers';

import { Column, Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { TokenData } from '@ui/types/ComponentPropsType';
import { getAddress } from 'ethers/lib/utils.js';

export const TokenBalance = ({ asset }: { asset: TokenData }) => {
  const { currentSdk, currentChain } = useMultiMidas();

  if (!currentChain || !currentSdk) throw new Error('Connect your wallet');

  const { data: myBalance } = useTokenBalance(asset.address);
  const { data: myNativeBalance } = useTokenBalance('NO_ADDRESS_HERE_USE_WETH_FOR_ADDRESS');
  const nativeSymbol = currentChain.nativeCurrency?.symbol;
  const optionToWrap =
    getAddress(asset.address) === getAddress(currentSdk.chainSpecificAddresses.W_TOKEN) &&
    myBalance?.isZero() &&
    !myNativeBalance?.isZero();

  return (
    <Column crossAxisAlignment="flex-start" mainAxisAlignment="flex-start" width="100%">
      <Row crossAxisAlignment="center" mainAxisAlignment="flex-end" width="100%">
        <Text mr={2} size="sm">
          Wallet Balance:
        </Text>
        <SimpleTooltip
          label={`${myBalance ? utils.formatUnits(myBalance, asset.decimals) : 0} ${asset.symbol}`}
        >
          <Text maxWidth="300px" overflow="hidden" textOverflow={'ellipsis'} whiteSpace="nowrap">
            {myBalance ? utils.formatUnits(myBalance, asset.decimals) : 0} {asset.symbol}
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
