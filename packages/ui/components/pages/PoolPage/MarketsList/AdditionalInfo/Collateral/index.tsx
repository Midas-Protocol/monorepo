import { Button, HStack, Switch, Text, useDisclosure } from '@chakra-ui/react';
import * as React from 'react';

import { CollateralModal } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/Collateral/CollateralModal/index';
import { Row } from '@ui/components/shared/Flex';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useIsMobile } from '@ui/hooks/useScreenSize';
import { MarketData } from '@ui/types/TokensDataMap';

export const Collateral = ({
  asset,
  assets,
  comptrollerAddress,
  poolChainId,
}: {
  asset: MarketData;
  assets: MarketData[];
  comptrollerAddress: string;
  poolChainId: number;
}) => {
  const { currentChain } = useMultiMidas();
  const isMobile = useIsMobile();
  const { cPage } = useColors();
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const isDisabled = !currentChain || currentChain.unsupported || currentChain.id !== poolChainId;

  return (
    <Row mainAxisAlignment="center" crossAxisAlignment="center">
      <Button
        variant="unstyled"
        borderWidth={1}
        borderColor={cPage.primary.borderColor}
        onClick={openModal}
      >
        <HStack px={4}>
          <Text>Collateral</Text>
          <Switch
            isChecked={asset.membership}
            size={isMobile ? 'sm' : 'md'}
            cursor={'pointer'}
            ml={4}
            isDisabled={isDisabled}
          />
        </HStack>
      </Button>

      {!isDisabled && (
        <CollateralModal
          isOpen={isModalOpen}
          asset={asset}
          assets={assets}
          comptrollerAddress={comptrollerAddress}
          onClose={closeModal}
          poolChainId={poolChainId}
        />
      )}
    </Row>
  );
};
