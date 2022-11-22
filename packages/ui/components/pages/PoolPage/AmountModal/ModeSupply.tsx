import { Box, Button, Switch, Text } from '@chakra-ui/react';
import { WETHAbi } from '@midas-capital/sdk';
import { ComptrollerErrorCodes, FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants, ContractTransaction, utils } from 'ethers';
import LogRocket from 'logrocket';
import { useMemo, useState } from 'react';
import { getContract } from 'sdk/dist/cjs/src/MidasSdk/utils';

import { CTokenErrorCodes } from '@midas-capital/types';
import { MidasBox } from '@ui/components/shared/Box';
import { Column, Row } from '@ui/components/shared/Flex';
import Loader from '@ui/components/shared/Loader';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import TransactionStepper from '@ui/components/shared/TransactionStepper';
import { DEFAULT_DECIMALS, SUPPLY_STEPS, UserAction } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';
import { handleGenericError } from '@ui/utils/errorHandling';
import { toFixedNoRound } from '@ui/utils/formatNumber';
import { AmountInput } from './AmountInput';
import { StatsColumn } from './StatsColumn';
import { TokenNameAndMaxButton } from './TokenAmountAndMaxButton';

interface ModeSupplyProps {
  asset: MarketData;
  assets: MarketData[];
  comptrollerAddress: string;
  onClose: () => void;
  poolChainId: number;
}
export const ModeSupply = ({
  assets,
  comptrollerAddress,
  asset,
  poolChainId,
  onClose,
}: ModeSupplyProps) => {
  const { currentSdk, address, currentChain } = useMultiMidas();
  if (!currentChain || !currentSdk) throw new Error("SDK doesn't exist");

  const addRecentTransaction = useAddRecentTransaction();
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);

  const [userAction, setUserAction] = useState(UserAction.NO_ACTION);

  const [userEnteredAmount, _setUserEnteredAmount] = useState('');

  const [amount, _setAmount] = useState<BigNumber>(constants.Zero);

  const showEnableAsCollateral = !asset.membership;
  const [enableAsCollateral, setEnableAsCollateral] = useState(showEnableAsCollateral);
  const { cCard } = useColors();

  const { data: myBalance } = useTokenBalance(asset.underlyingToken);
  const { data: myNativeBalance } = useTokenBalance('NO_ADDRESS_HERE_USE_WETH_FOR_ADDRESS');

  const [isDeploying, setIsDeploying] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [failedStep, setFailedStep] = useState<number>(0);
  const optionToWrap =
    asset.underlyingToken === currentSdk.chainSpecificAddresses.W_TOKEN &&
    myBalance?.isZero() &&
    !myNativeBalance?.isZero();
  const steps = useMemo(() => {
    return optionToWrap ? ['Wrap Native Token', ...SUPPLY_STEPS] : [...SUPPLY_STEPS];
  }, [optionToWrap]);

  const nativeSymbol = currentChain.nativeCurrency?.symbol;

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

  const amountIsValid = useMemo(() => {
    if (amount.isZero()) return false;
    if (optionToWrap && myNativeBalance) {
      return amount.lte(myNativeBalance);
    }
    if (myBalance) {
      return amount.lte(myBalance as BigNumber);
    }
    return false;
  }, [optionToWrap, myBalance, myNativeBalance, amount]);

  const depositOrWithdrawAlert = useMemo(() => {
    if (amount === null || amount.isZero()) return 'Enter a valid amount to supply.';
    if (amountIsValid === undefined) return `Loading your balance of ${asset.underlyingSymbol}...`;
    if (!amountIsValid) return `You don't have enough ${asset.underlyingSymbol}!`;
    return null;
  }, [amount]);

  const onSupply = async () => {
    if (!currentSdk || !address) return;

    try {
      setUserAction(UserAction.WAITING_FOR_TRANSACTIONS);

      let tx: ContractTransaction;

      try {
        setActiveStep(0);
        setFailedStep(0);
        setIsDeploying(true);
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

          await currentSdk.enterMarkets(asset.cToken, comptrollerAddress, enableAsCollateral);

          successToast({
            id: 'collateralEnabled',
            description: 'Collateral enabled!',
          });
        } catch (error) {
          setFailedStep(optionToWrap ? 3 : 2);
          throw error;
        }

        try {
          setActiveStep(optionToWrap ? 4 : 3);
          const { tx, errorCode } = await currentSdk.mint(asset.cToken, amount);
          if (errorCode !== null) {
            fundOperationError(errorCode);
          } else {
            addRecentTransaction({
              hash: tx.hash,
              description: `${asset.underlyingSymbol} Token Supply`,
            });
            await tx.wait();
            await queryClient.refetchQueries();
          }
        } catch (error) {
          setFailedStep(optionToWrap ? 4 : 3);
          throw error;
        }
      } catch (error) {
        setIsDeploying(false);
        handleGenericError(error, errorToast);

        return;
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
                    disabled={asset.isBorrowPaused}
                    autoFocus
                  />
                  <TokenNameAndMaxButton
                    mode={FundOperationMode.SUPPLY}
                    asset={asset}
                    updateAmount={updateAmount}
                    optionToWrap={optionToWrap}
                    poolChainId={poolChainId}
                  />
                </Row>
              </MidasBox>

              <Row width="100%" mt={1} mainAxisAlignment="flex-end" crossAxisAlignment="center">
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
            </Column>

            <>
              <StatsColumn
                amount={amount}
                assets={assets}
                asset={asset}
                mode={FundOperationMode.SUPPLY}
                enableAsCollateral={enableAsCollateral}
                poolChainId={poolChainId}
              />

              {showEnableAsCollateral ? (
                <MidasBox p={4} width="100%" mt={4}>
                  <Row mainAxisAlignment="space-between" crossAxisAlignment="center" width="100%">
                    <Text variant="smText" fontWeight="bold">
                      Enable As Collateral:
                    </Text>
                    <Switch
                      h="20px"
                      isChecked={enableAsCollateral}
                      onChange={() => {
                        setEnableAsCollateral((past) => !past);
                      }}
                    />
                  </Row>
                </MidasBox>
              ) : null}
            </>

            <Button
              id="confirmFund"
              mt={4}
              width="100%"
              onClick={onSupply}
              isDisabled={!amountIsValid}
              height={16}
            >
              {isDeploying
                ? SUPPLY_STEPS[activeStep]
                : depositOrWithdrawAlert ??
                  `${optionToWrap ? `Wrap ${nativeSymbol} & ` : ''}Confirm`}
            </Button>
          </Column>
        </>
      )}
    </Column>
  );
};

export default ModeSupply;

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
