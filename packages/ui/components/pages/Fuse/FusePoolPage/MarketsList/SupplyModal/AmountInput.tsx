import { Box, Button, Input, Text } from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';

import { MidasBox } from '@ui/components/shared/Box';
import { Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { TokenIcon } from '@ui/components/shared/TokenIcon';

export const AmountInput = () => {
  return (
    <MidasBox width="100%" height="70px" mt={3}>
      <Row width="100%" p={4} mainAxisAlignment="space-between" crossAxisAlignment="center" expand>
        <Input
          id="fundInput"
          type="number"
          inputMode="decimal"
          fontSize={22}
          fontWeight="bold"
          variant="unstyled"
          placeholder="0.0"
          value={userEnteredAmount}
          onChange={(event) => updateAmount(event.target.value)}
          mr={4}
          disabled={isBorrowPaused}
          autoFocus
        />
        <Row mainAxisAlignment="flex-start" crossAxisAlignment="center" flexShrink={0}>
          <Row mainAxisAlignment="flex-start" crossAxisAlignment="center">
            <Box height={8} width={8} mr={1}>
              <TokenIcon size="sm" address={asset.underlyingToken} chainId={poolChainId} />
            </Box>
            <SimpleTooltip
              label={optionToWrap ? asset.underlyingSymbol.slice(1) : asset.underlyingSymbol}
            >
              <Text
                variant="mdText"
                fontWeight="bold"
                mr={2}
                flexShrink={0}
                maxWidth="100px"
                textOverflow={'ellipsis'}
                whiteSpace="nowrap"
                overflow="hidden"
              >
                {optionToWrap ? asset.underlyingSymbol.slice(1) : asset.underlyingSymbol}
              </Text>
            </SimpleTooltip>
          </Row>
          <Button
            height={{ lg: 8, md: 8, sm: 8, base: 8 }}
            px={{ lg: 2, md: 2, sm: 2, base: 2 }}
            onClick={setToMax}
            isLoading={isLoading}
          >
            MAX
          </Button>
        </Row>
        <TokenNameAndMaxButton
          mode={FundOperationMode.SUPPLY}
          asset={asset}
          updateAmount={updateAmount}
          optionToWrap={optionToWrap}
          poolChainId={poolChainId}
        />
      </Row>
    </MidasBox>
  );
};
