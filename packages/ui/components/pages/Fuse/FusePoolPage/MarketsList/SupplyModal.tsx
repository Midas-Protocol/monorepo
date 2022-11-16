import {
  Box,
  Button,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Switch,
  Text,
} from '@chakra-ui/react';
import { WETHAbi } from '@midas-capital/sdk';
import { ComptrollerErrorCodes, CTokenErrorCodes, FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants, utils } from 'ethers';
import LogRocket from 'logrocket';
import { useEffect, useState } from 'react';
import { getContract } from 'sdk/dist/cjs/src/MidasSdk/utils';

import { TokenNameAndMaxButton } from './TokenNameAndMaxButton';

import { MidasBox } from '@ui/components/shared/Box';
import { Column, Row } from '@ui/components/shared/Flex';
import Loader from '@ui/components/shared/Loader';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import TransactionStepper from '@ui/components/shared/TransactionStepper';
import { DEFAULT_DECIMALS, SUPPLY_STEPS, UserAction } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useIsMobile } from '@ui/hooks/useScreenSize';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';
import { handleGenericError } from '@ui/utils/errorHandling';
import { fetchMaxAmount } from '@ui/utils/fetchMaxAmount';
import { toFixedNoRound } from '@ui/utils/formatNumber';

interface SupplyModalProps {
  isOpen: boolean;
  asset: MarketData;
  assets: MarketData[];
  comptrollerAddress: string;
  isBorrowPaused?: boolean;
  onClose: () => void;
  poolChainId: number;
}

