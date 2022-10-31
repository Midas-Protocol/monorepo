import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Divider, HStack, Link, Text, VStack } from '@chakra-ui/react';
import { FlywheelReward, Reward } from '@midas-capital/types';

import { PopoverTooltip } from '@ui/components/shared/PopoverTooltip';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { MIDAS_DOCS_URL } from '@ui/constants/index';
import { useColors } from '@ui/hooks/useColors';
import { usePluginInfo } from '@ui/hooks/usePluginInfo';

interface RewardsInfoProps {
  reward: Reward;
  chainId: number;
}

export const RewardsInfo = ({ reward, chainId }: RewardsInfoProps) => {
  const { cCard } = useColors();
  const { data: pluginInfo } = usePluginInfo(
    chainId,
    'plugin' in reward ? reward.plugin : undefined
  );
  return (
    <PopoverTooltip
      placement={'top-start'}
      body={
        <>
          {pluginInfo && (
            <>
              <Text>
                This market is using the <b>{pluginInfo?.name}</b> ERC4626 Strategy.
              </Text>
              {pluginInfo?.apyDocsUrl ? (
                <Link
                  href={pluginInfo?.apyDocsUrl}
                  isExternal
                  variant={'color'}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  Vault Details
                </Link>
              ) : (
                <>
                  Read more about it{' '}
                  <Link
                    href={pluginInfo?.strategyDocsUrl || MIDAS_DOCS_URL}
                    isExternal
                    variant={'color'}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    in our Docs <ExternalLinkIcon mx="2px" />
                  </Link>
                </>
              )}

              <Divider my={2} />
            </>
          )}

          <VStack width={'100%'} alignItems={'flex-start'}>
            <HStack justifyContent={'space-between'} width={'100%'}>
              <div>Current APY:</div>
              <div>{`${(reward.apy * 100).toFixed(2) + '%'}`}</div>
            </HStack>

            <HStack justifyContent={'space-between'} width={'100%'}>
              <Text>Updated:</Text>
              <Text>{`${new Date(reward.updated_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}`}</Text>
            </HStack>
          </VStack>
        </>
      }
    >
      <HStack justifyContent={'flex-end'}>
        {(reward as FlywheelReward).token ? (
          <>
            <Text variant="smText" mr={-1}>
              +
            </Text>
            <TokenIcon address={(reward as FlywheelReward).token} chainId={chainId} size="xs" />
          </>
        ) : (
          <Text>+ 🔌</Text>
        )}

        <Text color={cCard.txtColor} title={reward.apy * 100 + '%'} variant="smText">
          {(reward.apy * 100).toFixed(2) + '%'}
        </Text>
      </HStack>
    </PopoverTooltip>
  );
};
