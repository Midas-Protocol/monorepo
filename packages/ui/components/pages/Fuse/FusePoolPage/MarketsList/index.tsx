import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  LinkIcon,
  QuestionIcon,
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Link as ChakraLink,
  HStack,
  IconButton,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Web3Provider } from '@ethersproject/providers';
import { FlywheelMarketRewardsInfo } from '@midas-capital/sdk/dist/cjs/src/modules/Flywheel';
import { assetSymbols } from '@midas-capital/types';
import { ColumnDef, Row } from '@tanstack/react-table';
import { Contract, ContractTransaction, utils } from 'ethers';
import LogRocket from 'logrocket';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { DataTable } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/DataTable';
import { RewardsInfo } from '@ui/components/pages/Fuse/FusePoolPage/SupplyList/RewardsInfo';
import { CTokenIcon, TokenWithLabel } from '@ui/components/shared/CTokenIcon';
import { Row as CRow } from '@ui/components/shared/Flex';
import { PopoverTooltip } from '@ui/components/shared/PopoverTooltip';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { SwitchCSS } from '@ui/components/shared/SwitchCSS';
import {
  aBNBcContractABI,
  aBNBcContractAddress,
  aprDays,
  DOWN_LIMIT,
  UP_LIMIT,
  URL_MIDAS_DOCS,
} from '@ui/constants/index';
import { useMidas } from '@ui/context/MidasContext';
import { useColors } from '@ui/hooks/useColors';
import { usePluginInfo } from '@ui/hooks/usePluginInfo';
import { useIsMobile } from '@ui/hooks/useScreenSize';
import { useErrorToast, useInfoToast } from '@ui/hooks/useToast';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';
import {
  aprFormatter,
  shortUsdFormatter,
  smallUsdFormatter,
  tokenFormatter,
} from '@ui/utils/bigUtils';
import { errorCodeToMessage } from '@ui/utils/errorCodeToMessage';
import { getBlockTimePerMinuteByChainId } from '@ui/utils/networkData';
import { sortAssets } from '@ui/utils/sortAssets';

type Market = {
  market: MarketData;
  supplyApy: MarketData;
  supplyBalance: MarketData;
  collateral: MarketData;
  borrowApy: MarketData;
  tvl: MarketData;
  ltv: MarketData;
  borrowBalance: MarketData;
  liquidity: MarketData;
};

const ExpanderComponent = ({
  getToggleExpandedHandler,
  isExpanded,
  canExpand,
}: {
  getToggleExpandedHandler: () => void;
  isExpanded: boolean;
  canExpand: boolean;
}) => {
  const { cOutlineBtn } = useColors();

  return (
    <IconButton
      alignSelf="flex-end"
      onClick={(e) => {
        e.stopPropagation();
        getToggleExpandedHandler();
      }}
      disabled={!canExpand ? true : false}
      variant="outline"
      color={cOutlineBtn.primary.txtColor}
      aria-label="detail view"
      borderRadius="50%"
      borderWidth={3}
      borderColor={cOutlineBtn.primary.borderColor}
      background={cOutlineBtn.primary.bgColor}
      icon={isExpanded ? <ChevronUpIcon fontSize={30} /> : <ChevronDownIcon fontSize={30} />}
      _hover={{
        background: cOutlineBtn.primary.hoverBgColor,
        color: cOutlineBtn.primary.hoverTxtColor,
      }}
    />
  );
};

const LiquidityComponent = ({ asset }: { asset: MarketData }) => {
  const { data: tokenData } = useTokenData(asset.underlyingToken);
  const { cCard } = useColors();

  return (
    <Box textAlign="end">
      <PopoverTooltip
        body={
          <>
            {asset.liquidityFiat > DOWN_LIMIT && asset.liquidityFiat < UP_LIMIT && (
              <>
                <div>{asset.liquidityFiat.toString()}</div>
                <br />
              </>
            )}
            <div>
              Liquidity is the amount of this asset that is available to borrow (unborrowed). To see
              how much has been supplied and borrowed in total, navigate to the Pool Info tab.
            </div>
          </>
        }
        placement="top-end"
      >
        <VStack alignItems={'flex-end'}>
          <Text color={cCard.txtColor} fontWeight="bold" fontSize={{ base: '2.8vw', sm: 'md' }}>
            {smallUsdFormatter(asset.liquidityFiat)}
            {asset.liquidityFiat > DOWN_LIMIT && asset.liquidityFiat < UP_LIMIT && '+'}
          </Text>
          <Text color={cCard.txtColor} fontSize={{ base: '2.8vw', sm: '0.8rem' }}>
            {shortUsdFormatter(
              Number(utils.formatUnits(asset.liquidity, asset.underlyingDecimals))
            ).replace('$', '')}{' '}
            {tokenData?.symbol}
          </Text>
        </VStack>
      </PopoverTooltip>
    </Box>
  );
};

