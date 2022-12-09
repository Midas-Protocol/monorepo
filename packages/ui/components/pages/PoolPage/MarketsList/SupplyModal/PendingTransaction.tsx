import { Box, Button, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { BigNumber, utils } from 'ethers';
import { BsFillCheckCircleFill, BsFillXCircleFill } from 'react-icons/bs';
import { Address } from 'wagmi';

import { Column } from '@ui/components/shared/Flex';
import Loader from '@ui/components/shared/Loader';
import TransactionStepper from '@ui/components/shared/TransactionStepper';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { TxStep } from '@ui/types/ComponentPropsType';
import { MarketData } from '@ui/types/TokensDataMap';

export const PendingTransaction = ({
  activeStep,
  failedStep,
  steps,
  isSupplying,
  poolChainId,
  amount,
  asset,
}: {
  activeStep: number;
  failedStep: number;
  steps: TxStep[];
  isSupplying: boolean;
  poolChainId: number;
  amount: BigNumber;
  asset: MarketData;
}) => {
  const amountNum = utils.formatUnits(amount, asset.underlyingDecimals);

  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  const addToken = async () => {
    const ethereum = window.ethereum;

    if (!ethereum) {
      errorToast({ title: 'Error', description: 'Wallet could not be found!' });

      return false;
    }
    try {
      const added = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: asset.cToken,
            symbol: asset.underlyingSymbol,
            decimals: Number(asset.underlyingDecimals),
          },
        } as {
          type: 'ERC20';
          options: {
            address: Address;
            decimals: number;
            symbol: string;
          };
        },
      });

      if (added) {
        successToast({ title: 'Added', description: 'Token is successfully added to wallet' });
      }

      return added;
    } catch (error) {
      return false;
    }
  };

  return (
    <Column expand mainAxisAlignment="center" crossAxisAlignment="center" p={4} pt={12}>
      {isSupplying ? (
        <Loader />
      ) : failedStep === 0 ? (
        <VStack width="100%">
          <Icon as={BsFillCheckCircleFill} width={70} height={70} color={'success'} />
          <Text variant="mdText" fontWeight="bold">
            All Done!
          </Text>
          <Text variant="mdText" fontWeight="bold">
            You supplied {amountNum} {asset.underlyingSymbol}
          </Text>
          <Flex width="100%" justifyContent="flex-end">
            <Button onClick={addToken} variant={'ghost'} size="sm">
              Add token to wallet
            </Button>
          </Flex>
        </VStack>
      ) : (
        <VStack>
          <Icon as={BsFillXCircleFill} width={70} height={70} color={'fail'} />
          <Text variant="mdText" fontWeight="bold">
            Failed!
          </Text>
        </VStack>
      )}
      <Box py={4} w="100%" h="100%">
        <TransactionStepper
          activeStep={activeStep}
          steps={steps}
          failedStep={failedStep}
          isSupplying={isSupplying}
          poolChainId={poolChainId}
        />
      </Box>
      <Text mt={4} textAlign="center" variant="smText">
        Check your wallet to submit the transactions
      </Text>
      <Text variant="smText" mt={2} textAlign="center">
        Do not close this modal until you submit all transactions!
      </Text>
    </Column>
  );
};
