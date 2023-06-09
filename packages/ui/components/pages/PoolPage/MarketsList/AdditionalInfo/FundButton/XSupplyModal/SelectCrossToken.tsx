import { PhoneIcon } from '@chakra-ui/icons';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
} from '@chakra-ui/react';
import type { SupportedChains } from '@midas-capital/types';
import { useEffect, useState } from 'react';

import { ChainFilterButtons } from '@ui/components/pages/Fuse/FusePoolsPage/FusePoolList/FusePoolRow/ChainFilterButtons';
import { ChainFilterDropdown } from '@ui/components/pages/Fuse/FusePoolsPage/FusePoolList/FusePoolRow/ChainFilterDropdown';
import { Banner } from '@ui/components/shared/Banner';
import { ALL, SEARCH } from '@ui/constants/index';
import { useEnabledChains } from '@ui/hooks/useChainConfig';
import { useColors } from '@ui/hooks/useColors';
import { useDebounce } from '@ui/hooks/useDebounce';
import type { MarketData } from '@ui/types/TokensDataMap';

export const SelectCrossToken = ({ asset }: { asset: MarketData }) => {
  const { cCard } = useColors();
  const [searchText, setSearchText] = useState('');
  const [globalFilter, setGlobalFilter] = useState<(SupportedChains | string)[]>([ALL]);
  const enabledChains = useEnabledChains();

  const onFilter = (filter: SupportedChains | string) => {
    let _globalFilter: (SupportedChains | string)[] = [];

    if (globalFilter.includes(filter)) {
      if (filter === ALL) {
        _globalFilter = [enabledChains[0]];
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
        enabledChains.length === globalFilter.filter((f) => f !== ALL && f != SEARCH).length + 1
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
            <Flex
              alignItems="center"
              flexWrap="wrap-reverse"
              gap={3}
              justifyContent={['center', 'center', 'space-between']}
              mb={3}
              width="100%"
            >
              <ChainFilterButtons
                globalFilter={globalFilter}
                isLoading={isLoading}
                loadingStatusPerChain={loadingStatusPerChain}
                onFilter={onFilter}
                props={{ display: { base: 'none', lg: 'inline-flex' } }}
              />
              <ChainFilterDropdown
                globalFilter={globalFilter}
                isLoading={isLoading}
                loadingStatusPerChain={loadingStatusPerChain}
                onFilter={onFilter}
                props={{ display: { base: 'inline-flex', lg: 'none' } }}
              />
              <Flex alignItems="flex-end" className="searchAsset" gap={2} justifyContent="center">
                <ControlledSearchInput onUpdate={(searchText) => setSearchText(searchText)} />
              </Flex>
            </Flex>
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
    <HStack>
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          <PhoneIcon color="gray.300" />
        </InputLeftElement>
        <Input
          _focusVisible={{}}
          maxW={80}
          onChange={onSearch}
          placeholder="Asset, Pool Name"
          type="text"
          value={searchText}
        />
      </InputGroup>
    </HStack>
  );
};
