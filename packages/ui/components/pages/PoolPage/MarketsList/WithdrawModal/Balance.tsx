import { HStack, Text } from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';
import { utils } from 'ethers';
import { useEffect, useState } from 'react';

import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { MarketData } from '@ui/types/TokensDataMap';
import { fetchMaxAmount } from '@ui/utils/fetchMaxAmount';

export const Balance = ({ asset }: { asset: MarketData }) => {
  const { currentSdk, currentChain, address } = useMultiMidas();

  if (!currentChain || !currentSdk || !address) throw new Error('Connect your wallet');

  const [availableToWithdraw, setAvailableToWithdraw] = useState('0.0');

  useEffect(() => {
    const func = async () => {
      const max = await fetchMaxAmount(FundOperationMode.WITHDRAW, currentSdk, address, asset);
      setAvailableToWithdraw(utils.formatUnits(max, asset.underlyingDecimals));
    };

    func();
  }, [address, asset, currentSdk]);

  return (
    <HStack width="100%" justifyContent={'flex-end'}>
      <Text size="md" mr={2}>
        Available To Withdraw:
      </Text>
      <SimpleTooltip label={`${availableToWithdraw} ${asset.underlyingSymbol}`}>
        <Text maxWidth="250px" textOverflow={'ellipsis'} whiteSpace="nowrap" overflow="hidden">
          {availableToWithdraw} {asset.underlyingSymbol}
        </Text>
      </SimpleTooltip>
    </HStack>
  );
};
