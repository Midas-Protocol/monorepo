import {
  Box,
  Flex,
  Grid,
  HStack,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMemo } from 'react';

import { PoolStat } from '@ui/components/pages/PoolPage/PoolStats/PoolStat';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { useColors } from '@ui/hooks/useColors';
import { PoolData } from '@ui/types/TokensDataMap';
import { midFormat, midUsdFormatter, smallUsdFormatter, tokenFormatter } from '@ui/utils/bigUtils';
import {
  sortTopBorrowedAssets,
  sortTopLiquidityAssets,
  sortTopSuppliedAssets,
  sortTopUtilizationAssets,
} from '@ui/utils/sorts';

export const PoolStats = ({ poolData }: { poolData: PoolData | null | undefined }) => {
  const [topBorrowedAssets, topSuppliedAssets, topLiquidityAssets, topUtilizationAssets] =
    useMemo(() => {
      if (poolData && poolData.assets.length > 0) {
        return [
          sortTopBorrowedAssets(poolData.assets),
          sortTopSuppliedAssets(poolData.assets),
          sortTopLiquidityAssets(poolData.assets),
          sortTopUtilizationAssets(poolData.assets),
        ];
      } else {
        return [[], [], [], []];
      }
    }, [poolData]);

  const { cPage } = useColors();

  return (
    <Grid
      templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
      gap={4}
      w="100%"
      my={4}
    >
      <Popover trigger="hover">
        <PopoverTrigger>
          <Flex>
            <PoolStat
              label="Total Supply"
              value={poolData ? midUsdFormatter(poolData.totalSuppliedFiat) : undefined}
            />
          </Flex>
        </PopoverTrigger>
        {topSuppliedAssets.length > 0 && topSuppliedAssets[0].totalSupplyFiat > 0 && (
          <PopoverContent p={2} width="fit-content">
            <PopoverArrow
              sx={{
                '--popper-arrow-shadow-color': cPage.primary.borderColor,
              }}
            />
            <PopoverBody>
              <VStack width={'100%'} alignItems="flex-start" spacing={0}>
                <Text fontWeight="bold">Top supplied assets</Text>
                {topSuppliedAssets.slice(0, 3).map((asset, index) => (
                  <Flex key={index}>
                    {asset.totalSupplyFiat > 0 && (
                      <HStack mt={1}>
                        {poolData && (
                          <TokenIcon
                            size="md"
                            address={asset.underlyingToken}
                            chainId={poolData.chainId}
                          />
                        )}
                        <Box ml="3">
                          <Text fontWeight="bold" mt={1}>
                            {smallUsdFormatter(asset.totalSupplyFiat)}
                          </Text>
                          <Text>
                            {tokenFormatter(asset.totalSupply, asset.underlyingDecimals)}{' '}
                            {asset.underlyingSymbol}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                  </Flex>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        )}
      </Popover>
      <Popover trigger="hover">
        <PopoverTrigger>
          <Flex>
            <PoolStat
              label="Total Borrow"
              value={poolData ? midUsdFormatter(poolData?.totalBorrowedFiat) : undefined}
            />
          </Flex>
        </PopoverTrigger>
        {topBorrowedAssets.length > 0 && topBorrowedAssets[0].totalBorrowFiat > 0 && (
          <PopoverContent p={2} width="fit-content">
            <PopoverArrow
              sx={{
                '--popper-arrow-shadow-color': cPage.primary.borderColor,
              }}
            />
            <PopoverBody>
              <VStack width={'100%'} alignItems="flex-start" spacing={0}>
                <Text fontWeight="bold">Top borrowed assets</Text>
                {topBorrowedAssets.slice(0, 3).map((asset, index) => (
                  <Flex key={index}>
                    {asset.totalBorrowFiat > 0 && (
                      <HStack mt={1}>
                        {poolData && (
                          <TokenIcon
                            size="md"
                            address={asset.underlyingToken}
                            chainId={poolData.chainId}
                          />
                        )}
                        <Box ml="3">
                          <Text fontWeight="bold" mt={1}>
                            {smallUsdFormatter(asset.totalBorrowFiat)}
                          </Text>
                          <Text>
                            {tokenFormatter(asset.totalBorrow, asset.underlyingDecimals)}{' '}
                            {asset.underlyingSymbol}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                  </Flex>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        )}
      </Popover>

      <Popover trigger="hover">
        <PopoverTrigger>
          <Flex>
            <PoolStat
              label="Liquidity"
              value={poolData ? midUsdFormatter(poolData?.totalAvailableLiquidityFiat) : undefined}
            />
          </Flex>
        </PopoverTrigger>
        {topLiquidityAssets.length > 0 && topLiquidityAssets[0].liquidityFiat > 0 && (
          <PopoverContent p={2} width="fit-content">
            <PopoverArrow
              sx={{
                '--popper-arrow-shadow-color': cPage.primary.borderColor,
              }}
            />
            <PopoverBody>
              <VStack width={'100%'} alignItems="flex-start" spacing={0}>
                <Text fontWeight="bold">Top liquidity assets</Text>
                {topLiquidityAssets.slice(0, 3).map((asset, index) => (
                  <Flex key={index}>
                    {asset.liquidityFiat > 0 && (
                      <HStack mt={1}>
                        {poolData && (
                          <TokenIcon
                            size="md"
                            address={asset.underlyingToken}
                            chainId={poolData.chainId}
                          />
                        )}
                        <Box ml="3">
                          <Text fontWeight="bold" mt={1}>
                            {smallUsdFormatter(asset.liquidityFiat)}
                          </Text>
                          <Text>
                            {tokenFormatter(asset.liquidity, asset.underlyingDecimals)}{' '}
                            {asset.underlyingSymbol}
                          </Text>
                        </Box>
                      </HStack>
                    )}
                  </Flex>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        )}
      </Popover>

      <Popover trigger="hover">
        <PopoverTrigger>
          <Flex>
            <PoolStat
              label="Utilization"
              value={poolData ? poolData.utilization.toFixed(2) + '%' : undefined}
            />
          </Flex>
        </PopoverTrigger>
        {topUtilizationAssets.length > 0 && topUtilizationAssets[0].utilization > 0 && (
          <PopoverContent p={2} width="fit-content">
            <PopoverArrow
              sx={{
                '--popper-arrow-shadow-color': cPage.primary.borderColor,
              }}
            />
            <PopoverBody>
              <VStack width={'100%'} alignItems="flex-start" spacing={0}>
                <Text fontWeight="bold">Top utilization assets</Text>
                {topUtilizationAssets.slice(0, 3).map((asset, index) => (
                  <Flex key={index}>
                    {asset.utilization > 0 && (
                      <HStack mt={1}>
                        {poolData && (
                          <TokenIcon
                            size="md"
                            address={asset.underlyingToken}
                            chainId={poolData.chainId}
                          />
                        )}
                        <Box ml="3">
                          <Text fontWeight="bold" mt={1}>
                            {midFormat(asset.utilization)}%
                          </Text>
                          <Text>{asset.underlyingSymbol}</Text>
                        </Box>
                      </HStack>
                    )}
                  </Flex>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        )}
      </Popover>
    </Grid>
  );
};
