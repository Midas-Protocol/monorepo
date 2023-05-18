import { HStack, Text, useColorModeValue, VStack } from '@chakra-ui/react';
import type { LeveredPosition } from '@midas-capital/types';
import { useMemo } from 'react';

import { useSdk } from '@ui/hooks/fuse/useSdk';
import { getBlockTimePerMinuteByChainId } from '@ui/utils/networkData';

export const SupplyApy = ({ leverage }: { leverage: LeveredPosition }) => {
  const supplyApyColor = useColorModeValue('#51B2D4', 'cyan');

  const sdk = useSdk(leverage.chainId);
  const supplyAPY = useMemo(() => {
    if (sdk) {
      return sdk.ratePerBlockToAPY(
        leverage.collateral.supplyRatePerBlock,
        getBlockTimePerMinuteByChainId(sdk.chainId)
      );
    }
  }, [sdk, leverage.collateral.supplyRatePerBlock]);

  return (
    <HStack justifyContent="flex-end">
      <VStack alignItems={'flex-end'} spacing={0.5}>
        {supplyAPY !== undefined ? (
          <Text color={supplyApyColor} fontWeight="medium" size="sm" variant="tnumber">
            {supplyAPY.toFixed(2)}%
          </Text>
        ) : null}
      </VStack>
    </HStack>
  );
};
