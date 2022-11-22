import { Box, Button, Text } from '@chakra-ui/react';
import { FundOperationMode, NativePricedFuseAsset } from '@midas-capital/types';
import { BigNumber, constants, utils } from 'ethers';
import { useState } from 'react';

import { Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useBorrowMinimum } from '@ui/hooks/useBorrowMinimum';
import { useErrorToast } from '@ui/hooks/useToast';
import { handleGenericError } from '@ui/utils/errorHandling';
import { fetchMaxAmount } from '@ui/utils/fetchMaxAmount';

export const TokenNameAndMaxButton = ({
  updateAmount,
  asset,
  mode,
  optionToWrap = false,
  poolChainId,
}: {
  asset: NativePricedFuseAsset;
  mode: FundOperationMode;
  updateAmount: (newAmount: string) => void;
  optionToWrap?: boolean;
  poolChainId: number;
}) => {
  const { currentSdk, address } = useMultiMidas();

  const errorToast = useErrorToast();

  const [isLoading, setIsLoading] = useState(false);
  const {
    data: { minBorrowAsset },
  } = useBorrowMinimum(asset, poolChainId);

  const setToMax = async () => {
    if (!currentSdk || !address) return;

    setIsLoading(true);

    try {
      let maxBN;
      if (optionToWrap) {
        maxBN = await currentSdk.signer.getBalance();
      } else {
        maxBN = (await fetchMaxAmount(mode, currentSdk, address, asset)) as BigNumber;
      }

      if (maxBN.lt(constants.Zero) || maxBN.isZero()) {
        updateAmount('');
      } else {
        const str = utils.formatUnits(maxBN, asset.underlyingDecimals);
        updateAmount(str);
      }

      setIsLoading(false);
    } catch (e) {
      handleGenericError(e, errorToast);
    }
  };

  const setToMin = () => {
    setIsLoading(true);

    try {
      if (minBorrowAsset) {
        updateAmount(utils.formatUnits(minBorrowAsset, asset.underlyingDecimals));
      } else {
        updateAmount('');
      }

      setIsLoading(false);
    } catch (e) {
      handleGenericError(e, errorToast);
    }
  };

  return (
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

      {mode !== FundOperationMode.BORROW ? (
        <Button
          height={{ lg: 8, md: 8, sm: 8, base: 8 }}
          px={{ lg: 2, md: 2, sm: 2, base: 2 }}
          onClick={setToMax}
          isLoading={isLoading}
        >
          MAX
        </Button>
      ) : (
        <Button
          height={{ lg: 8, md: 8, sm: 8, base: 8 }}
          px={{ lg: 2, md: 2, sm: 2, base: 2 }}
          onClick={setToMin}
          isLoading={isLoading}
        >
          MIN
        </Button>
      )}
    </Row>
  );
};