const BorrowBalanceComponent = ({ asset }: { asset: MarketData }) => {
  const { data: tokenData } = useTokenData(asset.underlyingToken);
  const { cCard } = useColors();

  return (
    <VStack alignItems={'flex-end'}>
      <SimpleTooltip
        label={asset.borrowBalanceFiat.toString()}
        isDisabled={asset.borrowBalanceFiat === DOWN_LIMIT || asset.borrowBalanceFiat >= UP_LIMIT}
      >
        <Text color={cCard.txtColor} fontWeight="bold" fontSize={{ base: '2.8vw', sm: 'md' }}>
          {smallUsdFormatter(asset.borrowBalanceFiat)}
          {asset.borrowBalanceFiat > DOWN_LIMIT && asset.borrowBalanceFiat < UP_LIMIT && '+'}
        </Text>
      </SimpleTooltip>
      <SimpleTooltip
        label={utils.formatUnits(asset.borrowBalance, asset.underlyingDecimals)}
        isDisabled={
          Number(utils.formatUnits(asset.borrowBalance, asset.underlyingDecimals)) === DOWN_LIMIT ||
          Number(utils.formatUnits(asset.borrowBalance, asset.underlyingDecimals)) >= UP_LIMIT
        }
      >
        <Text color={cCard.txtColor} mt={1} fontSize={{ base: '2.8vw', sm: '0.8rem' }}>
          {smallUsdFormatter(
            Number(utils.formatUnits(asset.borrowBalance, asset.underlyingDecimals))
          ).replace('$', '')}
          {Number(utils.formatUnits(asset.borrowBalance, asset.underlyingDecimals)) > DOWN_LIMIT &&
            Number(utils.formatUnits(asset.borrowBalance, asset.underlyingDecimals)) < UP_LIMIT &&
            '+'}{' '}
          {tokenData?.symbol ?? asset.underlyingSymbol}
        </Text>
      </SimpleTooltip>
    </VStack>
  );
};

const LtvComponent = ({ asset }: { asset: MarketData }) => {
  const { cCard } = useColors();

  return (
    <Box textAlign="end">
      <PopoverTooltip
        placement="top-start"
        body={
          'The Loan to Value (LTV) ratio defines the maximum amount of tokens in the pool that can be borrowed with a specific collateral. It’s expressed in percentage: if in a pool ETH has 75% LTV, for every 1 ETH worth of collateral, borrowers will be able to borrow 0.75 ETH worth of other tokens in the pool.'
        }
      >
        <Text color={cCard.txtColor} fontSize={{ base: '2.8vw', sm: 'lg' }}>
          {utils.formatUnits(asset.collateralFactor, 16)}%
        </Text>
      </PopoverTooltip>
    </Box>
  );
};

const TvlComponent = ({ asset }: { asset: MarketData }) => {
  const { cCard } = useColors();

  return (
    <VStack alignItems={'flex-end'}>
      <PopoverTooltip
        placement="top-start"
        body={
          "Total Value Lent (TVL) measures how much of this asset has been supplied in total. TVL does not account for how much of the lent assets have been borrowed, use 'liquidity' to determine the total unborrowed assets lent."
        }
      >
        <Text wordBreak={'keep-all'} color={cCard.txtColor} fontSize={{ base: '2.8vw', sm: 'lg' }}>
          {shortUsdFormatter(asset.totalSupplyFiat)}
        </Text>
      </PopoverTooltip>
    </VStack>
  );
};

const BorrowApyComponent = ({ asset }: { asset: MarketData }) => {
  const { currentChain, midasSdk } = useMidas();
  const blocksPerMin = getBlockTimePerMinuteByChainId(currentChain.id);
  const borrowAPR = midasSdk.ratePerBlockToAPY(asset.borrowRatePerBlock, blocksPerMin);
  const { cCard } = useColors();

  return (
    <VStack alignItems={'flex-end'}>
      <Text color={cCard.txtColor} fontSize={{ base: '2.8vw', sm: 'lg' }}>
        {borrowAPR.toFixed(3)}%
      </Text>
    </VStack>
  );
};

