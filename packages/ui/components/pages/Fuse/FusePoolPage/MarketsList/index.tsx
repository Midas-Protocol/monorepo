import { ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  HStack,
  Input,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { FlywheelMarketRewardsInfo } from '@midas-capital/sdk/dist/cjs/src/modules/Flywheel';
import {
  ColumnDef,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingFn,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';
import { Fragment, useEffect, useMemo, useState } from 'react';

import { AdditionalInfo } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/AdditionalInfo';
import { BorrowApy } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/BorrowApy';
import { BorrowBalance } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/BorrowBalance';
import { Collateral } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/Collateral';
import { Liquidity } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/Liquidity';
import { SupplyApy } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/SupplyApy';
import { SupplyBalance } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/SupplyBalance';
import { TokenName } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/TokenName';
import { CButton, CIconButton } from '@ui/components/shared/Button';
import { GlowingBox } from '@ui/components/shared/GlowingBox';
import { PopoverTooltip } from '@ui/components/shared/PopoverTooltip';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import {
  ALL,
  BORROWABLE,
  COLLATERAL,
  DEPRECATED,
  DOWN_LIMIT,
  MARKETS_COUNT_PER_PAGE,
  PROTECTED,
  REWARDS,
  SEARCH,
  UP_LIMIT,
} from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useSdk } from '@ui/hooks/fuse/useSdk';
import { useAssetsClaimableRewards } from '@ui/hooks/rewards/useAssetClaimableRewards';
import { useTotalApy } from '@ui/hooks/useApy';
import { useColors } from '@ui/hooks/useColors';
import { useDebounce } from '@ui/hooks/useDebounce';
import { useIsMobile, useIsSemiSmallScreen } from '@ui/hooks/useScreenSize';
import { MarketData } from '@ui/types/TokensDataMap';
import { smallUsdFormatter } from '@ui/utils/bigUtils';
import { getBlockTimePerMinuteByChainId } from '@ui/utils/networkData';
import { sortAssets } from '@ui/utils/sorts';

export type Market = {
  market: MarketData;
  supplyApy: MarketData;
  supplyBalance: MarketData;
  collateral: MarketData;
  borrowApy: MarketData;
  borrowBalance: MarketData;
  liquidity: MarketData;
};

export const MarketsList = ({
  assets,
  rewards = [],
  comptrollerAddress,
  supplyBalanceFiat,
  borrowBalanceFiat,
  poolChainId,
}: {
  assets: MarketData[];
  rewards?: FlywheelMarketRewardsInfo[];
  comptrollerAddress: string;
  supplyBalanceFiat: number;
  borrowBalanceFiat: number;
  poolChainId: number;
}) => {
  const sdk = useSdk(poolChainId);
  const { address } = useMultiMidas();

  const { data: allClaimableRewards } = useAssetsClaimableRewards({
    poolAddress: comptrollerAddress,
    assetsAddress: assets.map((asset) => asset.cToken),
  });

  const [collateralCounts, protectedCounts, borrowableCounts, deprecatedCounts] = useMemo(() => {
    const availableAssets = assets.filter(
      (asset) => !asset.isSupplyPaused || (asset.isSupplyPaused && asset.supplyBalanceFiat !== 0)
    );
    return [
      availableAssets.filter((asset) => asset.membership).length,
      availableAssets.filter((asset) => asset.isBorrowPaused && !asset.isSupplyPaused).length,
      availableAssets.filter((asset) => !asset.isBorrowPaused).length,
      availableAssets.filter((asset) => asset.isBorrowPaused && asset.isSupplyPaused).length,
    ];
  }, [assets]);

  const { data: totalApy } = useTotalApy(rewards, assets, poolChainId);

  const assetFilter: FilterFn<Market> = (row, columnId, value) => {
    if (
      !searchText ||
      (value.includes(SEARCH) &&
        (row.original.market.underlyingName.toLowerCase().includes(searchText.toLowerCase()) ||
          row.original.market.underlyingSymbol.toLowerCase().includes(searchText.toLowerCase()) ||
          row.original.market.cToken.toLowerCase().includes(searchText.toLowerCase())))
    ) {
      if (
        value.includes(ALL) ||
        (value.includes(REWARDS) &&
          allClaimableRewards &&
          allClaimableRewards[row.original.market.cToken]) ||
        (value.includes(COLLATERAL) && row.original.market.membership) ||
        (value.includes(PROTECTED) &&
          row.original.market.isBorrowPaused &&
          !row.original.market.isSupplyPaused) ||
        (value.includes(BORROWABLE) && !row.original.market.isBorrowPaused) ||
        (value.includes(DEPRECATED) &&
          row.original.market.isBorrowPaused &&
          row.original.market.isSupplyPaused)
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  };

  const assetSort: SortingFn<Market> = (rowA, rowB, columnId) => {
    if (!sdk) return 0;

    if (columnId === 'market') {
      return rowB.original.market.underlyingSymbol.localeCompare(
        rowA.original.market.underlyingSymbol
      );
    } else if (columnId === 'supplyApy') {
      const rowASupplyAPY = totalApy ? totalApy[rowA.original.market.cToken] : 0;
      const rowBSupplyAPY = totalApy ? totalApy[rowB.original.market.cToken] : 0;
      return rowASupplyAPY > rowBSupplyAPY ? 1 : -1;
    } else if (columnId === 'borrowApy') {
      const rowABorrowAPY = !rowA.original.market.isBorrowPaused
        ? sdk.ratePerBlockToAPY(
            rowA.original.market.borrowRatePerBlock,
            getBlockTimePerMinuteByChainId(poolChainId)
          )
        : -1;
      const rowBBorrowAPY = !rowB.original.market.isBorrowPaused
        ? sdk.ratePerBlockToAPY(
            rowB.original.market.borrowRatePerBlock,
            getBlockTimePerMinuteByChainId(poolChainId)
          )
        : -1;
      return rowABorrowAPY > rowBBorrowAPY ? 1 : -1;
    } else if (columnId === 'supplyBalance') {
      return rowA.original.market.supplyBalanceFiat > rowB.original.market.supplyBalanceFiat
        ? 1
        : -1;
    } else if (columnId === 'borrowBalance') {
      return rowA.original.market.borrowBalanceFiat > rowB.original.market.borrowBalanceFiat
        ? 1
        : -1;
    } else if (columnId === 'liquidity') {
      return rowA.original.market.liquidityFiat > rowB.original.market.liquidityFiat ? 1 : -1;
    } else if (columnId === 'collateral') {
      return rowA.original.market.membership ? 1 : -1;
    } else {
      return 0;
    }
  };

  const data: Market[] = useMemo(() => {
    const availableAssets = assets.filter(
      (asset) => !asset.isSupplyPaused || (asset.isSupplyPaused && asset.supplyBalanceFiat !== 0)
    );
    return sortAssets(availableAssets).map((asset) => {
      return {
        market: asset,
        supplyApy: asset,
        supplyBalance: asset,
        collateral: asset,
        borrowApy: asset,
        borrowBalance: asset,
        liquidity: asset,
      };
    });
  }, [assets]);

  const columns: ColumnDef<Market>[] = useMemo(() => {
    return [
      {
        accessorKey: 'market',
        header: () => (
          <Text variant="smText" fontWeight="bold" py={2}>
            Market / LTV
          </Text>
        ),
        cell: ({ getValue }) => (
          <TokenName
            asset={getValue<MarketData>()}
            poolAddress={comptrollerAddress}
            poolChainId={poolChainId}
          />
        ),
        footer: (props) => props.column.id,
        filterFn: assetFilter,
        sortingFn: assetSort,
      },
      {
        accessorFn: (row) => row.supplyApy,
        id: 'supplyApy',
        cell: ({ getValue }) => (
          <SupplyApy asset={getValue<MarketData>()} rewards={rewards} poolChainId={poolChainId} />
        ),
        header: () => (
          <Box py={2} textAlign="end" alignItems="end">
            <Text variant="smText" fontWeight="bold" lineHeight={5}>
              Supply APY
            </Text>
          </Box>
        ),
        footer: (props) => props.column.id,
        sortingFn: assetSort,
        enableSorting: !!totalApy,
      },
      {
        accessorFn: (row) => row.borrowApy,
        id: 'borrowApy',
        cell: ({ getValue }) => (
          <BorrowApy asset={getValue<MarketData>()} poolChainId={poolChainId} />
        ),
        header: () => (
          <Box py={2} textAlign="end" alignItems="end">
            <Text variant="smText" fontWeight="bold" lineHeight={5}>
              Borrow APY
            </Text>
          </Box>
        ),
        footer: (props) => props.column.id,
        sortingFn: assetSort,
      },
      {
        accessorFn: (row) => row.supplyBalance,
        id: 'supplyBalance',
        cell: ({ getValue }) => (
          <SupplyBalance asset={getValue<MarketData>()} poolChainId={poolChainId} />
        ),
        header: () => (
          <VStack py={2} textAlign="end" alignItems="end" spacing={0}>
            <Text variant="smText" fontWeight="bold" lineHeight={5}>
              Supply
            </Text>
            <Text variant="smText" fontWeight="bold" lineHeight={5}>
              Balance
            </Text>
          </VStack>
        ),
        footer: (props) => props.column.id,
        sortingFn: assetSort,
      },
      {
        accessorFn: (row) => row.borrowBalance,
        id: 'borrowBalance',
        cell: ({ getValue }) => (
          <BorrowBalance asset={getValue<MarketData>()} poolChainId={poolChainId} />
        ),
        header: () => (
          <VStack py={2} textAlign="end" alignItems="end" spacing={0}>
            <Text variant="smText" fontWeight="bold" lineHeight={5}>
              Borrow
            </Text>
            <Text variant="smText" fontWeight="bold" lineHeight={5}>
              Balance
            </Text>
          </VStack>
        ),
        footer: (props) => props.column.id,
        sortingFn: assetSort,
      },
      {
        accessorFn: (row) => row.liquidity,
        id: 'liquidity',
        cell: ({ getValue }) => (
          <Liquidity asset={getValue<MarketData>()} poolChainId={poolChainId} />
        ),
        header: () => (
          <Text textAlign="end" py={2} variant="smText" fontWeight="bold">
            Liquidity
          </Text>
        ),
        footer: (props) => props.column.id,
        sortingFn: assetSort,
      },
      {
        accessorFn: (row) => row.collateral,
        id: 'collateral',
        cell: ({ getValue }) => (
          <Collateral
            asset={getValue<MarketData>()}
            comptrollerAddress={comptrollerAddress}
            poolChainId={poolChainId}
          />
        ),
        header: () => (
          <Text py={2} variant="smText" fontWeight="bold">
            Collateral
          </Text>
        ),
        footer: (props) => props.column.id,
        sortingFn: assetSort,
        // enableSorting: false,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rewards, comptrollerAddress, totalApy]);

  const [sorting, setSorting] = useState<SortingState>([{ id: 'market', desc: true }]);
  const [pagination, onPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MARKETS_COUNT_PER_PAGE[0],
  });
  const isMobile = useIsMobile();
  const isSemiSmallScreen = useIsSemiSmallScreen();

  const [globalFilter, setGlobalFilter] = useState<string[]>([ALL]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [searchText, setSearchText] = useState('');

  const table = useReactTable({
    columns,
    data,
    getRowCanExpand: () => true,
    getColumnCanGlobalFilter: () => true,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: onPagination,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    getExpandedRowModel: getExpandedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: assetFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      pagination,
      globalFilter,
      columnVisibility,
    },
  });

  useEffect(() => {
    if (isMobile) {
      table.getColumn('collateral').toggleVisibility(false);
    } else {
      table.getColumn('collateral').toggleVisibility(true);
    }
  }, [isMobile, table]);

  useEffect(() => {
    if (address) {
      table.getColumn('supplyBalance').toggleVisibility(true);
      table.getColumn('borrowBalance').toggleVisibility(true);
    } else {
      table.getColumn('supplyBalance').toggleVisibility(false);
      table.getColumn('borrowBalance').toggleVisibility(false);
    }
  }, [address, table]);

  const { cCard } = useColors();

  const onFilter = (filter: string) => {
    if (globalFilter.includes(SEARCH)) {
      setGlobalFilter([filter, SEARCH]);
    } else {
      setGlobalFilter([filter]);
    }
  };

  const onSearchFiltered = () => {
    if (searchText) {
      setGlobalFilter([...globalFilter, SEARCH]);
    } else {
      setGlobalFilter(globalFilter.filter((f) => f !== SEARCH));
    }
  };

  useEffect(() => {
    onSearchFiltered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  return (
    <Box>
      <Flex
        px="4"
        mt={6}
        justifyContent="space-between"
        flexDirection={{ base: 'column', sm: 'row' }}
        gap={4}
      >
        <Flex flexDirection={{ base: 'column', lg: 'row' }} gap={{ base: 4, lg: 8 }}>
          <HStack>
            <Text variant="mdText" width="max-content">
              Your Supply Balance :
            </Text>
            <SimpleTooltip
              label={supplyBalanceFiat.toString()}
              isDisabled={supplyBalanceFiat === DOWN_LIMIT || supplyBalanceFiat > UP_LIMIT}
            >
              <Text variant="lgText" fontWeight="bold">
                {smallUsdFormatter(supplyBalanceFiat)}
                {supplyBalanceFiat > DOWN_LIMIT && supplyBalanceFiat < UP_LIMIT && '+'}
              </Text>
            </SimpleTooltip>
          </HStack>
          <HStack>
            <Text variant="mdText" width="max-content">
              Your Borrow Balance :
            </Text>
            <SimpleTooltip
              label={borrowBalanceFiat.toString()}
              isDisabled={borrowBalanceFiat === DOWN_LIMIT || borrowBalanceFiat > UP_LIMIT}
            >
              <Text variant="lgText" fontWeight="bold">
                {smallUsdFormatter(borrowBalanceFiat)}
                {borrowBalanceFiat > DOWN_LIMIT && borrowBalanceFiat < UP_LIMIT && '+'}
              </Text>
            </SimpleTooltip>
          </HStack>
        </Flex>
      </Flex>
      <Flex
        justifyContent="space-between"
        px="4"
        py="8"
        flexDirection={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Flex className="pagination" flexDirection={{ base: 'column', lg: 'row' }} gap={4}>
          <Text paddingTop="2px" variant="title">
            Assets
          </Text>
          <ButtonGroup
            isAttached={!isSemiSmallScreen ? true : false}
            gap={isSemiSmallScreen ? 2 : 0}
            spacing={0}
            flexFlow={'row wrap'}
            justifyContent="flex-start"
          >
            <CButton
              isSelected={globalFilter.includes(ALL)}
              onClick={() => onFilter(ALL)}
              disabled={data.length === 0}
              variant="filter"
            >
              <PopoverTooltip
                body={
                  <VStack alignItems="flex-start" whiteSpace="pre-wrap">
                    <Text variant="mdText">All Assets</Text>
                    <Text variant="smText">Assets that are available in this pool.</Text>
                    <Text variant="smText">Click to filter</Text>
                  </VStack>
                }
                width="100%"
                height="100%"
              >
                <Center
                  width="100%"
                  height="100%"
                  fontWeight="bold"
                  pt="2px"
                >{`${data.length} All`}</Center>
              </PopoverTooltip>
            </CButton>
            {allClaimableRewards && Object.keys(allClaimableRewards).length !== 0 && (
              <Button
                variant={globalFilter.includes(REWARDS) ? 'ghost' : 'outline'}
                colorScheme="whatsapp"
                onClick={() => onFilter(REWARDS)}
                p={0}
                borderWidth={globalFilter.includes(REWARDS) ? 0 : 2}
                mr="-px"
                width="115px"
              >
                <PopoverTooltip
                  body={
                    <VStack alignItems="flex-start" whiteSpace="pre-wrap">
                      <Text variant="mdText" fontWeight="bold">
                        Rewards Asset
                      </Text>
                      <Text variant="smText">Assets that have rewards.</Text>
                      <Text variant="smText">Click to filter</Text>
                    </VStack>
                  }
                  width="100%"
                  height="100%"
                >
                  {globalFilter.includes(REWARDS) ? (
                    <Center width="100%" height="100%">
                      <GlowingBox
                        height="100%"
                        width="100%"
                        borderRadius={isSemiSmallScreen ? 'xl' : 0}
                        pt="11px"
                        px={4}
                      >
                        <Text fontSize="md" color={cCard.txtColor}>
                          {`${
                            (allClaimableRewards && Object.keys(allClaimableRewards).length) || 0
                          } Rewards`}
                        </Text>
                      </GlowingBox>
                    </Center>
                  ) : (
                    <Center
                      width="100%"
                      height="100%"
                      fontWeight="bold"
                      borderRadius="xl"
                      pt="2px"
                      px={4}
                    >
                      {`${
                        (allClaimableRewards && Object.keys(allClaimableRewards).length) || 0
                      } Rewards`}
                    </Center>
                  )}
                </PopoverTooltip>
              </Button>
            )}
            {collateralCounts !== 0 && (
              <Button
                variant={globalFilter.includes(COLLATERAL) ? 'solid' : 'outline'}
                colorScheme="cyan"
                onClick={() => onFilter(COLLATERAL)}
                width="125px"
                mr="-px"
                borderWidth="2px"
              >
                <PopoverTooltip
                  body={
                    <VStack alignItems="flex-start" whiteSpace="pre-wrap">
                      <Text variant="mdText">Collateral Asset</Text>
                      <Text variant="smText">
                        Assets that can be deposited as collateral to borrow other assets.
                      </Text>
                      <Text variant="smText">Click to filter</Text>
                    </VStack>
                  }
                  width="100%"
                  height="100%"
                >
                  <Center
                    width="100%"
                    height="100%"
                    fontWeight="bold"
                    pt="2px"
                  >{`${collateralCounts} Collateral`}</Center>
                </PopoverTooltip>
              </Button>
            )}
            {borrowableCounts !== 0 && (
              <Button
                variant={globalFilter.includes(BORROWABLE) ? 'solid' : 'outline'}
                colorScheme="orange"
                onClick={() => onFilter(BORROWABLE)}
                width="135px"
                p={0}
                mr="-px"
                borderWidth="2px"
              >
                <PopoverTooltip
                  body={
                    <VStack alignItems="flex-start" whiteSpace="pre-wrap">
                      <Text variant="mdText">Borrowable Asset</Text>
                      <Text variant="smText">Assets that can be borrowed.</Text>
                      <Text variant="smText">Click to filter</Text>
                    </VStack>
                  }
                  width="100%"
                  height="100%"
                >
                  <Center
                    width="100%"
                    height="100%"
                    pt="2px"
                    fontWeight="bold"
                  >{`${borrowableCounts} Borrowable`}</Center>
                </PopoverTooltip>
              </Button>
            )}
            {protectedCounts !== 0 && (
              <Button
                variant={globalFilter.includes(PROTECTED) ? 'solid' : 'outline'}
                colorScheme="purple"
                onClick={() => onFilter(PROTECTED)}
                width="125px"
                mr="-px"
                borderWidth="2px"
              >
                <PopoverTooltip
                  body={
                    <VStack alignItems="flex-start" whiteSpace="pre-wrap">
                      <Text variant="mdText">Protected Asset</Text>
                      <Text variant="smText">Assets that cannot be borrowed.</Text>
                      <Text variant="smText">Click to filter</Text>
                    </VStack>
                  }
                  width="100%"
                  height="100%"
                >
                  <Center
                    fontWeight="bold"
                    width="100%"
                    height="100%"
                    pt="2px"
                  >{`${protectedCounts} Protected`}</Center>
                </PopoverTooltip>
              </Button>
            )}
            {deprecatedCounts !== 0 && (
              <CButton
                isSelected={globalFilter.includes(DEPRECATED)}
                variant="filter"
                color="gray"
                onClick={() => onFilter(DEPRECATED)}
                width="140px"
                borderWidth="2px"
              >
                <PopoverTooltip
                  body={
                    <VStack alignItems="flex-start" whiteSpace="pre-wrap">
                      <Text variant="mdText">Deprecated Asset</Text>
                      <Text variant="smText">Assets that cannot be supplied and borrowed.</Text>
                      <Text variant="smText">Click to filter</Text>
                    </VStack>
                  }
                  width="100%"
                  height="100%"
                >
                  <Center
                    fontWeight="bold"
                    width="100%"
                    height="100%"
                    pt="2px"
                    whiteSpace="nowrap"
                  >{`${deprecatedCounts} Deprecated`}</Center>
                </PopoverTooltip>
              </CButton>
            )}
          </ButtonGroup>
        </Flex>
        <Flex className="searchAsset" justifyContent="flex-start" alignItems="flex-end">
          <ControlledSearchInput onUpdate={(searchText) => setSearchText(searchText)} />
        </Flex>
      </Flex>
      <Table>
        <Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Tr
              key={headerGroup.id}
              borderColor={cCard.dividerColor}
              borderBottomWidth={1}
              borderTopWidth={2}
            >
              {headerGroup.headers.map((header) => {
                return (
                  <Th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    border="none"
                    color={cCard.txtColor}
                    textTransform="capitalize"
                    py={2}
                    cursor="pointer"
                    px={{ base: 2, lg: 4 }}
                  >
                    <HStack
                      gap={0}
                      justifyContent={
                        header.index === 0
                          ? 'flex-start'
                          : header.column.id === 'collateral'
                          ? 'center'
                          : 'flex-end'
                      }
                    >
                      <Box width={3} mb={1}>
                        <Box hidden={header.column.getIsSorted() ? false : true}>
                          {header.column.getIsSorted() === 'desc' ? (
                            <ArrowDownIcon aria-label="sorted descending" />
                          ) : (
                            <ArrowUpIcon aria-label="sorted ascending" />
                          )}
                        </Box>
                      </Box>
                      <>{flexRender(header.column.columnDef.header, header.getContext())}</>
                    </HStack>
                  </Th>
                );
              })}
            </Tr>
          ))}
        </Thead>
        <Tbody>
          {table.getRowModel().rows && table.getRowModel().rows.length !== 0 ? (
            table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <Tr
                  key={row.id}
                  borderColor={cCard.dividerColor}
                  borderBottomWidth={row.getIsExpanded() ? 0 : 1}
                  background={row.getIsExpanded() ? cCard.hoverBgColor : cCard.bgColor}
                  _hover={{ bg: cCard.hoverBgColor }}
                  onClick={() => row.toggleExpanded()}
                  cursor="pointer"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <Td key={cell.id} border="none" px={{ base: 2, lg: 4 }} py={2}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Td>
                    );
                  })}
                </Tr>
                {row.getIsExpanded() && (
                  <Tr
                    borderColor={cCard.dividerColor}
                    borderBottomWidth={1}
                    borderTopWidth={1}
                    borderTopStyle="dashed"
                    borderBottomStyle="solid"
                    background={row.getIsExpanded() ? cCard.hoverBgColor : cCard.bgColor}
                  >
                    {/* 2nd row is a custom 1 cell row */}
                    <Td border="none" colSpan={row.getVisibleCells().length}>
                      <AdditionalInfo
                        row={row}
                        rows={table.getCoreRowModel().rows}
                        comptrollerAddress={comptrollerAddress}
                        supplyBalanceFiat={supplyBalanceFiat}
                        poolChainId={poolChainId}
                      />
                    </Td>
                  </Tr>
                )}
              </Fragment>
            ))
          ) : assets.length === 0 ? (
            <Tr>
              <Td border="none" colSpan={table.getHeaderGroups()[0].headers.length}>
                <Center py={8}>There are no assets in this pool.</Center>
              </Td>
            </Tr>
          ) : (
            <Tr>
              <Td border="none" colSpan={table.getHeaderGroups()[0].headers.length}>
                <Center py={8}>There are no results</Center>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
      <Flex
        className="pagination"
        flexDirection={{ base: 'column', lg: 'row' }}
        gap={4}
        justifyContent="flex-end"
        alignItems="flex-end"
        p={4}
      >
        <HStack>
          {!isMobile && <Text variant="smText">Markets Per Page</Text>}
          <Select
            value={pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            maxW="max-content"
          >
            {MARKETS_COUNT_PER_PAGE.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </Select>
        </HStack>
        <HStack gap={2}>
          <Text variant="smText">
            {table.getFilteredRowModel().rows.length === 0
              ? 0
              : pagination.pageIndex * pagination.pageSize + 1}{' '}
            -{' '}
            {(pagination.pageIndex + 1) * pagination.pageSize >
            table.getFilteredRowModel().rows.length
              ? table.getFilteredRowModel().rows.length
              : (pagination.pageIndex + 1) * pagination.pageSize}{' '}
            of {table.getFilteredRowModel().rows.length}
          </Text>
          <HStack>
            <CIconButton
              variant="_outline"
              aria-label="toPrevious"
              icon={<ChevronLeftIcon fontSize={30} />}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              isRound
            />
            <CIconButton
              variant="_outline"
              aria-label="toNext"
              icon={<ChevronRightIcon fontSize={30} />}
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              isRound
            />
          </HStack>
        </HStack>
      </Flex>
    </Box>
  );
};

const ControlledSearchInput = ({ onUpdate }: { onUpdate: (value: string) => void }) => {
  const [searchText, setSearchText] = useState('');
  const isMobile = useIsMobile();
  const debouncedText = useDebounce(searchText, 400);

  useEffect(() => {
    onUpdate(debouncedText);
  }, [debouncedText, onUpdate]);

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return (
    <HStack width="100%">
      {!isMobile && <Text>Search</Text>}
      <Input
        type="text"
        value={searchText}
        onChange={onSearch}
        placeholder="Symbol, Token Name"
        maxWidth={{ base: '100%', lg: 60, md: 60, sm: 290 }}
        _focusVisible={{}}
      />
    </HStack>
  );
};
