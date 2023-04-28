import { Box, Button, Divider, HStack, Icon, Text } from '@chakra-ui/react';
import { Select, chakraComponents } from 'chakra-react-select';

import { WETHAbi } from '@midas-capital/sdk';
import { FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants, utils } from 'ethers';
import { formatEther, formatUnits, getAddress } from 'ethers/lib/utils.js';
import { useEffect, useMemo, useState } from 'react';
import { getContract } from 'sdk/dist/cjs/src/MidasSdk/utils';
import { useSwitchNetwork } from 'wagmi';

import { StatsColumn } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/StatsColumn';
import { AmountInput } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/AmountInput';
import { Balance } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/Balance';
import { EnableCollateral } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/EnableCollateral';
import { PendingTransaction } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/PendingTransaction';
import { SupplyError } from '@ui/components/pages/PoolPage/MarketsList/AdditionalInfo/FundButton/SupplyModal/SupplyError';
import { Banner } from '@ui/components/shared/Banner';
import { EllipsisText } from '@ui/components/shared/EllipsisText';
import { Column, Row } from '@ui/components/shared/Flex';
import { MidasModal } from '@ui/components/shared/Modal';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import {
  SUPPLY_STEPS,
  SUPPORTED_CHAINS_BY_CONNEXT,
  SUPPORTED_CHAINS_XMINT,
} from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useMaxSupplyAmount } from '@ui/hooks/useMaxSupplyAmount';
import { useSupplyCap } from '@ui/hooks/useSupplyCap';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { useTokenData } from '@ui/hooks/useTokenData';
import { useXMintAsset } from '@ui/hooks/useXMintAsset';
import type { TokenData, TxStep } from '@ui/types/ComponentPropsType';
import type { MarketData } from '@ui/types/TokensDataMap';
import { smallFormatter } from '@ui/utils/bigUtils';
import { handleGenericError } from '@ui/utils/errorHandling';
import { useTokens } from '@ui/hooks/useTokens';
import { TokenBalance } from './TokenBalance';

interface SupplyModalProps {
  asset: MarketData;
  assets: MarketData[];
  comptrollerAddress: string;
  isOpen: boolean;
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
  const {
    address: _address,
    currentChain,
    currentSdk,
    connextSdk,
    getAvailableFromChains,
  } = useMultiMidas();
  const address = _address ?? constants.AddressZero;
  const addRecentTransaction = useAddRecentTransaction();
  if (!currentChain || !currentSdk) {
    throw new Error("SDK doesn't exist");
  }

  const availableFromChains = useMemo(() => {
    if (poolChainId && asset) {
      return [poolChainId, ...getAvailableFromChains(poolChainId, asset.underlyingToken)];
    }
    return [];
  }, [asset, getAvailableFromChains, poolChainId]);

