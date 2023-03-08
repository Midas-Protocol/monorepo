import { Box, Divider, Flex, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import { utils } from 'ethers';
import { useMemo } from 'react';

import { UserStat } from '@ui/components/pages/PoolPage/UserStats/UserStat';
import { PopoverTooltip } from '@ui/components/shared/PopoverTooltip';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { FundedAsset } from '@ui/hooks/useAllFundedInfo';
import { useColors } from '@ui/hooks/useColors';
import {
  midUsdFormatter,
  smallFormatter,
  smallUsdFormatter,
  tokenFormatter,
} from '@ui/utils/bigUtils';
import { sortTopUserSuppliedAssets } from '@ui/utils/sorts';

export const UserStats = ({
  assets,
  totalSupplyApyPerAsset,
  totalSupplyBalanceNative,
  totalSupplyBalanceFiat,
}: {
  assets: FundedAsset[];
  totalSupplyApyPerAsset: { [market: string]: number };
  totalSupplyBalanceNative: number;
  totalSupplyBalanceFiat: number;
}) => {
  const [topSuppliedAssets] = useMemo(() => {
    if (assets.length > 0) {
      return [sortTopUserSuppliedAssets(assets)];
    } else {
      return [[]];
    }
  }, [assets]);

  const totalSupplyApy = useMemo(() => {
    if (totalSupplyApyPerAsset) {
      if (totalSupplyBalanceNative === 0)
        return { totalApy: 0, totalSupplied: 0, estimatedUsd: 0, estimatedPerAsset: [] };

      let _totalApy = 0;
      const _estimatedPerAsset: {
        underlying: string;
        symbol: string;
        supplied: string;
        estimated: number;
        apy: number;
        chainId: number;
      }[] = [];

      assets.map((asset) => {
        _totalApy +=
          (totalSupplyApyPerAsset[asset.cToken] * asset.supplyBalanceNative) /
          totalSupplyBalanceNative;

        if (asset.supplyBalanceNative !== 0) {
          const suppliedNum = parseFloat(
            utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals.toNumber())
          );

          _estimatedPerAsset.push({
            underlying: asset.underlyingToken,
            supplied: smallFormatter.format(suppliedNum),
            apy: totalSupplyApyPerAsset[asset.cToken] * 100,
            estimated: totalSupplyApyPerAsset[asset.cToken] * suppliedNum,
            symbol: asset.underlyingSymbol,
            chainId: Number(asset.chainId),
          });
        }
      });

      const _estimatedUsd = totalSupplyBalanceFiat * _totalApy;

      return {
        totalApy: _totalApy * 100,
        totalSupplied: totalSupplyBalanceFiat,
        estimatedUsd: _estimatedUsd,
        estimatedPerAsset: _estimatedPerAsset,
      };
    }

    return undefined;
  }, [assets, totalSupplyBalanceNative, totalSupplyBalanceFiat, totalSupplyApyPerAsset]);

  const { cCard } = useColors();

  return (
    <Grid gap={4} templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)' }} w="100%">
      <PopoverTooltip
        body={
          topSuppliedAssets.length > 0 && topSuppliedAssets[0].supplyBalanceFiat > 0 ? (
            <VStack alignItems="flex-start" spacing={0} width={'100%'}>
              <Text fontWeight="bold">Top supplied assets</Text>
              {topSuppliedAssets.slice(0, 3).map((asset, index) => (
                <Flex key={index}>
                  {asset.supplyBalanceFiat > 0 && (
                    <HStack mt={1}>
                      <TokenIcon
                        address={asset.underlyingToken}
                        chainId={Number(asset.chainId)}
                        size="md"
                      />
                      <Box ml="3">
                        <Text fontWeight="bold" mt={1}>
                          {smallUsdFormatter(asset.supplyBalanceFiat)}
                        </Text>
                        <Text>
                          {tokenFormatter(asset.supplyBalance, asset.underlyingDecimals)}{' '}
                          {asset.underlyingSymbol}
                        </Text>
                      </Box>
                    </HStack>
                  )}
                </Flex>
              ))}
            </VStack>
          ) : null
        }
        contentProps={{ p: 2, width: 'fit-content' }}
        visible={topSuppliedAssets.length > 0 && topSuppliedAssets[0].supplyBalanceFiat > 0}
      >
        <Flex>
          <UserStat label="Your Supply" value={midUsdFormatter(totalSupplyBalanceFiat)} />
        </Flex>
      </PopoverTooltip>

      <PopoverTooltip
        body={
          <VStack alignItems="flex-start">
            <Text fontWeight="bold">Effective Supply APY</Text>
            <Text>
              The expected annual percentage yield(APY) on supplied assets received by this account,
              assuming the current variable interest rates on all supplied assets remains constant
            </Text>
            {totalSupplyApy && totalSupplyApy.estimatedPerAsset.length > 0 ? (
              <VStack pt={2}>
                <Divider bg={cCard.dividerColor} />

                <VStack alignItems="flex-start" pt={2}>
                  {totalSupplyApy.estimatedPerAsset.map((data, index) => {
                    return (
                      <HStack key={index}>
                        <TokenIcon address={data.underlying} chainId={data.chainId} size="sm" />
                        <Text whiteSpace="nowrap">
                          {data.supplied} {data.symbol} at {data.apy.toFixed(2)}% APY yield{' '}
                          <b>
                            {smallFormatter.format(data.estimated)} {data.symbol}/year
                          </b>
                        </Text>
                      </HStack>
                    );
                  })}
                  <Divider bg={cCard.borderColor} />
                  <HStack alignSelf="self-end">
                    <Text whiteSpace="nowrap">
                      {smallFormatter.format(totalSupplyApy.totalSupplied)} USD at{' '}
                      {totalSupplyApy.totalApy.toFixed(2)}% APY yield{' '}
                      <b>{smallFormatter.format(totalSupplyApy.estimatedUsd)} USD/year</b>
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            ) : null}
          </VStack>
        }
        contentProps={{ p: 2, minW: { base: '300px', sm: '350px' } }}
      >
        <Flex>
          <UserStat
            label="Effective Supply APY"
            secondValue={
              totalSupplyApy ? '~ ' + smallUsdFormatter(totalSupplyApy.estimatedUsd) : ''
            }
            value={totalSupplyApy ? totalSupplyApy.totalApy.toFixed(2) + '%' : '-'}
          />
        </Flex>
      </PopoverTooltip>
    </Grid>
  );
};