const CollateralComponent = ({
  asset,
  comptrollerAddress,
}: {
  asset: MarketData;
  comptrollerAddress: string;
}) => {
  const { midasSdk, setPendingTxHash } = useMidas();
  const errorToast = useErrorToast();
  const infoToast = useInfoToast();

  const { cSwitch } = useColors();
  const isMobile = useIsMobile();

  const onToggleCollateral = async () => {
    const comptroller = midasSdk.createComptroller(comptrollerAddress);

    let call: ContractTransaction;
    if (asset.membership) {
      const exitCode = await comptroller.callStatic.exitMarket(asset.cToken);
      if (!exitCode.eq(0)) {
        infoToast({
          title: 'Cannot Remove Collateral',
          description: errorCodeToMessage(exitCode.toNumber()),
        });
        return;
      }
      call = await comptroller.exitMarket(asset.cToken);
    } else {
      call = await comptroller.enterMarkets([asset.cToken]);
    }

    if (!call) {
      if (asset.membership) {
        errorToast({
          title: 'Error! Code: ' + call,
          description:
            'You cannot disable this asset as collateral as you would not have enough collateral posted to keep your borrow. Try adding more collateral of another type or paying back some of your debt.',
        });
      } else {
        errorToast({
          title: 'Error! Code: ' + call,
          description: 'You cannot enable this asset as collateral at this time.',
        });
      }

      return;
    }

    setPendingTxHash(call.hash);

    LogRocket.track('Fuse-ToggleCollateral');
  };
  return (
    <CRow mainAxisAlignment="flex-end" crossAxisAlignment="center">
      <SwitchCSS symbol={asset.underlyingSymbol.replace(/[\s+()]/g, '')} color={cSwitch.bgColor} />
      <Switch
        isChecked={asset.membership}
        className={'switch-' + asset.underlyingSymbol.replace(/[\s+()]/g, '')}
        onChange={onToggleCollateral}
        size={isMobile ? 'sm' : 'md'}
        cursor={'pointer'}
      />
    </CRow>
  );
};

const SupplyBalanceComponent = ({ asset }: { asset: MarketData }) => {
  const { data: tokenData } = useTokenData(asset.underlyingToken);

  const { cCard } = useColors();

  return (
    <VStack alignItems="flex-end">
      <SimpleTooltip
        label={asset.supplyBalanceFiat.toString()}
        isDisabled={asset.supplyBalanceFiat === DOWN_LIMIT || asset.supplyBalanceFiat >= UP_LIMIT}
      >
        <Text color={cCard.txtColor} fontWeight="bold" fontSize={{ base: '2.8vw', sm: 'md' }}>
          {smallUsdFormatter(asset.supplyBalanceFiat)}
          {asset.supplyBalanceFiat > DOWN_LIMIT && asset.supplyBalanceFiat < UP_LIMIT && '+'}
        </Text>
      </SimpleTooltip>
      <SimpleTooltip
        label={utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals)}
        isDisabled={
          Number(utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals)) === DOWN_LIMIT ||
          Number(utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals)) >= UP_LIMIT
        }
      >
        <Text color={cCard.txtColor} mt={1} fontSize={{ base: '2.8vw', sm: '0.8rem' }}>
          {tokenFormatter(asset.supplyBalance, asset.underlyingDecimals)}
          {Number(utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals)) > DOWN_LIMIT &&
            Number(utils.formatUnits(asset.supplyBalance, asset.underlyingDecimals)) < UP_LIMIT &&
            '+'}{' '}
          {tokenData?.extraData?.shortName ?? tokenData?.symbol ?? asset.underlyingSymbol}
        </Text>
      </SimpleTooltip>
    </VStack>
  );
};