  const { switchNetworkAsync } = useSwitchNetwork();
  const handleSwitch = async (chainId: number) => {
    if (switchNetworkAsync) {
      await switchNetworkAsync(chainId);
    }
  };
  const isXMint = useMemo(() => currentChain.id !== poolChainId, [currentChain, poolChainId]);
  const [relayerFee, setRelayerFee] = useState<BigNumber>(constants.Zero);
  const { data: tokens } = useTokens(currentChain.id);
  const [fromAsset, setFromAsset] = useState<TokenData | undefined>();
  const xMintAsset = useXMintAsset(asset);

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
    chainId: poolChainId,
    comptroller: comptrollerAddress,
    market: asset,
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
      const max = optionToWrap
        ? +formatEther(myNativeBalance as BigNumber)
        : maxSupplyAmount.number;
      setIsAmountValid(+formatUnits(amount, asset.underlyingDecimals) <= max);
    }
  }, [amount, maxSupplyAmount, optionToWrap, myNativeBalance, asset.underlyingDecimals]);

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

  useEffect(() => {
    if (!currentChain || !connextSdk) {
      setRelayerFee(constants.Zero);
    } else {
      const origin = SUPPORTED_CHAINS_BY_CONNEXT[currentChain.id].domainId;
      const destination = SUPPORTED_CHAINS_BY_CONNEXT[poolChainId].domainId;

      // Calculate relayer fee
      const estimateRelayerFeeParams = {
        originDomain: origin,
        destinationDomain: destination,
        isHighPriority: true,
      };
      connextSdk.estimateRelayerFee(estimateRelayerFeeParams).then((res) => {
        setRelayerFee(res);
      });
    }
  }, [connextSdk, currentChain, poolChainId]);

  const onConfirm = async () => {
    if (!currentSdk || !address) return;

    if (!isXMint) {
      handleSupply();
    } else {
      handleXSupply();
    }
  };

  const handleSupply = async () => {
    const sentryProperties = {
      chainId: currentSdk.chainId,
      comptroller: comptrollerAddress,
      token: asset.cToken,
    };

    setIsConfirmed(true);
    setConfirmedSteps([...steps]);
    const _steps = [...steps];

    setIsSupplying(true);
    setActiveStep(0);
    setFailedStep(0);
    try {
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
            description: `Wrap ${nativeSymbol}`,
            hash: tx.hash,
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
            description: 'Successfully Wrapped!',
            id: 'wrapped',
          });
        } catch (error) {
          setFailedStep(1);
          throw error;
        }
      }

      try {
        setActiveStep(optionToWrap ? 2 : 1);
        const token = currentSdk.getEIP20TokenInstance(asset.underlyingToken, currentSdk.signer);
        const hasApprovedEnough = (await token.callStatic.allowance(address, asset.cToken)).gte(
          amount
        );

        if (!hasApprovedEnough) {
          const tx = await currentSdk.approve(asset.cToken, asset.underlyingToken);

          addRecentTransaction({
            description: `Approve ${asset.underlyingSymbol}`,
            hash: tx.hash,
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
            description: 'Successfully Approved!',
            id: 'approved',
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
        setFailedStep(optionToWrap ? 2 : 1);
        throw error;
      }
      if (enableAsCollateral) {
        try {
          setActiveStep(optionToWrap ? 3 : 2);
          const tx = await currentSdk.enterMarkets(asset.cToken, comptrollerAddress);
          addRecentTransaction({
            description: `Entered ${asset.underlyingSymbol} market`,
            hash: tx.hash,
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
            description: 'Collateral enabled!',
            id: 'collateralEnabled',
          });
        } catch (error) {
          setFailedStep(optionToWrap ? 3 : 2);
          throw error;
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
            description: `${asset.underlyingSymbol} Token Supply`,
            hash: tx.hash,
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
        setFailedStep(
          optionToWrap && enableAsCollateral ? 4 : optionToWrap || enableAsCollateral ? 3 : 2
        );
        throw error;
      }
    } catch (error) {
      const sentryInfo = {
        contextName: 'Supply - Minting',
        properties: sentryProperties,
      };
      handleGenericError({ error, sentryInfo, toast: errorToast });
    }

    setIsSupplying(false);
  };

  const handleXSupply = async () => {
    if (!connextSdk || !xMintAsset || !maxSupplyAmount) return;

    const origin = SUPPORTED_CHAINS_BY_CONNEXT[currentChain.id].domainId;
    const destination = SUPPORTED_CHAINS_BY_CONNEXT[poolChainId].domainId;
    const connext = await connextSdk.getConnext(origin);

    if (!connext) {
      return;
    }

    const sentryProperties = {
      connext: connext,
      chainId: currentSdk.chainId,
      comptroller: comptrollerAddress,
    };

    setIsConfirmed(true);
    setConfirmedSteps([...steps]);
    const _steps = [...steps];

    setIsSupplying(true);
    setActiveStep(0);
    setFailedStep(0);

    const xcallAmount = utils.parseUnits(
      utils.formatUnits(amount.toString(), asset.underlyingDecimals.toNumber()),
      maxSupplyAmount.decimals
    );

    try {
      setActiveStep(optionToWrap ? 2 : 1);
      const token = currentSdk.getEIP20RewardTokenInstance(
        xMintAsset.underlying,
        currentSdk.signer
      );

      const hasApprovedEnough = (await token.callStatic.allowance(address, connext.address)).gte(
        xcallAmount
      );

      if (!hasApprovedEnough) {
        const tx = await currentSdk.approve(connext.address, xMintAsset.underlying);

        addRecentTransaction({
          hash: tx.hash,
          description: `Approve ${xMintAsset.symbol}`,
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

    try {
      setActiveStep(
        optionToWrap && enableAsCollateral ? 4 : optionToWrap || enableAsCollateral ? 3 : 2
      );

      const signerAddress = await currentSdk.signer.getAddress();
      // Calculate relayer fee
      const estimateRelayerFeeParams = {
        originDomain: origin,
        destinationDomain: destination,
        isHighPriority: true,
      };
      const relayerFee = await connextSdk.estimateRelayerFee(estimateRelayerFeeParams);
      const callData = utils.defaultAbiCoder.encode(
        ['address', 'address'],
        [asset.cToken, signerAddress]
      );
      const xMintContract = SUPPORTED_CHAINS_XMINT[poolChainId].xMinterAddress;
      const xcallParams = {
        origin: origin,
        destination: destination,
        asset: xMintAsset.underlying,
        to: xMintContract,
        delegate: signerAddress,
        amount: xcallAmount.toString(),
        slippage: '300',
        receiveLocal: false,
        callData: callData,
        relayerFee: relayerFee.toString(),
      };

      const xcall_request = await connextSdk.xcall(xcallParams);

      const tx = await currentSdk.signer.sendTransaction(xcall_request);

      addRecentTransaction({
        hash: tx.hash,
        description: `${asset.underlyingSymbol} Token Supply`,
      });
      _steps[optionToWrap && enableAsCollateral ? 3 : optionToWrap || enableAsCollateral ? 2 : 1] =
        {
          ..._steps[
            optionToWrap && enableAsCollateral ? 3 : optionToWrap || enableAsCollateral ? 2 : 1
          ],
          txHash: tx.hash,
        };
      setConfirmedSteps([..._steps]);

      await tx.wait();

      //await queryClient.refetchQueries();

      _steps[optionToWrap && enableAsCollateral ? 3 : optionToWrap || enableAsCollateral ? 2 : 1] =
        {
          ..._steps[
            optionToWrap && enableAsCollateral ? 3 : optionToWrap || enableAsCollateral ? 2 : 1
          ],
          done: true,
          txHash: tx.hash,
        };
      setConfirmedSteps([..._steps]);
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
          { desc: 'Wrap Native Token', done: false, title: 'Wrap Native Token' },
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
      _steps = [{ desc: 'Wrap Native Token', done: false, title: 'Wrap Native Token' }, ..._steps];
    }

    setSteps(_steps);
  }, [optionToWrap, enableAsCollateral, asset.underlyingSymbol]);

  return (
    <MidasModal
      body={
        <Column
          bg={cCard.bgColor}
          borderRadius={16}
          color={cCard.txtColor}
          crossAxisAlignment="flex-start"
          id="fundOperationModal"
          mainAxisAlignment="flex-start"
        >
          {isConfirmed ? (
            <PendingTransaction
              activeStep={activeStep}
              amount={amount}
              asset={asset}
              failedStep={failedStep}
              isSupplying={isSupplying}
              isXSupply={isXMint}
              poolChainId={currentChain.id}
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
              <HStack justifyContent="center" mb={2} width="100%">
                <Text variant="title">From</Text>
                <Select
                  onChange={(d) => {
                    if (d?.value) handleSwitch(d.value);
                  }}
                  placeholder="From Chain"
                  size="sm"
                  isMulti={false}
                  options={availableFromChains.map((chainId: number) => ({
                    label: SUPPORTED_CHAINS_BY_CONNEXT[chainId].name,
                    value: chainId,
                  }))}
                  defaultValue={{
                    value: currentChain.id,
                    label: SUPPORTED_CHAINS_BY_CONNEXT[currentChain.id].name,
                  }}
                />
                {currentChain.id !== poolChainId ? (
                  <Select
                    onChange={(option) => {
                      setFromAsset(
                        tokens?.find(
                          (t: TokenData) =>
                            getAddress(t.address) === getAddress(option?.value || '')
                        )
                      );
                    }}
                    placeholder=""
                    size="sm"
                    options={(tokens || []).map((token: TokenData) => ({
                      label: token.symbol,
                      value: token.address,
                      icon: token.logoURL,
                    }))}
                    defaultValue={{
                      label: tokens?.[0].symbol,
                      value: tokens?.[0].address,
                      icon: tokens?.[0].logoURL,
                    }}
                    components={{
                      Option: ({ children, ...props }) => (
                        <chakraComponents.Option {...props}>
                          <img
                            src={props.data.icon}
                            style={{ marginRight: 3, width: 15, height: 15 }}
                          />{' '}
                          {children}
                        </chakraComponents.Option>
                      ),
                    }}
                  />
                ) : (
                  <>
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
                  </>
                )}
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

                      {!isXMint && <Balance asset={asset} />}
                      {isXMint && fromAsset && <TokenBalance asset={fromAsset} />}
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
                    {!asset.membership && !isXMint && (
                      <EnableCollateral
                        enableAsCollateral={enableAsCollateral}
                        setEnableAsCollateral={setEnableAsCollateral}
                      />
                    )}
                    {isXMint && (
                      <Column
                        crossAxisAlignment="flex-start"
                        mainAxisAlignment="flex-start"
                        width="100%"
                      >
                        <Row crossAxisAlignment="center" mainAxisAlignment="flex-end" width="100%">
                          <Text mr={2} size="sm">
                            Relayer Fee:
                          </Text>
                          <Text
                            maxWidth="300px"
                            overflow="hidden"
                            textOverflow={'ellipsis'}
                            whiteSpace="nowrap"
                          >
                            {(+formatEther(relayerFee)).toFixed(6)}{' '}
                            {currentChain ? currentChain.nativeCurrency.symbol : 'ETH'}
                          </Text>
                        </Row>
                      </Column>
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
                  <Banner
                    alertDescriptionProps={{ fontSize: 'lg' }}
                    alertProps={{ status: 'info' }}
                    descriptions={[
                      {
                        text: `${smallFormatter(supplyCap.tokenCap)} ${
                          asset.underlyingSymbol
                        } / ${smallFormatter(supplyCap.tokenCap)} ${asset.underlyingSymbol}`,
                        textProps: { display: 'block', fontWeight: 'bold' },
                      },
                      {
                        text: 'The maximum supply of assets for this asset has been reached. Once assets are withdrawn or the limit is increased you can again supply to this market.',
                      },
                    ]}
                  />
                )}
              </Column>
            </>
          )}
        </Column>
      }
      isOpen={isOpen}
      modalCloseButtonProps={{ hidden: isSupplying }}
      onClose={onModalClose}
    />
  );
};
