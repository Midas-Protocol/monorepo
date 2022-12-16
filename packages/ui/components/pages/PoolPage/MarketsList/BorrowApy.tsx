import { Text, useColorModeValue, VStack } from '@chakra-ui/react';
import * as React from 'react';

import { MarketData } from '@ui/types/TokensDataMap';

export const BorrowApy = ({
  asset,
  borrowApyPerAsset,
}: {
  asset: MarketData;
  borrowApyPerAsset: { [market: string]: number } | null | undefined;
}) => {
  const borrowApyColor = useColorModeValue('orange.500', 'orange');

  return (
    <VStack alignItems={'flex-end'}>
      {asset.isBorrowPaused ||
      !borrowApyPerAsset ||
      borrowApyPerAsset[asset.cToken] === undefined ? (
        <Text color={borrowApyColor} fontWeight="medium" size="sm" variant="tnumber">
          -
        </Text>
      ) : (
        <Text color={borrowApyColor} fontWeight="medium" size="sm" variant="tnumber">
          {(borrowApyPerAsset[asset.cToken] * 100).toFixed(3)}%
        </Text>
      )}
    </VStack>
  );
};
