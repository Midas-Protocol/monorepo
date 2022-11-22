import { Divider, Skeleton, Spinner, Text } from '@chakra-ui/react';
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

interface StatsColumnProps {
  mode: FundOperationMode;
  assets: MarketData[];
  asset: MarketData;
  amount: BigNumber;
  enableAsCollateral?: boolean;
  poolChainId: number;
}
export const StatsColumn = ({
  mode,
  assets,
  asset,
  amount,
  enableAsCollateral = false,
  poolChainId,
}: StatsColumnProps) => {
  const isSupplyingOrWithdrawing = useMemo(
    () => mode === FundOperationMode.SUPPLY || mode === FundOperationMode.WITHDRAW,
    [mode]
  );
  const index = useMemo(() => assets.findIndex((a) => a.cToken === asset.cToken), [assets, asset]);
  // Get the new representation of a user's NativePricedFuseAssets after proposing a supply amount.
  const { data: updatedAssets } = useUpdatedUserAssets({
    mode,
    assets,
    index,
    amount,
    poolChainId,
  });

  const updatedAsset = updatedAssets ? updatedAssets[index] : null;

  const { currentSdk, currentChain } = useMultiMidas();
  if (!currentSdk || !currentChain) throw new Error("SDK doesn't exist!");

  const {
    supplyAPY,
    borrowAPR,
    updatedSupplyAPY,
    updatedBorrowAPR,
    supplyBalanceFrom,
    supplyBalanceTo,
  } = useMemo(() => {
    const blocksPerMinute = getBlockTimePerMinuteByChainId(currentChain.id);
    return {
      supplyAPY: currentSdk.ratePerBlockToAPY(asset.supplyRatePerBlock, blocksPerMinute),
      borrowAPR: currentSdk.ratePerBlockToAPY(asset.borrowRatePerBlock, blocksPerMinute),
      updatedSupplyAPY: updatedAsset
        ? currentSdk.ratePerBlockToAPY(updatedAsset.supplyRatePerBlock, blocksPerMinute)
        : undefined,
      updatedBorrowAPR: updatedAsset
        ? currentSdk.ratePerBlockToAPY(updatedAsset.borrowRatePerBlock, blocksPerMinute)
        : undefined,
      supplyBalanceFrom: utils.commify(
        utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals)
      ),
      supplyBalanceTo: updatedAsset
        ? utils.commify(
            utils.formatUnits(updatedAsset.supplyBalance, updatedAsset.underlyingDecimals)
          )
        : undefined,
    };
  }, [currentChain, updatedAsset, asset, currentChain]);

  // Calculate Old and new Borrow Limits
  const borrowLimit = useBorrowLimit(assets, poolChainId);
  const updatedBorrowLimit = useBorrowLimit(updatedAssets ?? [], poolChainId, {
    ignoreIsEnabledCheckFor: enableAsCollateral ? asset.cToken : undefined,
  });

  return (
    <MidasBox width="100%" mt={4}>
      <Column
        mainAxisAlignment="space-between"
        crossAxisAlignment="flex-start"
        expand
        p={4}
        gap={2}
      >
        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text variant="mdText" fontWeight="bold" flexShrink={0}>
            Market Supply Balance:
          </Text>
          <SimpleTooltip
            label={`${supplyBalanceFrom}${
              isSupplyingOrWithdrawing ? ` → ${supplyBalanceTo} ` : ' '
            }${asset.underlyingSymbol}`}
          >
            <Text
              fontWeight="bold"
              flexShrink={0}
              variant={'mdText'}
              textOverflow={'ellipsis'}
              whiteSpace="nowrap"
              overflow="hidden"
            >
              {supplyBalanceFrom.slice(0, supplyBalanceFrom.indexOf('.') + 3)}
              {' ' + asset.underlyingSymbol}
              <>
                {' → '}
                {supplyBalanceTo ? (
                  supplyBalanceTo.slice(0, supplyBalanceTo.indexOf('.') + 3)
                ) : (
                  <Skeleton display="inline">
                    {supplyBalanceFrom.slice(0, supplyBalanceFrom.indexOf('.') + 3)}
                  </Skeleton>
                )}
                {' ' + asset.underlyingSymbol}
              </>
            </Text>
          </SimpleTooltip>
        </Row>
        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text fontWeight="bold" variant="mdText">
            Total Debt Balance:
          </Text>
          <Text fontWeight="bold" variant={'mdText'}>
            {smallUsdFormatter(asset.borrowBalanceFiat)}

            <>
              {' → '}
              {updatedAsset?.borrowBalanceFiat ? (
                smallUsdFormatter(updatedAsset.borrowBalanceFiat)
              ) : (
                <Skeleton display="inline">xx.xx</Skeleton>
              )}
            </>
          </Text>
        </Row>
        <Divider />
        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text fontWeight="bold" flexShrink={0} variant="mdText">
            Total Borrow Limit:
          </Text>
          <Text fontWeight="bold" variant={'mdText'}>
            {smallUsdFormatter(borrowLimit)}

            {' → '}
            {smallUsdFormatter(updatedBorrowLimit)}
          </Text>
        </Row>
        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text fontWeight="bold" flexShrink={0} variant="mdText">
            Market Borrow Limit:
          </Text>
          <Text fontWeight="bold" variant={'mdText'}>
            {smallUsdFormatter(borrowLimit)}

            {' → '}
            {smallUsdFormatter(updatedBorrowLimit)}
          </Text>
        </Row>
        <Divider />
        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text fontWeight="bold" flexShrink={0} variant="mdText">
            Market Supply APY:
          </Text>
          <Text fontWeight="bold" variant={'mdText'}>
            {supplyAPY.toFixed(2) + '%'}

            <>
              {' → '}
              {updatedSupplyAPY ? (
                updatedSupplyAPY.toFixed(2) + '%'
              ) : (
                <Skeleton display="inline">x.xx</Skeleton>
              )}
            </>
          </Text>
        </Row>

        <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
          <Text fontWeight="bold" flexShrink={0} variant="mdText">
            Market Borrow APR:
          </Text>
          <Text fontWeight="bold" variant={'mdText'}>
            {borrowAPR.toFixed(2) + '%'}

            <>
              {' → '}
              {updatedBorrowAPR ? (
                updatedBorrowAPR.toFixed(2) + '%'
              ) : (
                <Skeleton display="inline">xx.xxx</Skeleton>
              )}
            </>
          </Text>
        </Row>
      </Column>
    </MidasBox>
  );
};