export const SupplyModal = ({
  isOpen,
  asset,
  assets,
  comptrollerAddress,
  isBorrowPaused,
  onClose,
  poolChainId,
}: SupplyModalProps) => {
  const { currentSdk, address, currentChain } = useMultiMidas();
  const addRecentTransaction = useAddRecentTransaction();
  if (!currentChain || !currentSdk) throw new Error("SDK doesn't exist");

  const errorToast = useErrorToast();
  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);
  const [userAction, setUserAction] = useState(UserAction.NO_ACTION);
  const [userEnteredAmount, _setUserEnteredAmount] = useState('');
  const [amount, _setAmount] = useState<BigNumber>(constants.Zero);
  const [enableAsCollateral, setEnableAsCollateral] = useState(!asset.membership);
  const { cCard } = useColors();
  const { data: myBalance } = useTokenBalance(asset.underlyingToken);
  const { data: myNativeBalance } = useTokenBalance('NO_ADDRESS_HERE_USE_WETH_FOR_ADDRESS');
  const [isDeploying, setIsDeploying] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [failedStep, setFailedStep] = useState<number>(0);
  const [steps, setSteps] = useState<string[]>([]);
  const successToast = useSuccessToast();
  const nativeSymbol = currentChain.nativeCurrency?.symbol;
  const optionToWrap =
    asset.underlyingToken === currentSdk.chainSpecificAddresses.W_TOKEN &&
    myBalance?.isZero() &&
    !myNativeBalance?.isZero();
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
    ['ValidAmount', amount, currentSdk.chainId, address],
    async () => {
      if (!currentSdk || !address) return null;

      if (amount === null || amount.isZero()) {
        return false;
      }

      try {
        const max = optionToWrap
          ? (myNativeBalance as BigNumber)
          : ((await fetchMaxAmount(
              FundOperationMode.SUPPLY,
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

  let depositOrWithdrawAlert = null;
  if (amount === null || amount.isZero()) {
    depositOrWithdrawAlert = 'Enter a valid amount to supply.';
  } else if (amountIsValid === undefined) {
    depositOrWithdrawAlert = `Loading your balance of ${asset.underlyingSymbol}...`;
  } else if (!amountIsValid) {
    depositOrWithdrawAlert = `You don't have enough ${asset.underlyingSymbol}!`;
  } else {
    depositOrWithdrawAlert = null;
  }

  const isMobile = useIsMobile();

  const length = depositOrWithdrawAlert?.length ?? 0;
  let depositOrWithdrawAlertFontSize;
  if (length < 40) {
    depositOrWithdrawAlertFontSize = !isMobile ? 'xl' : '17px';
  } else if (length < 50) {
    depositOrWithdrawAlertFontSize = !isMobile ? '15px' : '11px';
  } else if (length < 60) {
    depositOrWithdrawAlertFontSize = !isMobile ? '14px' : '10px';
  }

  const onConfirm = async () => {
    if (!currentSdk || !address) return;

    try {
      setUserAction(UserAction.WAITING_FOR_TRANSACTIONS);

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

            setUserAction(UserAction.WAITING_FOR_TRANSACTIONS);

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
            SupplyError(errorCode);
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

  useEffect(() => {
    optionToWrap ? setSteps(['Wrap Native Token', ...SUPPLY_STEPS]) : setSteps([...SUPPLY_STEPS]);
  }, [optionToWrap]);

  return (
    <Modal motionPreset="slideInBottom" isOpen={isOpen} onClose={onClose} isCentered>
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
            {userAction === UserAction.WAITING_FOR_TRANSACTIONS ? (
              <Column expand mainAxisAlignment="center" crossAxisAlignment="center" p={4} pt={12}>
                <Loader />
                <Box py={4} w="100%" h="100%">
                  <TransactionStepper
                    activeStep={activeStep}
                    steps={steps}
                    failedStep={failedStep}
                  />
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
                    {tokenData?.symbol || asset.underlyingSymbol} Supply
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
                  <Column
                    mainAxisAlignment="flex-start"
                    crossAxisAlignment="flex-start"
                    width="100%"
                  >
                    <Row
                      width="100%"
                      mt={4}
                      mainAxisAlignment="flex-end"
                      crossAxisAlignment="center"
                    >
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
                    </Row>
                    {optionToWrap && (
                      <Row
                        width="100%"
                        mt={4}
                        mainAxisAlignment="flex-end"
                        crossAxisAlignment="center"
                      >
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
                    )}

                    <MidasBox width="100%" height="70px" mt={3}>
                      <Row
                        width="100%"
                        p={4}
                        mainAxisAlignment="space-between"
                        crossAxisAlignment="center"
                        expand
                      >
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
                        <Row
                          mainAxisAlignment="flex-start"
                          crossAxisAlignment="center"
                          flexShrink={0}
                        >
                          <Row mainAxisAlignment="flex-start" crossAxisAlignment="center">
                            <Box height={8} width={8} mr={1}>
                              <TokenIcon
                                size="sm"
                                address={asset.underlyingToken}
                                chainId={poolChainId}
                              />
                            </Box>
                            <SimpleTooltip
                              label={
                                optionToWrap
                                  ? asset.underlyingSymbol.slice(1)
                                  : asset.underlyingSymbol
                              }
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
                                {optionToWrap
                                  ? asset.underlyingSymbol.slice(1)
                                  : asset.underlyingSymbol}
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
                  </Column>

                  <StatsColumn
                    amount={amount}
                    assets={assets}
                    asset={asset}
                    mode={mode}
                    enableAsCollateral={enableAsCollateral}
                    poolChainId={poolChainId}
                  />

                  {!asset.membership && (
                    <MidasBox p={4} width="100%" mt={4}>
                      <Row
                        mainAxisAlignment="space-between"
                        crossAxisAlignment="center"
                        width="100%"
                      >
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
                  )}
                  <Button
                    id="confirmFund"
                    mt={4}
                    width="100%"
                    className={
                      isMobile ||
                      depositOrWithdrawAlertFontSize === '14px' ||
                      depositOrWithdrawAlertFontSize === '15px'
                        ? 'confirm-button-disable-font-size-scale'
                        : ''
                    }
                    onClick={onConfirm}
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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export function SupplyError(errorCode: number) {
  let err;

  if (errorCode >= 1000) {
    const comptrollerResponse = errorCode - 1000;
    const msg = ComptrollerErrorCodes[comptrollerResponse];

    err = new Error('Comptroller Error: ' + msg);
  } else {
    err = new Error('CToken Code: ' + CTokenErrorCodes[errorCode]);
  }

  LogRocket.captureException(err);

  throw err;
}
