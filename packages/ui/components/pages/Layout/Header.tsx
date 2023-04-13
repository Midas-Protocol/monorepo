import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { Button, HStack, IconButton, useColorMode } from '@chakra-ui/react';
import React from 'react';
import { FiMenu } from 'react-icons/fi';

import { WalletButtons } from '@ui/components/shared/WalletButtons';
import { useColors } from '@ui/hooks/useColors';

export const Header = ({ onOpen }: { onOpen: () => void }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { cPage } = useColors();

  return (
    <HStack
      alignItems={'flex-start'}
      alignSelf={'flex-end'}
      background={cPage.primary.bgColor}
      border={'solid'}
      borderColor={cPage.primary.hoverColor}
      borderTop={0}
      borderWidth={1}
      borderX={0}
      justifyContent="space-between"
      justifySelf={'flex-start'}
      position="sticky"
      px={{ base: 4, md: 8 }}
      py={2}
      right={0}
      top={0}
      w={'calc(100% - 240px)'}
      zIndex={1}
    >
      <IconButton aria-label="open sidebar" icon={<FiMenu />} onClick={onOpen} variant="_outline" />
      <HStack>
        <WalletButtons />
        <Button ml={2} onClick={toggleColorMode} px={2} variant="_solid">
          {colorMode === 'light' ? (
            <MoonIcon color="gray.700" h={5} w={5} />
          ) : (
            <SunIcon color={cPage.secondary.txtColor} h={5} w={5} />
          )}
        </Button>
      </HStack>
    </HStack>
  );
};
