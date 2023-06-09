import { Flex, HStack, Skeleton, Text, VStack } from '@chakra-ui/react';
import type {
  LeveredCollateral,
  OpenPositionBorrowable,
  SupportedChains,
} from '@midas-capital/types';
import { utils } from 'ethers';

import { MidasBox } from '@ui/components/shared/Box';
import { EllipsisText } from '@ui/components/shared/EllipsisText';
import { useBaseCollateral } from '@ui/hooks/leverage/useBaseCollateral';
import { useCurrentLeverageRatio } from '@ui/hooks/leverage/useCurrentLeverageRatio';
import { useGetNetApy } from '@ui/hooks/leverage/useGetNetApy';
import { useAssets } from '@ui/hooks/useAssets';
import { useRewardsForMarket } from '@ui/hooks/useRewards';
import { useTotalSupplyAPYs } from '@ui/hooks/useTotalSupplyAPYs';
import { smallFormatter } from '@ui/utils/bigUtils';

export const ApyStatus = ({
  borrowAsset,
  chainId,
  collateralAsset,
  leverageValue,
}: {
  borrowAsset: OpenPositionBorrowable;
  chainId: SupportedChains;
  collateralAsset: LeveredCollateral;
  leverageValue: number;
}) => {
  const {
    cToken: collateralCToken,
    symbol: collateralSymbol,
    pool: poolAddress,
    supplyRatePerBlock,
    plugin,
    underlyingToken: collateralUnderlying,
  } = collateralAsset;

  const { cToken: borrowCToken, position } = borrowAsset;

  const { data: allRewards } = useRewardsForMarket({
    asset: {
      cToken: collateralCToken,
      plugin,
    },
    chainId: Number(chainId),
    poolAddress,
  });
  const { data: assetInfos } = useAssets(chainId);
  const { data: totalSupplyApyPerAsset } = useTotalSupplyAPYs(
    [
      {
        cToken: collateralCToken,
        supplyRatePerBlock,
        underlyingSymbol: collateralSymbol,
        underlyingToken: collateralUnderlying,
      },
    ],
    chainId,
    allRewards,
    assetInfos
  );

  const { data: baseCollateral } = useBaseCollateral(position, chainId);
  const { data: currentLeverageRatio } = useCurrentLeverageRatio(position, chainId);

  const { data: currentNetApy, isLoading } = useGetNetApy(
    collateralCToken,
    borrowCToken,
    baseCollateral,
    currentLeverageRatio,
    totalSupplyApyPerAsset && totalSupplyApyPerAsset[collateralCToken] !== undefined
      ? utils.parseUnits(totalSupplyApyPerAsset[collateralCToken].toString())
      : undefined,
    chainId
  );

  const { data: updatedNetApy, isLoading: isUpdating } = useGetNetApy(
    collateralCToken,
    borrowCToken,
    baseCollateral,
    utils.parseUnits(leverageValue.toString()),
    totalSupplyApyPerAsset && totalSupplyApyPerAsset[collateralCToken] !== undefined
      ? utils.parseUnits(totalSupplyApyPerAsset[collateralCToken].toString())
      : undefined,
    chainId
  );

  return (
    <MidasBox py={4} width="100%">
      <Flex height="100%" justifyContent="center">
        <VStack alignItems="flex-start" height="100%" justifyContent="center" spacing={4}>
          <HStack spacing={4}>
            <HStack justifyContent="flex-end" width="90px">
              <Text size="md">Net APY</Text>
            </HStack>
            <HStack>
              {isLoading ? (
                <Skeleton height="20px" width="45px" />
              ) : (
                <EllipsisText
                  maxWidth="300px"
                  tooltip={
                    currentNetApy !== undefined && currentNetApy !== null
                      ? smallFormatter(currentNetApy, true, 18)
                      : ''
                  }
                >
                  <Text>
                    {currentNetApy !== undefined && currentNetApy !== null
                      ? smallFormatter(currentNetApy)
                      : '?'}
                    %
                  </Text>
                </EllipsisText>
              )}
              <Text>➡</Text>
              {isUpdating ? (
                <Skeleton height="20px" width="45px" />
              ) : (
                <EllipsisText
                  maxWidth="300px"
                  tooltip={updatedNetApy ? smallFormatter(updatedNetApy, true, 18) : ''}
                >
                  <Text>
                    {updatedNetApy !== undefined && updatedNetApy !== null
                      ? smallFormatter(updatedNetApy)
                      : '?'}
                    %
                  </Text>
                </EllipsisText>
              )}
            </HStack>
          </HStack>
        </VStack>
      </Flex>
    </MidasBox>
  );
};
