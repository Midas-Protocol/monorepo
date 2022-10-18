import {
  Avatar,
  Box,
  Flex,
  FlexProps,
  HStack,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { FaDiscord, FaTelegram, FaTwitter } from 'react-icons/fa';
import { SiGitbook } from 'react-icons/si';

import FuseDashNav from '@ui/components/pages/Fuse/FusePoolsPage/FuseDashNav';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import {
  MIDAS_DISCORD_URL,
  MIDAS_DOCS_URL,
  MIDAS_TELEGRAM_URL,
  MIDAS_TWITTER_URL,
} from '@ui/constants/index';
import { useTVL } from '@ui/hooks/fuse/useTVL';
import { useColors } from '@ui/hooks/useColors';
import { smallUsdFormatter } from '@ui/utils/bigUtils';

const MotionFlex = motion<FlexProps>(Flex);

const FuseStatsBar = () => {
  const { data: tvlData, isLoading } = useTVL();

  const totalTVL = useMemo(() => {
    if (tvlData) {
      return [...tvlData.values()].reduce((a, c) => a + c.value, 0);
    }
  }, [tvlData]);
  const { cPage } = useColors();

  return (
    <Flex
      id="stats-bar"
      marginRight="auto"
      marginLeft="auto"
      flexDir={{ base: 'column', lg: 'row' }}
      alignItems="flex-end"
      justifyContent="center"
      pt={{ base: '72px', md: '0px' }}
      pb={{ base: 6, md: 6 }}
      px={{ base: 0, lg: 0 }}
      w="100%"
      gridGap="1.5rem"
    >
      <Flex
        flexDir="column"
        w={{ base: '100%' }}
        fontSize="sm"
        marginRight={{ base: '0px', lg: '84.5px' }}
      >
        <Text variant="heading" fontWeight="bold">
          Unleash the power of your assets
        </Text>
        <Text variant="mdText" my={4} zIndex="100" lineHeight={8}>
          Let your holdings shine with the Midas Touch. From an individual DeFi user to a DAO or
          Treasury, users can take advantage of Midas to earn yield, borrow against, or lend their
          favorite tokens.
        </Text>
        <HStack gap={2}>
          <SimpleTooltip label="Documentation">
            <Link href={MIDAS_DOCS_URL} isExternal>
              <motion.div whileHover={{ scale: 1.2 }}>
                <SiGitbook fontSize={30} color={cPage.primary.borderColor} />
              </motion.div>
            </Link>
          </SimpleTooltip>
          <SimpleTooltip label="Discord">
            <Link href={MIDAS_DISCORD_URL} isExternal>
              <motion.div whileHover={{ scale: 1.2 }}>
                <FaDiscord fontSize={28} color={cPage.primary.borderColor} />
              </motion.div>
            </Link>
          </SimpleTooltip>
          <SimpleTooltip label="Telegram">
            <Link href={MIDAS_TELEGRAM_URL} isExternal>
              <motion.div whileHover={{ scale: 1.2 }}>
                <FaTelegram fontSize={24} color={cPage.primary.borderColor} />
              </motion.div>
            </Link>
          </SimpleTooltip>
          <SimpleTooltip label="Twitter">
            <Link href={MIDAS_TWITTER_URL} isExternal>
              <motion.div whileHover={{ scale: 1.2 }}>
                <FaTwitter fontSize={24} color={cPage.primary.borderColor} />
              </motion.div>
            </Link>
          </SimpleTooltip>

          <FuseDashNav />
        </HStack>
      </Flex>

      <Popover trigger="hover">
        <PopoverTrigger>
          <MotionFlex
            flexDir="column"
            h={{ base: '10rem', lg: '15rem' }}
            w={{ base: '100%', lg: '50%' }}
            px={{ lg: '10vw' }}
            alignItems="center"
            justifyContent="center"
            position="relative"
            overflow="hidden"
            boxShadow="3px 18px 23px -26px rgb(92 31 70 / 51%)"
            borderRadius="20px"
            bg={cPage.secondary.bgColor}
            color={cPage.secondary.txtColor}
            whileHover={{ scale: 1.06 }}
          >
            {isLoading || totalTVL === undefined ? (
              <Spinner />
            ) : (
              <>
                <Text variant="panelHeading" fontWeight="bold" lineHeight={['60px']}>
                  {smallUsdFormatter(totalTVL)}
                </Text>
              </>
            )}
            <Text whiteSpace="nowrap" variant="panelMdText">
              Total value supplied across Midas
            </Text>
          </MotionFlex>
        </PopoverTrigger>
        {tvlData && (
          <PopoverContent p={2}>
            <VStack width={'100%'} alignItems="flex-start" spacing={0}>
              {[...tvlData.values()].map((chainTVL, index) => (
                <Flex key={'tvl_' + index}>
                  <Avatar src={chainTVL.logo} />
                  <Box ml="3">
                    <Text fontWeight="bold" mt={1}>
                      {smallUsdFormatter(chainTVL.value)}
                    </Text>
                    <Text>{chainTVL.name}</Text>
                  </Box>
                </Flex>
              ))}
            </VStack>
          </PopoverContent>
        )}
      </Popover>
    </Flex>
  );
};

export default FuseStatsBar;
