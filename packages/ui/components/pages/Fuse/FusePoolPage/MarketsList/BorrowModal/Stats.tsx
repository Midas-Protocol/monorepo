import { Spinner, Text } from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';
import { BigNumber, constants, utils } from 'ethers';
import { useMemo } from 'react';

import { MidasBox } from '@ui/components/shared/Box';
import { Center, Column, Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import useUpdatedUserAssets from '@ui/hooks/fuse/useUpdatedUserAssets';
import { useBorrowLimit } from '@ui/hooks/useBorrowLimit';
import { MarketData } from '@ui/types/TokensDataMap';
import { smallUsdFormatter } from '@ui/utils/bigUtils';
import { getBlockTimePerMinuteByChainId } from '@ui/utils/networkData';

interface StatsProps {
  assets: MarketData[];
  asset: MarketData;
  amount: BigNumber;
  poolChainId: number;
}

export const Stats = ({ assets, asset, amount, poolChainId }: StatsProps) => {
  const { currentSdk, currentChain } = useMultiMidas();

  if (!currentSdk || !currentChain) throw new Error("SDK doesn't exist!");

  const index = useMemo(() => assets.findIndex((a) => a.cToken === asset.cToken), [assets, asset]);
  const { data: updatedAssets } = useUpdatedUserAssets({
    mode: FundOperationMode.BORROW,
    assets,
    index,
    amount,
    poolChainId,
  });
  const blocksPerMinute = useMemo(
    () => getBlockTimePerMinuteByChainId(currentChain.id),
    [currentChain]
  );
  const updatedAsset = updatedAssets ? updatedAssets[index] : null;
  const borrowLimit = useBorrowLimit(assets, poolChainId);
  const borrowAPR = currentSdk.ratePerBlockToAPY(asset.borrowRatePerBlock, blocksPerMinute);
  const updatedBorrowAPR = currentSdk.ratePerBlockToAPY(
    updatedAsset?.borrowRatePerBlock ?? constants.Zero,
    blocksPerMinute
  );
  const updatedAPYDiffIsLarge = Math.abs(updatedBorrowAPR - borrowAPR) > 0.1;
  const supplyBalanceFrom = utils.commify(
    utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals)
  );

  return (
    <MidasBox width="100%" height="190px" mt={4}>
      {updatedAsset ? (
        <Column
          mainAxisAlignment="space-between"
          crossAxisAlignment="flex-start"
          expand
          py={3}
          px={4}
          fontSize="lg"
        >
          <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
            <Text variant="smText" fontWeight="bold" flexShrink={0}>
              Supply Balance:
            </Text>
            <SimpleTooltip label={`${supplyBalanceFrom} ${asset.underlyingSymbol}`}>
              <Text
                fontWeight="bold"
                flexShrink={0}
                variant={'mdText'}
                maxWidth="250px"
                textOverflow={'ellipsis'}
                whiteSpace="nowrap"
                overflow="hidden"
              >
                {supplyBalanceFrom.slice(0, supplyBalanceFrom.indexOf('.') + 3)}{' '}
                {asset.underlyingSymbol}
              </Text>
            </SimpleTooltip>
          </Row>

          <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
            <Text fontWeight="bold" flexShrink={0} variant="smText">
              Borrow APR:
            </Text>
            <Text fontWeight="bold" variant={updatedAPYDiffIsLarge ? 'xsText' : 'mdText'}>
              {borrowAPR.toFixed(2)}%
              {updatedAPYDiffIsLarge ? (
                <>
                  {' → '}
                  {updatedBorrowAPR.toFixed(2)}%
                </>
              ) : null}
            </Text>
          </Row>

          <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
            <Text fontWeight="bold" flexShrink={0} variant="smText">
              Borrow Limit:
            </Text>
            <Text fontWeight="bold" variant={'mdText'}>
              {smallUsdFormatter(borrowLimit)}
            </Text>
          </Row>

          <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
            <Text fontWeight="bold" variant="smText">
              Debt Balance:
            </Text>
            <Text fontWeight="bold" variant={'mdText'}>
              {smallUsdFormatter(asset.borrowBalanceFiat)}
              {' → '}
              {smallUsdFormatter(updatedAsset.borrowBalanceFiat)}
            </Text>
          </Row>
        </Column>
      ) : (
        <Center height="100%">
          <Spinner />
        </Center>
      )}
    </MidasBox>
  );
};
