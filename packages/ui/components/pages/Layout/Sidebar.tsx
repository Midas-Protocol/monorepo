import type { FlexProps } from '@chakra-ui/react';
import {
  Box,
  CloseButton,
  Flex,
  Icon,
  Image,
  Link,
  useBreakpointValue,
  useColorMode,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';
import type { ReactText } from 'react';
import type { IconType } from 'react-icons';
import { FiCompass, FiHome, FiSettings, FiStar, FiTrendingUp } from 'react-icons/fi';

import { useMultiMidas } from '@ui/context/MultiMidasContext';

interface LinkItemProps {
  icon: IconType;
  name: string;
}
const LinkItems: Array<LinkItemProps> = [
  { icon: FiHome, name: 'Home' },
  { icon: FiTrendingUp, name: 'Trending' },
  { icon: FiCompass, name: 'Explore' },
  { icon: FiStar, name: 'Favourites' },
  { icon: FiSettings, name: 'Settings' },
];

interface NavItemProps extends FlexProps {
  children: ReactText;
  icon: IconType;
}
const NavItem = ({ icon, children, ...rest }: NavItemProps) => {
  return (
    <Link _focus={{ boxShadow: 'none' }} href="#" style={{ textDecoration: 'none' }}>
      <Flex
        _hover={{
          bg: 'cyan.400',
          color: 'white',
        }}
        align="center"
        borderRadius="lg"
        cursor="pointer"
        mx="4"
        p="4"
        role="group"
        {...rest}
      >
        {icon && (
          <Icon
            _groupHover={{
              color: 'white',
            }}
            as={icon}
            fontSize="16"
            mr="4"
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

export const Sidebar = ({ onClose }: { onClose: () => void }) => {
  const router = useRouter();
  const { colorMode } = useColorMode();
  const { setGlobalLoading } = useMultiMidas();
  const logoPrefix = useBreakpointValue(
    {
      base: '/images/midas-mobile-',
      lg: '/images/midas-',
      md: '/images/midas-',
      sm: '/images/midas-mobile-',
    },
    { fallback: 'lg' }
  );

  return (
    <Box display={{ base: 'none', md: 'block' }} h="full" pos="fixed" w={{ base: 'full', md: 60 }}>
      <Flex alignItems="center" h="20" justifyContent="space-between" mx="8">
        <Box
          _hover={{ cursor: 'pointer' }}
          onClick={() => {
            if (router.pathname !== '/') {
              setGlobalLoading(true);
              router.push('/', undefined, { shallow: true });
            }
          }}
          position={'absolute'}
          pr={{ base: 1, md: 0 }}
          pt={{ base: 3, md: 1 }}
          top={2}
        >
          <Image
            alt="Midas Capital"
            height={'60px'}
            src={colorMode === 'light' ? logoPrefix + 'light.svg' : logoPrefix + 'dark.svg'}
          />
        </Box>
        <CloseButton display={{ base: 'flex', md: 'none' }} onClick={onClose} />
      </Flex>
      {LinkItems.map((link) => (
        <NavItem icon={link.icon} key={link.name}>
          {link.name}
        </NavItem>
      ))}
    </Box>
  );
};