const SupplyApyComponent = ({
  asset,
  rewards,
}: {
  asset: MarketData;
  rewards: FlywheelMarketRewardsInfo[];
}) => {
  const { midasSdk, currentChain } = useMidas();
  const supplyAPY = midasSdk.ratePerBlockToAPY(
    asset.supplyRatePerBlock,
    getBlockTimePerMinuteByChainId(currentChain.id)
  );

  const { cCard } = useColors();

  const rewardsOfThisMarket = useMemo(
    () => rewards.find((r) => r.market === asset.cToken),
    [asset.cToken, rewards]
  );

  const [aBNBcApr, setaBNBcApr] = useState('');

  useEffect(() => {
    const func = async () => {
      const contract = new Contract(
        aBNBcContractAddress,
        aBNBcContractABI,
        midasSdk.provider as Web3Provider
      );

      const apr = await contract.callStatic.averagePercentageRate(aprDays);
      setaBNBcApr(utils.formatUnits(apr));
    };

    if (asset.underlyingSymbol === assetSymbols.aBNBc) {
      func();
    }
  }, [asset, midasSdk.provider]);

  return (
    <VStack alignItems={'flex-end'}>
      <Text color={cCard.txtColor} fontWeight="bold" fontSize={{ base: '2.8vw', sm: 'md' }}>
        {supplyAPY.toFixed(2)}%
      </Text>
      {asset.underlyingSymbol === assetSymbols.aBNBc && (
        <Text color={cCard.txtColor} fontSize={{ base: '2.8vw', sm: 'md' }}>
          + {Number(aBNBcApr).toFixed(2)}%
        </Text>
      )}

      {rewardsOfThisMarket?.rewardsInfo && rewardsOfThisMarket?.rewardsInfo.length !== 0 ? (
        rewardsOfThisMarket?.rewardsInfo.map((info) =>
          asset.plugin ? (
            <RewardsInfo
              key={info.rewardToken}
              underlyingAddress={asset.underlyingToken}
              pluginAddress={asset.plugin}
              rewardAddress={info.rewardToken}
            />
          ) : (
            <HStack key={info.rewardToken} justifyContent={'flex-end'} spacing={0}>
              <HStack mr={2}>
                <Text fontSize={{ base: '3.2vw', sm: '0.9rem' }}>+</Text>
                <TokenWithLabel address={info.rewardToken} size="2xs" />
              </HStack>
              {info.formattedAPR && (
                <Text color={cCard.txtColor} fontSize={{ base: '2.8vw', sm: '0.8rem' }} ml={1}>
                  {aprFormatter(info.formattedAPR)}%
                </Text>
              )}
            </HStack>
          )
        )
      ) : asset.plugin ? (
        <RewardsInfo underlyingAddress={asset.underlyingToken} pluginAddress={asset.plugin} />
      ) : null}
    </VStack>
  );
};

const MarketComponent = ({ asset }: { asset: MarketData }) => {
  const { scanUrl } = useMidas();
  const { data: tokenData } = useTokenData(asset.underlyingToken);

  const { cCard } = useColors();

  const { data: pluginInfo } = usePluginInfo(asset.plugin);

  return (
    <CRow mainAxisAlignment="flex-start" crossAxisAlignment="center">
      <CTokenIcon size="sm" address={asset.underlyingToken} />
      <VStack alignItems={'flex-start'} ml={2}>
        <PopoverTooltip
          placement="top-start"
          body={
            <div
              dangerouslySetInnerHTML={{
                __html: asset.extraDocs || asset.underlyingSymbol,
              }}
            />
          }
        >
          <Text fontWeight="bold" textAlign={'left'} fontSize={{ base: '2.8vw', sm: '0.9rem' }}>
            {tokenData?.symbol ?? asset.underlyingSymbol}
          </Text>
        </PopoverTooltip>
      </VStack>

      <HStack ml={2}>
        {asset.underlyingSymbol &&
          tokenData?.symbol &&
          asset.underlyingSymbol.toLowerCase() !== tokenData?.symbol?.toLowerCase() && (
            <PopoverTooltip body={asset.underlyingSymbol}>
              <QuestionIcon />
            </PopoverTooltip>
          )}
        <PopoverTooltip placement="top-start" body={`${scanUrl}/address/${asset.underlyingToken}`}>
          <Button
            minWidth={6}
            m={0}
            variant={'link'}
            as={ChakraLink}
            href={`${scanUrl}/address/${asset.underlyingToken}`}
            isExternal
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <LinkIcon h={{ base: 3, sm: 6 }} color={cCard.txtColor} />
          </Button>
        </PopoverTooltip>

        {asset.plugin && (
          <PopoverTooltip
            placement="top-start"
            body={
              <Text lineHeight="base">
                This market is using the <b>{pluginInfo?.name}</b> ERC4626 Strategy.
                <br />
                {pluginInfo?.apyDocsUrl ? (
                  <ChakraLink
                    href={pluginInfo.apyDocsUrl}
                    isExternal
                    variant={'color'}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Vault details
                  </ChakraLink>
                ) : (
                  <>
                    Read more about it{' '}
                    <ChakraLink
                      href={pluginInfo?.strategyDocsUrl || URL_MIDAS_DOCS}
                      isExternal
                      variant={'color'}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      in our Docs <ExternalLinkIcon mx="2px" />
                    </ChakraLink>
                  </>
                )}
                .
              </Text>
            }
          >
            <span role="img" aria-label="plugin" style={{ fontSize: 18 }}>
              🔌
            </span>
          </PopoverTooltip>
        )}
      </HStack>
    </CRow>
  );
};

