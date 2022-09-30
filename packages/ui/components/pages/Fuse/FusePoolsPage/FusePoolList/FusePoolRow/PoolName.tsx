import { AvatarGroup, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { FusePoolData } from '@midas-capital/types';
import * as React from 'react';

import { CTokenIcon } from '@ui/components/shared/CTokenIcon';
import { useRewardTokensOfPool } from '@ui/hooks/rewards/useRewardTokensOfPool';

export const PoolName = ({ pool }: { pool: FusePoolData }) => {
  const rewardTokens = useRewardTokensOfPool(pool.comptroller, pool.chainId);

  return (
    <VStack alignItems={'flex-start'} spacing={1} ml={3}>
      <Flex>
        <Text variant="lgText" fontWeight="bold" mt={rewardTokens.length ? 2 : 0} mr={2}>
          {pool.name}
        </Text>
      </Flex>
      {rewardTokens.length && (
        <HStack m={0}>
          <Text>This pool is offering rewards</Text>
          <AvatarGroup size="xs" max={5}>
            {rewardTokens.map((token) => (
              <CTokenIcon key={token} address={token} chainId={pool.chainId} />
            ))}
          </AvatarGroup>
        </HStack>
      )}
    </VStack>
  );
};
