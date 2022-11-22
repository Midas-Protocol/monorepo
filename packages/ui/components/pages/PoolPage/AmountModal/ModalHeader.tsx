import { Box, Text } from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';

import { Row } from '@ui/components/shared/Flex';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';

export const ModalHeader = ({
  asset,
  mode,
  poolChainId,
}: {
  asset: MarketData;
  mode: FundOperationMode;
  poolChainId: number;
}) => {
  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);

  return (
    <Row
      width="100%"
      mainAxisAlignment="center"
      crossAxisAlignment="center"
      p={4}
      height="72px"
      flexShrink={0}
    >
      <Box height="36px" width="36px">
        <TokenIcon size="36" address={asset.underlyingToken} chainId={poolChainId} />
      </Box>
      <Text id="symbol" variant="title" fontWeight="bold" ml={3}>
        {tokenData?.symbol || asset.underlyingSymbol}
      </Text>
    </Row>
  );
};
