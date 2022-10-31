import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import {
  AvatarGroup,
  Box,
  Button,
  Grid,
  GridItem,
  HStack,
  Link,
  Text,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import { Row } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';

import { PoolRowData } from '@ui/components/pages/Fuse/FusePoolsPage/FusePoolList/FusePoolRow/index';
import ClaimPoolRewardsButton from '@ui/components/shared/ClaimPoolRewardsButton';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { usePoolDetails } from '@ui/hooks/fuse/usePoolDetails';
import { useRewardTokensOfPool } from '@ui/hooks/rewards/useRewardTokensOfPool';
import { useCgId } from '@ui/hooks/useChainConfig';
import { useUSDPrice } from '@ui/hooks/useUSDPrice';
import { PoolData } from '@ui/types/TokensDataMap';
import { smallUsdFormatter } from '@ui/utils/bigUtils';
import { getBlockTimePerMinuteByChainId, getScanUrlByChainId } from '@ui/utils/networkData';
import { shortAddress } from '@ui/utils/shortAddress';

export const AdditionalInfo = ({ row }: { row: Row<PoolRowData> }) => {
  const pool: PoolData = row.original.poolName;
  const { getSdk, address } = useMultiMidas();
  const cgId = useCgId(pool.chainId);
  const { data: usdPrice } = useUSDPrice(cgId);
  const rewardTokens = useRewardTokensOfPool(pool.comptroller, pool.chainId);
  const poolDetails = usePoolDetails(pool.assets, pool.chainId);
  const sdk = useMemo(() => getSdk(pool.chainId), [getSdk, pool.chainId]);
  const scanUrl = useMemo(() => getScanUrlByChainId(pool.chainId), [pool.chainId]);
  const [copiedText, setCopiedText] = useState<string>('');
  const { hasCopied, onCopy } = useClipboard(copiedText);

  const topLendingApy = useMemo(() => {
    if (sdk && poolDetails) {
      return sdk
        .ratePerBlockToAPY(
          poolDetails.topLendingAPYAsset.supplyRatePerBlock,
          getBlockTimePerMinuteByChainId(sdk.chainId)
        )
        .toFixed(2);
    }
  }, [sdk, poolDetails]);

  const topBorrowApr = useMemo(() => {
    if (sdk && poolDetails) {
      return sdk
        .ratePerBlockToAPY(
          poolDetails.topBorrowAPRAsset.borrowRatePerBlock,
          getBlockTimePerMinuteByChainId(sdk.chainId)
        )
        .toFixed(2);
    }
  }, [sdk, poolDetails]);

  useEffect(() => {
    if (copiedText) {
      onCopy();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copiedText]);

  useEffect(() => {
    if (!hasCopied) {
      setCopiedText('');
    }
  }, [hasCopied]);

  return (
    <Box>
      <Grid
        templateColumns={{
          base: 'repeat(1, 1fr)',
          lg: 'repeat(2, 1fr)',
        }}
        w="100%"
        gap={4}
        alignItems="stretch"
      >
        <VStack spacing={{ base: 4, lg: 8 }} ml={{ base: 0, lg: 24 }}>
          <Grid
            templateColumns={{
              base: 'repeat(1, 1fr)',
              lg: 'repeat(2, 1fr)',
            }}
            w="100%"
            gap={4}
            alignItems="flex-start"
          >
            <VStack>
              <Text variant="smText" textAlign="center">
                Your Supply Balance
              </Text>
              {address ? (
                <SimpleTooltip label={`$${pool.totalSupplyBalanceFiat.toString()}`}>
                  <Text variant="smText" textAlign="center">
                    {smallUsdFormatter(pool.totalSupplyBalanceFiat)}
                    {pool.totalSupplyBalanceFiat > 0 && pool.totalSupplyBalanceFiat < 0.01 && '+'}
                  </Text>
                </SimpleTooltip>
              ) : (
                <SimpleTooltip label="Connect your wallet">
                  <Text variant="smText" fontWeight="bold" textAlign="center">
                    -
                  </Text>
                </SimpleTooltip>
              )}
            </VStack>
            <VStack>
              <Text variant="smText" textAlign="center">
                Your Borrow Balance
              </Text>
              {address ? (
                <SimpleTooltip label={`$${pool.totalBorrowBalanceFiat.toString()}`}>
                  <Text variant="smText" textAlign="center">
                    {smallUsdFormatter(pool.totalBorrowBalanceFiat)}
                    {pool.totalBorrowBalanceFiat > 0 && pool.totalBorrowBalanceFiat < 0.01 && '+'}
                  </Text>
                </SimpleTooltip>
              ) : (
                <SimpleTooltip label="Connect your wallet">
                  <Text variant="smText" fontWeight="bold" textAlign="center">
                    -
                  </Text>
                </SimpleTooltip>
              )}
            </VStack>
          </Grid>
          <Grid
            templateColumns={{
              base: 'repeat(1, 1fr)',
              lg: 'repeat(2, 1fr)',
            }}
            w="100%"
            gap={4}
            alignItems="flex-start"
          >
            {rewardTokens.length > 0 && (
              <VStack>
                <Text variant="smText" textAlign="center" mr={4}>
                  Offering Rewards
                </Text>
                <AvatarGroup size="sm" max={30}>
                  {rewardTokens.map((token, i) => (
                    <TokenIcon key={i} address={token} chainId={pool.chainId} />
                  ))}
                </AvatarGroup>
              </VStack>
            )}
            <ClaimPoolRewardsButton poolAddress={pool.comptroller} />
          </Grid>
        </VStack>
        <VStack>
          <Grid
            templateColumns={{
              base: 'repeat(13, 1fr)',
              lg: 'repeat(13, 1fr)',
            }}
            w="100%"
            gap={2}
          >
            <GridItem justifyContent="flex-end" colSpan={6} alignSelf="center">
              <Text variant="smText" textAlign="end">
                Most Supplied Asset
              </Text>
            </GridItem>
            <GridItem colSpan={1} textAlign="center">
              {poolDetails?.mostSuppliedAsset ? (
                <TokenIcon
                  address={poolDetails.mostSuppliedAsset.underlyingToken}
                  chainId={pool.chainId}
                  width={35}
                  height={35}
                />
              ) : (
                <Text>-</Text>
              )}
            </GridItem>
            <GridItem colSpan={6} alignSelf="center">
              <Text variant="smText" textAlign="left">
                {poolDetails?.mostSuppliedAsset &&
                  usdPrice &&
                  smallUsdFormatter(poolDetails.mostSuppliedAsset.totalSupplyNative * usdPrice)}
              </Text>
            </GridItem>
          </Grid>
          <Grid
            templateColumns={{
              base: 'repeat(13, 1fr)',
              lg: 'repeat(13, 1fr)',
            }}
            w="100%"
            gap={2}
          >
            <GridItem justifyContent="flex-end" colSpan={6} alignSelf="center">
              <Text variant="smText" textAlign="end">
                Top Lending APY
              </Text>
            </GridItem>
            <GridItem colSpan={1} textAlign="center">
              {poolDetails?.topLendingAPYAsset ? (
                <TokenIcon
                  address={poolDetails.topLendingAPYAsset.underlyingToken}
                  chainId={pool.chainId}
                  width={35}
                  height={35}
                />
              ) : (
                <Text>-</Text>
              )}
            </GridItem>
            <GridItem colSpan={6} alignSelf="center">
              <Text variant="smText" textAlign="left">
                {topLendingApy && `${topLendingApy}% APY`}
              </Text>
            </GridItem>
          </Grid>
          <Grid
            templateColumns={{
              base: 'repeat(13, 1fr)',
              lg: 'repeat(13, 1fr)',
            }}
            w="100%"
            gap={2}
          >
            <GridItem justifyContent="flex-end" colSpan={6} alignSelf="center">
              <Text variant="smText" textAlign="end">
                Top Stable Borrow APR
              </Text>
            </GridItem>
            <GridItem colSpan={1} textAlign="center">
              {poolDetails?.topBorrowAPRAsset ? (
                <TokenIcon
                  address={poolDetails.topBorrowAPRAsset.underlyingToken}
                  chainId={pool.chainId}
                  width={35}
                  height={35}
                />
              ) : (
                <Text>-</Text>
              )}
            </GridItem>
            <GridItem colSpan={6} alignSelf="center">
              <Text variant="smText" textAlign="left">
                {topBorrowApr && `${topBorrowApr}% APR`}
              </Text>
            </GridItem>
          </Grid>
          <Grid
            templateColumns={{
              base: 'repeat(13, 1fr)',
              lg: 'repeat(13, 1fr)',
            }}
            w="100%"
            gap={4}
            py={2}
          >
            <GridItem justifyContent="flex-end" colSpan={6} alignSelf="center">
              <Text variant="smText" textAlign="end">
                Pool Address
              </Text>
            </GridItem>
            <GridItem colSpan={7} textAlign="center">
              {pool.comptroller ? (
                <HStack>
                  <SimpleTooltip label={`${scanUrl}/address/${pool.comptroller}`}>
                    <Button
                      minWidth={6}
                      m={0}
                      p={0}
                      variant="_link"
                      as={Link}
                      href={`${scanUrl}/address/${pool.comptroller}`}
                      isExternal
                      fontSize={{ base: 14, md: 16 }}
                      height="auto"
                    >
                      {shortAddress(pool.comptroller, 6, 4)}
                    </Button>
                  </SimpleTooltip>

                  <Button
                    variant="_link"
                    minW={0}
                    mt="-8px !important"
                    p={0}
                    onClick={() => setCopiedText(pool.comptroller)}
                    fontSize={18}
                    height="auto"
                  >
                    {copiedText === pool.comptroller ? (
                      <SimpleTooltip label="Copied">
                        <CheckIcon />
                      </SimpleTooltip>
                    ) : (
                      <SimpleTooltip label="Click to copy">
                        <CopyIcon />
                      </SimpleTooltip>
                    )}
                  </Button>
                </HStack>
              ) : (
                <Text variant="smText" fontWeight="bold">
                  ?
                </Text>
              )}
            </GridItem>
          </Grid>
        </VStack>
      </Grid>
    </Box>
  );
};
