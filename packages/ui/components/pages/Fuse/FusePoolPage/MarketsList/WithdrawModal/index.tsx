import {
  Box,
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
} from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants } from 'ethers';
import LogRocket from 'logrocket';
import { useEffect, useState } from 'react';

import { AmountInput } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/WithdrawModal/AmountInput';
import { Balance } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/WithdrawModal/Balance';
import { PendingTransaction } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/WithdrawModal/PendingTransaction';
import { Stats } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/WithdrawModal/Stats';
import { WithdrawError } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/WithdrawModal/WithdrawError';
import { Column, Row } from '@ui/components/shared/Flex';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast } from '@ui/hooks/useToast';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';
import { handleGenericError } from '@ui/utils/errorHandling';
import { fetchMaxAmount } from '@ui/utils/fetchMaxAmount';

interface WithdrawModalProps {
  isOpen: boolean;
  asset: MarketData;
  assets: MarketData[];
  onClose: () => void;
  poolChainId: number;
}

export const WithdrawModal = ({
  isOpen,
  asset,
  assets,
  onClose,
  poolChainId,
}: WithdrawModalProps) => {
  const { currentSdk, address, currentChain } = useMultiMidas();
  const addRecentTransaction = useAddRecentTransaction();
  if (!currentChain || !currentSdk) throw new Error("SDK doesn't exist");

  const errorToast = useErrorToast();

  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);
  const [btnStr, setBtnStr] = useState<string>('Withdraw');
  const [amount, setAmount] = useState<BigNumber>(constants.Zero);
  const { cCard } = useColors();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const queryClient = useQueryClient();

  const { data: amountIsValid, isLoading } = useQuery(
    ['ValidAmount', amount, currentSdk.chainId, address],
    async () => {
      if (!currentSdk || !address) return null;

      if (amount.isZero()) {
        return false;
      }

      try {
        const max = (await fetchMaxAmount(
          FundOperationMode.WITHDRAW,
          currentSdk,
          address,
          asset
        )) as BigNumber;

        return amount.lte(max);
      } catch (e) {
        handleGenericError(e, errorToast);
        return false;
      }
    }
  );

  useEffect(() => {
    if (amount.isZero()) {
      setBtnStr('Enter a valid amount to withdraw');
    } else if (isLoading) {
      setBtnStr(`Loading available balance of ${asset.underlyingSymbol}...`);
    } else {
      if (amountIsValid) {
        setBtnStr('Withdraw');
      } else {
        setBtnStr(`You cannot withdraw this much!`);
      }
    }
  }, [amount, isLoading, amountIsValid, asset.underlyingSymbol]);

  const onConfirm = async () => {
    if (!currentSdk || !address) return;

    try {
      setIsWithdrawing(true);

      const maxAmount = await fetchMaxAmount(
        FundOperationMode.WITHDRAW,
        currentSdk,
        address,
        asset
      );
      let resp;
      if (maxAmount.eq(amount)) {
        resp = await currentSdk.withdraw(asset.cToken, constants.MaxUint256);
      } else {
        resp = await currentSdk.withdraw(asset.cToken, amount);
      }

      if (resp.errorCode !== null) {
        WithdrawError(resp.errorCode);
      } else {
        const tx = resp.tx;
        addRecentTransaction({
          hash: tx.hash,
          description: `${asset.underlyingSymbol} Token Withdraw`,
        });
        await tx.wait();
        await queryClient.refetchQueries();
      }

      LogRocket.track('Fuse-Withdraw');

      onClose();
    } catch (e) {
      handleGenericError(e, errorToast);
    } finally {
      setAmount(constants.Zero);
      setIsWithdrawing(false);
    }
  };

  return (
    <Modal
      motionPreset="slideInBottom"
      isOpen={isOpen}
      onClose={() => {
        setAmount(constants.Zero);
        onClose();
      }}
      isCentered
    >
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          <Column
            id="fundOperationModal"
            mainAxisAlignment="flex-start"
            crossAxisAlignment="flex-start"
            bg={cCard.bgColor}
            color={cCard.txtColor}
            borderRadius={16}
          >
            {isWithdrawing ? (
              <PendingTransaction />
            ) : (
              <>
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
                    {tokenData?.symbol || asset.underlyingSymbol} Withdraw
                  </Text>
                </Row>
                <Divider />
                <Column
                  mainAxisAlignment="flex-start"
                  crossAxisAlignment="center"
                  px={4}
                  py={4}
                  height="100%"
                  width="100%"
                >
                  <Balance asset={asset} />
                  <AmountInput asset={asset} poolChainId={poolChainId} setAmount={setAmount} />
                  <Stats amount={amount} assets={assets} asset={asset} poolChainId={poolChainId} />
                  <Button
                    id="confirmFund"
                    mt={4}
                    width="100%"
                    onClick={onConfirm}
                    isDisabled={!amountIsValid}
                    height={16}
                  >
                    {btnStr}
                  </Button>
                </Column>
              </>
            )}
          </Column>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
