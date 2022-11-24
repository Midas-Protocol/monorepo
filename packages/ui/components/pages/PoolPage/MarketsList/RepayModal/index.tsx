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
import { WETHAbi } from '@midas-capital/sdk';
import { FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants } from 'ethers';
import { useEffect, useState } from 'react';
import { getContract } from 'sdk/dist/cjs/src/MidasSdk/utils';

import { Balance } from '@ui/components/pages/PoolPage/MarketsList/RepayModal//Balance';
import { PendingTransaction } from '@ui/components/pages/PoolPage/MarketsList/RepayModal//PendingTransaction';
import { RepayError } from '@ui/components/pages/PoolPage/MarketsList/RepayModal//RepayError';
import { AmountInput } from '@ui/components/pages/PoolPage/MarketsList/RepayModal/AmountInput';
import { StatsColumn } from '@ui/components/pages/PoolPage/MarketsList/StatsColumn';
import { Column, Row } from '@ui/components/shared/Flex';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { REPAY_STEPS } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';
import { handleGenericError } from '@ui/utils/errorHandling';
import { fetchMaxAmount } from '@ui/utils/fetchMaxAmount';

interface RepayModalProps {
  isOpen: boolean;
  asset: MarketData;
  assets: MarketData[];
  onClose: () => void;
  poolChainId: number;
}

export const RepayModal = ({ isOpen, asset, assets, onClose, poolChainId }: RepayModalProps) => {
  const { currentSdk, address, currentChain } = useMultiMidas();
  const addRecentTransaction = useAddRecentTransaction();
  if (!currentChain || !currentSdk) throw new Error("SDK doesn't exist");

  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);
  const [amount, setAmount] = useState<BigNumber>(constants.Zero);
  const { cCard } = useColors();

  const { data: myBalance } = useTokenBalance(asset.underlyingToken);
  const { data: myNativeBalance } = useTokenBalance('NO_ADDRESS_HERE_USE_WETH_FOR_ADDRESS');

  const [isRepaying, setIsRepaying] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [failedStep, setFailedStep] = useState<number>(0);
  const [btnStr, setBtnStr] = useState<string>('Repay');
  const [steps, setSteps] = useState<string[]>([]);
  const nativeSymbol = currentChain.nativeCurrency?.symbol;
  const optionToWrap =
    asset.underlyingToken === currentSdk.chainSpecificAddresses.W_TOKEN &&
    myBalance?.isZero() &&
    !myNativeBalance?.isZero();

  const queryClient = useQueryClient();

  const { data: amountIsValid, isLoading } = useQuery(
    ['ValidAmount', amount, currentSdk.chainId, address],
    async () => {
      if (!currentSdk || !address) return null;

      if (amount.isZero()) {
        return false;
      }

      try {
        const max = optionToWrap
          ? (myNativeBalance as BigNumber)
          : ((await fetchMaxAmount(
              FundOperationMode.REPAY,
              currentSdk,
              address,
              asset
            )) as BigNumber);

        return amount.lte(max);
      } catch (e) {
        handleGenericError(e, errorToast);
        return false;
      }
    }
  );

  useEffect(() => {
    if (amount.isZero()) {
      setBtnStr('Enter a valid amount to repay');
    } else if (isLoading) {
      setBtnStr(`Loading your balance of ${asset.underlyingSymbol}...`);
    } else {
      if (amountIsValid) {
        setBtnStr('Repay');
      } else {
        setBtnStr(`You don't have enough ${asset.underlyingSymbol}`);
      }
    }
  }, [amount, isLoading, amountIsValid, asset.underlyingSymbol]);

  const onConfirm = async () => {
    if (!currentSdk || !address) return;

    try {
      setIsRepaying(true);
      setActiveStep(0);
      setFailedStep(0);
      if (optionToWrap) {
        try {
          setActiveStep(1);
          const WToken = getContract(
            currentSdk.chainSpecificAddresses.W_TOKEN,
            WETHAbi,
            currentSdk.signer
          );
          const resp = await WToken.deposit({ from: address, value: amount });
          addRecentTransaction({
            hash: resp.hash,
            description: `Wrap ${nativeSymbol}`,
          });
          successToast({
            id: 'wrapped',
            description: 'Successfully Wrapped!',
          });
        } catch (error) {
          setFailedStep(1);
          throw error;
        }
      }

      try {
        setActiveStep(optionToWrap ? 2 : 1);
        await currentSdk.approve(asset.cToken, asset.underlyingToken, amount);
        successToast({
          id: 'approved',
          description: 'Successfully Approved!',
        });
      } catch (error) {
        setFailedStep(optionToWrap ? 2 : 1);
        throw error;
      }

      try {
        setActiveStep(optionToWrap ? 3 : 2);
        const isRepayingMax = amount.eq(asset.borrowBalance);
        const resp = await currentSdk.repayBorrow(asset.cToken, isRepayingMax, amount);

        if (resp.errorCode !== null) {
          RepayError(resp.errorCode);
        } else {
          const tx = resp.tx;
          addRecentTransaction({
            hash: tx.hash,
            description: `${asset.underlyingSymbol} Token Repay`,
          });
          await tx.wait();
          await queryClient.refetchQueries();
        }
        successToast({
          id: 'repaid',
          description: 'Repaid!',
        });
      } catch (error) {
        setFailedStep(optionToWrap ? 3 : 2);
        throw error;
      }
    } catch (e) {
      handleGenericError(e, errorToast);
      setIsRepaying(false);
    } finally {
      setAmount(constants.Zero);
      onClose();
    }
  };

  useEffect(() => {
    optionToWrap ? setSteps(['Wrap Native Token', ...REPAY_STEPS]) : setSteps([...REPAY_STEPS]);
  }, [optionToWrap]);

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
            {isRepaying ? (
              <PendingTransaction activeStep={activeStep} failedStep={failedStep} steps={steps} />
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
                    {tokenData?.symbol || asset.underlyingSymbol} Repay
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
                  <AmountInput
                    asset={asset}
                    optionToWrap={optionToWrap}
                    poolChainId={poolChainId}
                    setAmount={setAmount}
                  />
                  <StatsColumn
                    mode={FundOperationMode.REPAY}
                    amount={amount}
                    assets={assets}
                    asset={asset}
                    poolChainId={poolChainId}
                  />
                  <Button
                    id="confirmFund"
                    mt={4}
                    width="100%"
                    onClick={onConfirm}
                    isDisabled={!amountIsValid}
                    height={16}
                  >
                    {optionToWrap ? `Wrap ${nativeSymbol} & ${btnStr}` : btnStr}
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
