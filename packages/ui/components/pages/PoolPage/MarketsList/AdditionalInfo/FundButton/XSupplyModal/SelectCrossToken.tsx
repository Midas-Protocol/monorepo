import { SearchIcon } from '@chakra-ui/icons';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Grid,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Radio,
  RadioGroup,
  VStack,
} from '@chakra-ui/react';
import type { SupportedChains } from '@midas-capital/types';
import { useEffect, useMemo, useState } from 'react';

import { ChainFilterButtons } from '@ui/components/pages/Fuse/FusePoolsPage/FusePoolList/FusePoolRow/ChainFilterButtons';
import { ChainFilterDropdown } from '@ui/components/pages/Fuse/FusePoolsPage/FusePoolList/FusePoolRow/ChainFilterDropdown';
import { Banner } from '@ui/components/shared/Banner';
import { ALL, SEARCH } from '@ui/constants/index';
import type { ExtraTokenType } from '@ui/hooks/fuse/useCrossTokens';
import { useCrossTokens } from '@ui/hooks/fuse/useCrossTokens';
import { useColors } from '@ui/hooks/useColors';
import { useDebounce } from '@ui/hooks/useDebounce';
import type { MarketData } from '@ui/types/TokensDataMap';

export const SelectCrossToken = ({
  asset,
  availableFromChains,
}: {
  asset: MarketData;
  availableFromChains: SupportedChains[];
}) => {
  const { cCard } = useColors();
  const [tokens, setTokens] = useState<ExtraTokenType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [globalFilter, setGlobalFilter] = useState<(SupportedChains | string)[]>([ALL]);
  const { tokensPerChain, isLoading, allTokens } = useCrossTokens(availableFromChains);
  const { cPage } = useColors();
  const [selectedToken, setSelectedToken] = useState<string>();

  const loadingStatusPerChain = useMemo(() => {
    const _loadingStatusPerChain: { [chainId: string]: boolean } = {};

    Object.entries(tokensPerChain).map(([chainId, query]) => {
      _loadingStatusPerChain[chainId] = query.isLoading;
    });

    return _loadingStatusPerChain;
  }, [tokensPerChain]);

  useEffect(() => {
    let _tokens: ExtraTokenType[] = [];

    if (globalFilter.includes(ALL)) {
      _tokens = [...allTokens];
    } else {
      globalFilter.map((filter) => {
        const data = tokensPerChain[filter.toString()]?.data;

        if (data) {
          _tokens.push(...data);
        }
      });
    }

    if (globalFilter.includes(SEARCH)) {
      _tokens = _tokens.filter(
        (token) =>
          token.address?.toLowerCase().includes(searchText.toLowerCase()) ||
          token.symbol?.toLowerCase().includes(searchText.toLowerCase()) ||
          token.originalSymbol?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setTokens(_tokens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, Object.values(tokensPerChain).join(','), allTokens.join(','), searchText]);

  useEffect(() => {
    if (tokens.length > 0) {
      setSelectedToken(tokens[0].address);
    } else {
      setSelectedToken(undefined);
    }
  }, [tokens]);

  const onFilter = (filter: SupportedChains | string) => {
    let _globalFilter: (SupportedChains | string)[] = [];

    if (globalFilter.includes(filter)) {
      if (filter === ALL) {
        _globalFilter = [availableFromChains[0]];
      } else {
        _globalFilter = globalFilter.filter((f) => f !== filter);

        if (_globalFilter.length === 0) {
          _globalFilter = [ALL];
        }
      }
    } else {
      if (globalFilter.includes(ALL)) {
        _globalFilter = [filter];
      } else if (
        filter === ALL ||
        availableFromChains.length ===
          globalFilter.filter((f) => f !== ALL && f != SEARCH).length + 1
      ) {
        _globalFilter = [ALL];
      } else {
        _globalFilter = [...globalFilter, filter];
      }
    }

    if (globalFilter.includes(SEARCH)) {
      setGlobalFilter([..._globalFilter, SEARCH]);
    } else {
      setGlobalFilter([..._globalFilter]);
    }
  };

  const onChange = (address: string) => {
    setSelectedToken(address);
  };

  return (
    <VStack mx={4} spacing={4}>
      <Banner
        alertDescriptionProps={{ fontSize: 'md' }}
        alertProps={{ status: 'warning' }}
        alertTitleProps={{ fontSize: 'lg' }}
        descriptions={[
          {
            text: `You do not have any ${
              asset.originalSymbol ?? asset.underlyingSymbol
            } in your wallet, would you like to swap, bridge and deposit?`,
          },
        ]}
        title="Insufficient funds"
      />
      <Accordion allowToggle width="100%">
        <AccordionItem borderColor={cCard.borderColor} borderRadius={8} borderWidth={1}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                Select token to swap, bridge and deposit
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <VStack>
              <Flex
                alignItems="center"
                flexWrap="wrap-reverse"
                gap={3}
                justifyContent={['center', 'center', 'space-between']}
                mb={3}
                width="100%"
              >
                <ChainFilterButtons
                  enabledChains={availableFromChains}
                  globalFilter={globalFilter}
                  isLoading={isLoading}
                  loadingStatusPerChain={loadingStatusPerChain}
                  onFilter={onFilter}
                  props={{ display: { base: 'none', lg: 'inline-flex' } }}
                />
                <ChainFilterDropdown
                  enabledChains={availableFromChains}
                  globalFilter={globalFilter}
                  isLoading={isLoading}
                  loadingStatusPerChain={loadingStatusPerChain}
                  onFilter={onFilter}
                  props={{ display: { base: 'inline-flex', lg: 'none' } }}
                />
                <Flex
                  alignItems="flex-end"
                  className="searchAsset"
                  gap={2}
                  justifyContent="center"
                  width="100%"
                >
                  <ControlledSearchInput onUpdate={(searchText) => setSearchText(searchText)} />
                </Flex>
              </Flex>
              {tokens.length > 0 ? (
                <Box pr={2} width="100%">
                  <Flex
                    alignItems="center"
                    className="selectToken"
                    css={{
                      '&::-webkit-scrollbar': {
                        display: 'block',
                        height: '4px',
                        width: '4px',
                      },
                      '&::-webkit-scrollbar-corner': {
                        display: 'none',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: cPage.primary.borderColor,
                      },
                      '&::-webkit-scrollbar-track': {
                        height: '4px',
                        width: '4px',
                      },
                    }}
                    direction="column"
                    maxHeight="200px"
                    overflow="auto"
                    width="100%"
                  >
                    <RadioGroup onChange={onChange} value={selectedToken}>
                      <VStack>
                        <Grid
                          alignItems="stretch"
                          gap={4}
                          templateColumns={{
                            base: 'repeat(1, 1fr)',
                            lg: 'repeat(4, 1fr)',
                          }}
                          w="100%"
                        >
                          {tokens.map((token) => {
                            return (
                              <Radio key={token.address} value={token.address}>
                                {token.originalSymbol ?? token.symbol}
                              </Radio>
                            );
                          })}
                        </Grid>
                      </VStack>
                    </RadioGroup>
                  </Flex>
                </Box>
              ) : null}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </VStack>
  );
};

const ControlledSearchInput = ({ onUpdate }: { onUpdate: (value: string) => void }) => {
  const [searchText, setSearchText] = useState('');
  const debouncedText = useDebounce(searchText, 400);

  useEffect(() => {
    onUpdate(debouncedText);
  }, [debouncedText, onUpdate]);

  const onSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  return (
    <HStack width="100%">
      <InputGroup width="100%">
        <InputLeftElement pointerEvents="none" px={4}>
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          _focusVisible={{}}
          onChange={onSearch}
          pl={12}
          placeholder="Token Name"
          type="text"
          value={searchText}
          width="100%"
        />
      </InputGroup>
    </HStack>
  );
};
