import { AvatarGroup, HStack, Text, VStack } from '@chakra-ui/react';
import { useMemo } from 'react';

import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { SHRINK_ASSETS } from '@ui/constants/index';
import { PoolData } from '@ui/types/TokensDataMap';

export const Assets = ({ pool }: { pool: PoolData }) => {
  const tokens = useMemo(() => {
    return pool.underlyingTokens.map((address, index) => ({
      address,
      symbol: pool.underlyingSymbols[index],
    }));
  }, [pool.underlyingSymbols, pool.underlyingTokens]);

  return (
    <VStack alignItems={'flex-start'} px={{ base: 2, lg: 4 }} py={4} width="280px">
      {pool.underlyingTokens.length === 0 ? null : (
        <HStack spacing={0}>
          <AvatarGroup size="sm" max={30}>
            {tokens.slice(0, SHRINK_ASSETS).map((token, i) => (
              <TokenIcon key={i} address={token.address} chainId={pool.chainId} />
            ))}
          </AvatarGroup>
          {tokens.length - SHRINK_ASSETS > 0 && (
            <Text fontWeight="bold" pt={1}>
              +{tokens.length - SHRINK_ASSETS}
            </Text>
          )}
        </HStack>
      )}
    </VStack>
  );
};