const renderSubComponent = ({ row }: { row: Row<Market> }) => {
  return <pre style={{ fontSize: '20px' }}>{row && <code>Additional info here</code>}</pre>;
};

export const MarketsList = ({
  assets,
  rewards = [],
  comptrollerAddress,
}: {
  assets: MarketData[];
  rewards?: FlywheelMarketRewardsInfo[];
  comptrollerAddress: string;
}) => {
  const suppliedAssets = useMemo(
    () => sortAssets(assets).filter((asset) => asset.supplyBalance.gt(0)),
    [assets]
  );
  const nonSuppliedAssets = useMemo(
    () => sortAssets(assets).filter((asset) => asset.supplyBalance.eq(0)),
    [assets]
  );

  const data: Market[] = useMemo(() => {
    return [...suppliedAssets, ...nonSuppliedAssets].map((asset) => {
      return {
        market: asset,
        supplyApy: asset,
        supplyBalance: asset,
        collateral: asset,
        borrowApy: asset,
        tvl: asset,
        ltv: asset,
        borrowBalance: asset,
        liquidity: asset,
      };
    });
  }, [suppliedAssets, nonSuppliedAssets]);

  const columns: ColumnDef<Market>[] = useMemo(() => {
    return [
      {
        header: 'Assets',
        footer: (props) => props.column.id,
        columns: [
          {
            accessorKey: 'market',
            header: 'Market',
            cell: ({ getValue }) => <MarketComponent asset={getValue<MarketData>()} />,
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.ltv,
            id: 'LTV',
            cell: ({ getValue }) => <LtvComponent asset={getValue<MarketData>()} />,
            header: () => <Text textAlign="end">LTV</Text>,
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.supplyApy,
            id: 'supplyApy',
            cell: ({ getValue }) => (
              <SupplyApyComponent asset={getValue<MarketData>()} rewards={rewards} />
            ),
            header: () => <Text textAlign="end">Supply APY</Text>,
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.borrowApy,
            id: 'borrowApy',
            cell: ({ getValue }) => <BorrowApyComponent asset={getValue<MarketData>()} />,
            header: () => <Text textAlign="end">Borrow Apy</Text>,
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.tvl,
            id: 'tvl',
            cell: ({ getValue }) => <TvlComponent asset={getValue<MarketData>()} />,
            header: () => <Text textAlign="end">TVL</Text>,
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.supplyBalance,
            id: 'supplyBalance',
            cell: ({ getValue }) => <SupplyBalanceComponent asset={getValue<MarketData>()} />,
            header: () => <Text textAlign="end">Supply Balance</Text>,
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.borrowBalance,
            id: 'borrowBalance',
            cell: ({ getValue }) => <BorrowBalanceComponent asset={getValue<MarketData>()} />,
            header: () => <Text textAlign="end">Borrow Balance</Text>,
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.liquidity,
            id: 'liquidity',
            cell: ({ getValue }) => <LiquidityComponent asset={getValue<MarketData>()} />,
            header: () => <Text textAlign="end">Liquidity</Text>,
            footer: (props) => props.column.id,
          },
          {
            accessorFn: (row) => row.collateral,
            id: 'collateral',
            cell: ({ getValue }) => (
              <CollateralComponent
                asset={getValue<MarketData>()}
                comptrollerAddress={comptrollerAddress}
              />
            ),
            header: () => <Text textAlign="end">Collateral</Text>,
            footer: (props) => props.column.id,
          },
          {
            id: 'expander',
            header: () => null,
            cell: ({ row }) => {
              return (
                <ExpanderComponent
                  getToggleExpandedHandler={row.getToggleExpandedHandler()}
                  isExpanded={row.getIsExpanded()}
                  canExpand={row.getCanExpand()}
                />
              );
            },
          },
        ],
      },
    ];
  }, [rewards, comptrollerAddress]);

  return (
    <Box overflowX="auto">
      <DataTable
        columns={columns}
        data={data}
        getRowCanExpand={() => true}
        renderSubComponent={renderSubComponent}
      />
    </Box>
  );
};
