import { LinkIcon } from '@chakra-ui/icons';
import { Badge, Box, Button, Link as ChakraLink, HStack, Text, VStack } from '@chakra-ui/react';
import { utils } from 'ethers';
import * as React from 'react';

import { CTokenIcon } from '@ui/components/shared/CTokenIcon';
import { Row } from '@ui/components/shared/Flex';
import { GlowingBox } from '@ui/components/shared/GlowingBox';
import { PopoverTooltip } from '@ui/components/shared/PopoverTooltip';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMidas } from '@ui/context/MidasContext';
import { useAssetClaimableRewards } from '@ui/hooks/rewards/useAssetClaimableRewards';
import { useColors } from '@ui/hooks/useColors';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';

export const TokenName = ({ asset, poolAddress }: { asset: MarketData; poolAddress: string }) => {
  const { scanUrl } = useMidas();
  const { data: tokenData } = useTokenData(asset.underlyingToken);

  const { cCard } = useColors();

  const { data: claimableRewards } = useAssetClaimableRewards({
    poolAddress,
    assetAddress: asset.cToken,
  });

  return (
    <Row id="marketName" mainAxisAlignment="flex-start" crossAxisAlignment="center">
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
        <div>
          <CTokenIcon size="md" address={asset.underlyingToken} withTooltip={false} />
        </div>
      </PopoverTooltip>
      <VStack alignItems={'flex-start'} ml={2} spacing={1}>
        <HStack>
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
            <Text
              className={tokenData?.symbol ?? asset.underlyingSymbol}
              fontWeight="bold"
              variant="mdText"
            >
              {tokenData?.symbol ?? asset.underlyingSymbol}
            </Text>
          </PopoverTooltip>
          <PopoverTooltip
            placement="top-start"
            body={
              'The Loan to Value (LTV) ratio defines the maximum amount of tokens in the pool that can be borrowed with a specific collateral. It’s expressed in percentage: if in a pool ETH has 75% LTV, for every 1 ETH worth of collateral, borrowers will be able to borrow 0.75 ETH worth of other tokens in the pool.'
            }
          >
            <Text variant="xsText">{utils.formatUnits(asset.collateralFactor, 16)}% LTV</Text>
          </PopoverTooltip>
        </HStack>
        <VStack alignItems={'flex-start'} ml={2} spacing={1}>
          {claimableRewards && claimableRewards.length > 0 && (
            <SimpleTooltip label="This asset has rewards!">
              <Box>
                <GlowingBox px={2} fontSize={12} height={5} borderRadius={8} py={0}>
                  Rewards
                </GlowingBox>
              </Box>
            </SimpleTooltip>
          )}
          {asset.membership && (
            <SimpleTooltip label="This asset can be deposited as collateral">
              <Badge variant="outline" colorScheme="cyan" textTransform="capitalize">
                Collateral
              </Badge>
            </SimpleTooltip>
          )}
          {asset.isBorrowPaused ? (
            asset.isSupplyPaused ? (
              <SimpleTooltip label="This asset cannot be supplied and borrowed">
                <Badge variant="outline" colorScheme="gray" textTransform="capitalize">
                  Deprecated
                </Badge>
              </SimpleTooltip>
            ) : (
              <SimpleTooltip label="This asset cannot be borrowed">
                <Badge variant="outline" colorScheme="purple" textTransform="capitalize">
                  Protected
                </Badge>
              </SimpleTooltip>
            )
          ) : (
            <SimpleTooltip label="This asset can be borrowed">
              <Badge variant="outline" colorScheme="orange" textTransform="capitalize">
                Borrowable
              </Badge>
            </SimpleTooltip>
          )}
        </VStack>
      </VStack>

      <HStack ml={2}>
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
      </HStack>
    </Row>
  );
};
