import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Divider,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { WETHAbi } from '@midas-capital/sdk';
import { FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { getContract } from 'sdk/dist/cjs/src/MidasSdk/utils';

import { StatsColumn } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/StatsColumn';
import { AmountInput } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/AmountInput';
import { Balance } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/Balance';
import { EnableCollateral } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/EnableCollateral';
import { PendingTransaction } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/PendingTransaction';
import { SupplyError } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/SupplyError';
import { EllipsisText } from '@ui/components/shared/EllipsisText';
import { Column } from '@ui/components/shared/Flex';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { SUPPLY_STEPS } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useMaxSupplyAmount } from '@ui/hooks/useMaxSupplyAmount';
import { useSupplyCap } from '@ui/hooks/useSupplyCap';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { useTokenData } from '@ui/hooks/useTokenData';
import { TxStep } from '@ui/types/ComponentPropsType';
import { MarketData } from '@ui/types/TokensDataMap';
import { smallFormatter } from '@ui/utils/bigUtils';
import { handleGenericError } from '@ui/utils/errorHandling';

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
  onClose,
  poolChainId,
}: SupplyModalProps) => {
  const { currentSdk, address, currentChain } = useMultiMidas();
  const addRecentTransaction = useAddRecentTransaction();
  if (!currentChain || !currentSdk) throw new Error("SDK doesn't exist");

  const errorToast = useErrorToast();
  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);
  const [amount, setAmount] = useState<BigNumber>(constants.Zero);
  const [enableAsCollateral, setEnableAsCollateral] = useState(!asset.membership);
  const { cCard } = useColors();
  const { data: myBalance } = useTokenBalance(asset.underlyingToken);
  const { data: myNativeBalance } = useTokenBalance('NO_ADDRESS_HERE_USE_WETH_FOR_ADDRESS');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSupplying, setIsSupplying] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [failedStep, setFailedStep] = useState<number>(0);
  const [btnStr, setBtnStr] = useState<string>('Supply');
  const [isAmountValid, setIsAmountValid] = useState<boolean>(false);
  const [steps, setSteps] = useState<TxStep[]>([...SUPPLY_STEPS(asset.underlyingSymbol)]);
  const [confirmedSteps, setConfirmedSteps] = useState<TxStep[]>([]);
  const successToast = useSuccessToast();
  const nativeSymbol = currentChain.nativeCurrency?.symbol;
  const optionToWrap = useMemo(() => {
    return (
      asset.underlyingToken === currentSdk.chainSpecificAddresses.W_TOKEN &&
      myBalance?.isZero() &&
      !myNativeBalance?.isZero()
    );
  }, [
    asset.underlyingToken,
    currentSdk.chainSpecificAddresses.W_TOKEN,
    myBalance,
    myNativeBalance,
  ]);

  const { data: supplyCap } = useSupplyCap({
    comptroller: comptrollerAddress,
    market: asset,
    chainId: poolChainId,
  });

  const { data: maxSupplyAmount, isLoading } = useMaxSupplyAmount(
    asset,
    comptrollerAddress,
    poolChainId
  );

  const queryClient = useQueryClient();

  useEffect(() => {
    if (amount.isZero() || !maxSupplyAmount) {
      setIsAmountValid(false);
    } else {
      const max = optionToWrap ? (myNativeBalance as BigNumber) : maxSupplyAmount.bigNumber;
      setIsAmountValid(amount.lte(max));
    }
  }, [amount, maxSupplyAmount, optionToWrap, myNativeBalance]);

  useEffect(() => {
    if (amount.isZero()) {
      setBtnStr('Enter a valid amount to supply');
    } else if (isLoading) {
      setBtnStr(`Loading your balance of ${asset.underlyingSymbol}...`);
    } else {
      if (isAmountValid) {
        setBtnStr('Supply');
      } else {
        setBtnStr(`You don't have enough ${asset.underlyingSymbol}`);
      }
    }
  }, [amount, isLoading, isAmountValid, asset.underlyingSymbol]);

  const onConfirm = async () => {
    if (!currentSdk || !address) return;

    const sentryProperties = {
      token: asset.cToken,
      chainId: currentSdk.chainId,
      comptroller: comptrollerAddress,
    };

    setIsConfirmed(true);
    setConfirmedSteps([...steps]);
    const _steps = [...steps];

    setIsSupplying(true);
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
        const tx = await WToken.deposit({ from: address, value: amount });

        addRecentTransaction({
          hash: tx.hash,
          description: `Wrap ${nativeSymbol}`,
        });
        _steps[0] = {
          ..._steps[0],
          txHash: tx.hash,
        };
        setConfirmedSteps([..._steps]);
        await tx.wait();
        _steps[0] = {
          ..._steps[0],
          done: true,
          txHash: tx.hash,
        };
        setConfirmedSteps([..._steps]);
        successToast({
          id: 'wrapped',
          description: 'Successfully Wrapped!',
        });
      } catch (error) {
        const sentryInfo = {
          contextName: 'Supply - Wrapping native token',
          properties: sentryProperties,
        };
        handleGenericError({ error, toast: errorToast, sentryInfo });
        setFailedStep(1);
      }
    }

    try {
      setActiveStep(optionToWrap ? 2 : 1);
      const token = currentSdk.getEIP20RewardTokenInstance(
        asset.underlyingToken,
        currentSdk.signer
      );
      const hasApprovedEnough = (await token.callStatic.allowance(address, asset.cToken)).gte(
        amount
      );

      if (!hasApprovedEnough) {
        const tx = await currentSdk.approve(asset.cToken, asset.underlyingToken);

        addRecentTransaction({
          hash: tx.hash,
          description: `Approve ${asset.underlyingSymbol}`,
        });
        _steps[optionToWrap ? 1 : 0] = {
          ..._steps[optionToWrap ? 1 : 0],
          txHash: tx.hash,
        };
        setConfirmedSteps([..._steps]);

        await tx.wait();

        _steps[optionToWrap ? 1 : 0] = {
          ..._steps[optionToWrap ? 1 : 0],
          done: true,
          txHash: tx.hash,
        };
        setConfirmedSteps([..._steps]);
        successToast({
          id: 'approved',
          description: 'Successfully Approved!',
        });
      } else {
        _steps[optionToWrap ? 1 : 0] = {
          ..._steps[optionToWrap ? 1 : 0],
          desc: 'Already approved!',
          done: true,
        };
        setConfirmedSteps([..._steps]);
      }
    } catch (error) {
      const sentryInfo = {
        contextName: 'Supply - Approving',
        properties: sentryProperties,
      };
      handleGenericError({ error, toast: errorToast, sentryInfo });
      setFailedStep(optionToWrap ? 2 : 1);
    }
    if (enableAsCollateral) {
      try {
        setActiveStep(optionToWrap ? 3 : 2);
        const tx = await currentSdk.enterMarkets(asset.cToken, comptrollerAddress);
        addRecentTransaction({
          hash: tx.hash,
          description: `Entered ${asset.underlyingSymbol} market`,
        });
        _steps[optionToWrap ? 2 : 1] = {
          ..._steps[optionToWrap ? 2 : 1],
          txHash: tx.hash,
        };
        setConfirmedSteps([..._steps]);

        await tx.wait();

        _steps[optionToWrap ? 2 : 1] = {
          ..._steps[optionToWrap ? 2 : 1],
          done: true,
          txHash: tx.hash,
        };
        setConfirmedSteps([..._steps]);
        successToast({
          id: 'collateralEnabled',
          description: 'Collateral enabled!',
        });
      } catch (error) {
        const sentryInfo = {
          contextName: 'Supply - Entering market',
          properties: sentryProperties,
        };
        handleGenericError({ error, toast: errorToast, sentryInfo });
        setFailedStep(optionToWrap ? 3 : 2);
      }
    }

    try {
      setActiveStep(
        optionToWrap && enableAsCollateral ? 4 : optionToWrap || enableAsCollateral ? 3 : 2
      );
      const { tx, errorCode } = await currentSdk.mint(asset.cToken, amount);
      if (errorCode !== null) {
        SupplyError(errorCode);
      } else {
        addRecentTransaction({
          hash: tx.hash,
          description: `${asset.underlyingSymbol} Token Supply`,
        });
        _steps[
          optionToWrap && enableAsCollateral ? 3 : optionToWrap || enableAsCollateral ? 2 : 1
        ] = {
          ..._steps[
            optionToWrap && enableAsCollateral ? 3 : optionToWrap || enableAsCollateral ? 2 : 1
          ],
          txHash: tx.hash,
        };
        setConfirmedSteps([..._steps]);

        await tx.wait();
        await queryClient.refetchQueries();

        _steps[
          optionToWrap && enableAsCollateral ? 3 : optionToWrap || enableAsCollateral ? 2 : 1
        ] = {
          ..._steps[
            optionToWrap && enableAsCollateral ? 3 : optionToWrap || enableAsCollateral ? 2 : 1
          ],
          done: true,
          txHash: tx.hash,
        };
        setConfirmedSteps([..._steps]);
      }
    } catch (error) {
      const sentryInfo = {
        contextName: 'Supply - Minting',
        properties: sentryProperties,
      };
      handleGenericError({ error, toast: errorToast, sentryInfo });
      setFailedStep(
        optionToWrap && enableAsCollateral ? 4 : optionToWrap || enableAsCollateral ? 3 : 2
      );
    }

    setIsSupplying(false);
  };

  const onModalClose = () => {
    onClose();

    if (!isSupplying) {
      setAmount(constants.Zero);
      setIsConfirmed(false);
      let _steps = [...SUPPLY_STEPS(asset.underlyingSymbol)];

      if (!enableAsCollateral) {
        _steps.splice(1, 1);
      }

      if (optionToWrap) {
        _steps = [
          { title: 'Wrap Native Token', desc: 'Wrap Native Token', done: false },
          ..._steps,
        ];
      }

      setSteps(_steps);
    }
  };

  useEffect(() => {
    let _steps = [...SUPPLY_STEPS(asset.underlyingSymbol)];

    if (!enableAsCollateral) {
      _steps.splice(1, 1);
    }

    if (optionToWrap) {
      _steps = [{ title: 'Wrap Native Token', desc: 'Wrap Native Token', done: false }, ..._steps];
    }

    setSteps(_steps);
  }, [optionToWrap, enableAsCollateral, asset.underlyingSymbol]);

  return (
    <Modal
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isCentered
      isOpen={isOpen}
      motionPreset="slideInBottom"
      onClose={onModalClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          <Column
            bg={cCard.bgColor}
            borderRadius={16}
            color={cCard.txtColor}
            crossAxisAlignment="flex-start"
            id="fundOperationModal"
            mainAxisAlignment="flex-start"
          >
            {!isSupplying && <ModalCloseButton right={4} top={4} />}
            {isConfirmed ? (
              <PendingTransaction
                activeStep={activeStep}
                amount={amount}
                asset={asset}
                failedStep={failedStep}
                isSupplying={isSupplying}
                poolChainId={poolChainId}
                steps={confirmedSteps}
              />
            ) : (
              <>
                <HStack justifyContent="center" my={4} width="100%">
                  <Text variant="title">Supply</Text>
                  <Box height="36px" mx={2} width="36px">
                    <TokenIcon address={asset.underlyingToken} chainId={poolChainId} size="36" />
                  </Box>
                  <EllipsisText
                    maxWidth="100px"
                    tooltip={tokenData?.symbol || asset.underlyingSymbol}
                    variant="title"
                  >
                    {tokenData?.symbol || asset.underlyingSymbol}
                  </EllipsisText>
                </HStack>

                <Divider />

                <Column
                  crossAxisAlignment="center"
                  gap={4}
                  height="100%"
                  mainAxisAlignment="flex-start"
                  p={4}
                  width="100%"
                >
                  {!supplyCap || asset.totalSupplyFiat < supplyCap.usdCap ? (
                    <>
                      <Column gap={1} w="100%">
                        <AmountInput
                          asset={asset}
                          comptrollerAddress={comptrollerAddress}
                          optionToWrap={optionToWrap}
                          poolChainId={poolChainId}
                          setAmount={setAmount}
                        />

                        <Balance asset={asset} />
                      </Column>
                      <StatsColumn
                        amount={amount}
                        asset={asset}
                        assets={assets}
                        comptrollerAddress={comptrollerAddress}
                        enableAsCollateral={enableAsCollateral}
                        mode={FundOperationMode.SUPPLY}
                        poolChainId={poolChainId}
                      />
                      {!asset.membership && (
                        <EnableCollateral
                          enableAsCollateral={enableAsCollateral}
                          setEnableAsCollateral={setEnableAsCollateral}
                        />
                      )}
                      <Button
                        height={16}
                        id="confirmFund"
                        isDisabled={!isAmountValid}
                        onClick={onConfirm}
                        width="100%"
                      >
                        {optionToWrap ? `Wrap ${nativeSymbol} & ${btnStr}` : btnStr}
                      </Button>
                    </>
                  ) : (
                    <Alert status="info">
                      <AlertIcon />
                      <VStack alignItems="flex-start">
                        <Text fontWeight="bold">
                          {smallFormatter.format(supplyCap.tokenCap)} {asset.underlyingSymbol} /{' '}
                          {smallFormatter.format(supplyCap.tokenCap)} {asset.underlyingSymbol}
                        </Text>
                        <Text>
                          The maximum supply of assets for this asset has been reached. Once assets
                          are withdrawn or the limit is increased you can again supply to this
                          market.
                        </Text>
                      </VStack>
                    </Alert>
                  )}
                </Column>
              </>
            )}
          </Column>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};