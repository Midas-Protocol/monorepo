import { Box, Button, Text } from '@chakra-ui/react';
import { ComptrollerErrorCodes, FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants, ContractTransaction, utils } from 'ethers';
import LogRocket from 'logrocket';
import { useMemo, useState } from 'react';

import { CTokenErrorCodes } from '@midas-capital/types';
import { MidasBox } from '@ui/components/shared/Box';
import { Column, Row } from '@ui/components/shared/Flex';
import Loader from '@ui/components/shared/Loader';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import TransactionStepper from '@ui/components/shared/TransactionStepper';
import { DEFAULT_DECIMALS, REPAY_STEPS, UserAction } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast } from '@ui/hooks/useToast';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';
import { handleGenericError } from '@ui/utils/errorHandling';
import { fetchMaxAmount } from '@ui/utils/fetchMaxAmount';
import { toFixedNoRound } from '@ui/utils/formatNumber';
import { AmountInput } from './AmountInput';
import { StatsColumn } from './StatsColumn';
import { TokenNameAndMaxButton } from './TokenAmountAndMaxButton';

interface ModeRepayProps {
  asset: MarketData;
  assets: MarketData[];
  isBorrowPaused?: boolean;
  onClose: () => void;
  poolChainId: number;
}
const ModeRepay = ({
  assets,
  asset,
  isBorrowPaused = false,
  onClose,
  poolChainId,
}: ModeRepayProps) => {
  const { currentSdk, address, currentChain } = useMultiMidas();
  const addRecentTransaction = useAddRecentTransaction();
  if (!currentChain || !currentSdk) throw new Error("SDK doesn't exist");

  const errorToast = useErrorToast();

  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);

  const [userAction, setUserAction] = useState(UserAction.NO_ACTION);

  const [userEnteredAmount, _setUserEnteredAmount] = useState('');

  const [amount, _setAmount] = useState<BigNumber>(constants.Zero);

  const { cCard } = useColors();

  const { data: myBalance } = useTokenBalance(asset.underlyingToken);
  const { data: myNativeBalance } = useTokenBalance('NO_ADDRESS_HERE_USE_WETH_FOR_ADDRESS');

  const nativeSymbol = currentChain.nativeCurrency?.symbol;
  const optionToWrap =
    asset.underlyingToken === currentSdk.chainSpecificAddresses.W_TOKEN &&
    myBalance?.isZero() &&
    !myNativeBalance?.isZero();

  const steps = useMemo(() => {
    return optionToWrap ? ['Wrap Native Token', ...REPAY_STEPS] : [...REPAY_STEPS];
  }, [optionToWrap]);

  const queryClient = useQueryClient();

  const updateAmount = (newAmount: string) => {
    if (newAmount.startsWith('-') || !newAmount) {
      _setUserEnteredAmount('');
      _setAmount(constants.Zero);
      return;
    }

    _setUserEnteredAmount(newAmount);

    const bigAmount = utils.parseUnits(
      toFixedNoRound(newAmount, tokenData?.decimals || DEFAULT_DECIMALS),
      tokenData?.decimals
    );
    try {
      _setAmount(bigAmount);
    } catch (e) {
      // If the number was invalid, set the amount to null to disable confirming:
      _setAmount(constants.Zero);
    }

    setUserAction(UserAction.NO_ACTION);
  };

  const { data: amountIsValid } = useQuery(
    ['isValidRepayAmount', currentSdk.chainId, address, amount],
    async () => {
      if (!currentSdk || !address) return null;

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

  const depositOrWithdrawAlert = useMemo(() => {
    if (amount === null || amount.isZero()) return 'Enter a valid amount to repay.';
    if (amountIsValid === undefined) return `Loading your debt of ${asset.underlyingSymbol}...`;
    if (!amountIsValid)
      return `You don't have enough ${asset.underlyingSymbol} or are over-repaying!`;
    return null;
  }, [asset, amount, amountIsValid]);

  const onRepay = async () => {
    if (!currentSdk || !address) return;

    try {
      setUserAction(UserAction.WAITING_FOR_TRANSACTIONS);

      let tx: ContractTransaction;

      const isRepayingMax = amount.eq(asset.borrowBalance);
      const resp = await currentSdk.repay(
        asset.cToken,
        asset.underlyingToken,
        isRepayingMax,
        amount
      );

      if (resp.errorCode !== null) {
        fundOperationError(resp.errorCode);
      } else {
        tx = resp.tx;
        addRecentTransaction({
          hash: tx.hash,
          description: `${asset.underlyingSymbol} Token Repay`,
        });
        await tx.wait();
        await queryClient.refetchQueries();
      }

      onClose();
    } catch (e) {
      handleGenericError(e, errorToast);
      setUserAction(UserAction.NO_ACTION);
    }
  };

  return (
    <Column
      id="fundOperationModal"
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      bg={cCard.bgColor}
      color={cCard.txtColor}
      borderRadius={16}
    >
      {userAction === UserAction.WAITING_FOR_TRANSACTIONS ? (
        <Column expand mainAxisAlignment="center" crossAxisAlignment="center" p={4} pt={12}>
          <Loader />
          <Box py={4} w="100%" h="100%">
            {steps.length > 0 && (
              <TransactionStepper activeStep={activeStep} steps={steps} failedStep={failedStep} />
            )}
          </Box>
          <Text mt="30px" textAlign="center" variant="smText">
            Check your wallet to submit the transactions
          </Text>
          <Text variant="smText" mt="15px" textAlign="center">
            Do not close this tab until you submit all transactions!
          </Text>
        </Column>
      ) : (
        <>
          <Column
            mainAxisAlignment="flex-start"
            crossAxisAlignment="center"
            px={4}
            py={4}
            height="100%"
            width="100%"
          >
            <Column mainAxisAlignment="flex-start" crossAxisAlignment="flex-start" width="100%">
              <Row width="100%" mt={4} mainAxisAlignment="flex-end" crossAxisAlignment="center">
                <>
                  <Text variant="smText" mr={2}>
                    Wallet Balance:
                  </Text>
                  <SimpleTooltip
                    label={`${
                      myBalance ? utils.formatUnits(myBalance, asset.underlyingDecimals) : 0
                    } ${asset.underlyingSymbol}`}
                  >
                    <Text
                      maxWidth="300px"
                      textOverflow={'ellipsis'}
                      whiteSpace="nowrap"
                      overflow="hidden"
                    >
                      {myBalance ? utils.formatUnits(myBalance, asset.underlyingDecimals) : 0}{' '}
                      {asset.underlyingSymbol}
                    </Text>
                  </SimpleTooltip>
                </>
              </Row>
              {optionToWrap ? (
                <Row width="100%" mt={4} mainAxisAlignment="flex-end" crossAxisAlignment="center">
                  <Text variant="smText" mr={2}>
                    Native Token Balance:
                  </Text>
                  <Text variant="smText">
                    {myNativeBalance
                      ? utils.formatUnits(myNativeBalance, asset.underlyingDecimals)
                      : 0}{' '}
                    {nativeSymbol}
                  </Text>
                </Row>
              ) : null}

              <MidasBox width="100%" height="70px" mt={3}>
                <Row
                  width="100%"
                  p={4}
                  mainAxisAlignment="space-between"
                  crossAxisAlignment="center"
                  expand
                >
                  <AmountInput
                    displayAmount={userEnteredAmount}
                    updateAmount={updateAmount}
                    disabled={isBorrowPaused}
                    autoFocus
                  />
                  <TokenNameAndMaxButton
                    mode={FundOperationMode.REPAY}
                    asset={asset}
                    updateAmount={updateAmount}
                    optionToWrap={optionToWrap}
                    poolChainId={poolChainId}
                  />
                </Row>
              </MidasBox>
            </Column>

            <StatsColumn
              amount={amount}
              assets={assets}
              asset={asset}
              mode={FundOperationMode.REPAY}
              poolChainId={poolChainId}
            />

            <Button
              id="confirmFund"
              mt={4}
              width="100%"
              onClick={onRepay}
              isDisabled={!amountIsValid}
              height={16}
            >
              {`${optionToWrap ? `Wrap ${nativeSymbol} & ` : ''} Repay`}
            </Button>
          </Column>
        </>
      )}
    </Column>
  );
};

export default ModeRepay;

export function fundOperationError(errorCode: number) {
  let err;

  if (errorCode >= 1000) {
    const comptrollerResponse = errorCode - 1000;
    let msg = ComptrollerErrorCodes[comptrollerResponse];

    // This is a comptroller error:
    err = new Error('Comptroller Error: ' + msg);
  } else {
    // This is a standard token error:
    err = new Error('CToken Code: ' + CTokenErrorCodes[errorCode]);
  }

  LogRocket.captureException(err);
  throw err;
}
