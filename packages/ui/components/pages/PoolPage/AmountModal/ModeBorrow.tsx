import { Alert, AlertIcon, Box, Button, Checkbox, Text } from '@chakra-ui/react';
import { ComptrollerErrorCodes, FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants, ContractTransaction, utils } from 'ethers';
import LogRocket from 'logrocket';
import { useMemo, useState } from 'react';

import { MidasSdk } from '@midas-capital/sdk';
import { CTokenErrorCodes } from '@midas-capital/types';
import MaxBorrowSlider from '@ui/components/pages/PoolPage/AmountModal/MaxBorrowSlider';
import { MidasBox } from '@ui/components/shared/Box';
import { Column, Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { DEFAULT_DECIMALS, HIGH_RISK_RATIO } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useBorrowMinimum } from '@ui/hooks/useBorrowMinimum';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast } from '@ui/hooks/useToast';
import { useTokenBalance } from '@ui/hooks/useTokenBalance';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';
import { handleGenericError } from '@ui/utils/errorHandling';
import { fetchMaxAmount, useMaxAmount } from '@ui/utils/fetchMaxAmount';
import { toCeil, toFixedNoRound } from '@ui/utils/formatNumber';
import axios from 'axios';
import { AmountInput } from './AmountInput';
import { StatsColumn } from './StatsColumn';
import { TokenNameAndMaxButton } from './TokenAmountAndMaxButton';

interface ModeBorrowProps {
  asset: MarketData;
  assets: MarketData[];
  onClose: () => void;
  poolChainId: number;
}
const ModeBorrow = ({ assets, asset, onClose, poolChainId }: ModeBorrowProps) => {
  const { currentSdk, address, currentChain } = useMultiMidas();
  const addRecentTransaction = useAddRecentTransaction();
  if (!currentChain || !currentSdk) throw new Error("SDK doesn't exist");
  const { cCard } = useColors();
  const errorToast = useErrorToast();

  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);

  const [userEnteredAmount, _setUserEnteredAmount] = useState('');
  const [amount, _setAmount] = useState<BigNumber>(constants.Zero);

  const { data: maxBorrowInAsset } = useMaxAmount(FundOperationMode.BORROW, asset);
  console.log({ maxBorrowInAsset });
  const { data: myBalance } = useTokenBalance(asset.underlyingToken);

  const [isRisky, setIsRisky] = useState<boolean>(false);
  const [isRiskyConfirmed, setIsRiskyConfirmed] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const updateAmount = (newAmount: string) => {
    if (newAmount.startsWith('-') || !newAmount) {
      _setUserEnteredAmount('');
      _setAmount(constants.Zero);
      return;
    }

    _setUserEnteredAmount(newAmount);

    if (
      maxBorrowInAsset &&
      maxBorrowInAsset.number !== 0 &&
      Number(newAmount) / maxBorrowInAsset.number > HIGH_RISK_RATIO
    ) {
      setIsRisky(true);
    } else {
      setIsRisky(false);
    }

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
  };

  const {
    data: { minBorrowAsset, minBorrowUSD },
  } = useBorrowMinimum(asset, poolChainId);

  const { data: amountIsValid } = useQuery(
    ['isValidBorrowAmount', currentSdk.chainId, address, amount, minBorrowAsset],
    async () => {
      if (!currentSdk || !address) return null;

      if (amount === null || amount.isZero() || !minBorrowAsset) {
        return false;
      }

      try {
        const max = (await fetchMaxAmount(
          FundOperationMode.BORROW,
          currentSdk,
          address,
          asset
        )) as BigNumber;
        return amount.lte(max) && amount.gte(minBorrowAsset);
      } catch (e) {
        handleGenericError(e, errorToast);
        return false;
      }
    }
  );

  const depositOrWithdrawAlert = useMemo(() => {
    if (asset.isBorrowPaused) return 'Borrowing is disabled for this asset.';
    if (amount === null || amount.isZero()) return 'Enter a valid amount to borrow.';
    if (amountIsValid === undefined) return `Loading your balance of ${asset.underlyingSymbol}...`;
    if (!amountIsValid) return 'You cannot borrow this amount!';
    if (isRisky && !isRiskyConfirmed) return 'Confirm High Risk Of Borrow First';
    return null;
  }, [asset, amountIsValid, isRisky, isRiskyConfirmed, amount]);

  const onBorrow = async () => {
    if (!currentSdk || !address) return;

    try {
      let tx: ContractTransaction;

      const resp = await currentSdk.borrow(asset.cToken, amount);

      if (resp.errorCode !== null) {
        fundOperationError(resp.errorCode, minBorrowUSD);
      } else {
        tx = resp.tx;
        addRecentTransaction({
          hash: tx.hash,
          description: `${asset.underlyingSymbol} Token Borrow`,
        });
        await tx.wait();
        await queryClient.refetchQueries();
      }

      onClose();
    } catch (e) {
      handleGenericError(e, errorToast);
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
      <Column
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        p={4}
        height="100%"
        width="100%"
      >
        <Column mainAxisAlignment="flex-start" crossAxisAlignment="flex-start" width="100%">
          <Row width="100%" mt={2} mainAxisAlignment="flex-end" crossAxisAlignment="center">
            <Alert status="info">
              <AlertIcon />
              <Text variant="smText">
                {`For safety reasons, you need to borrow at least a value of $${
                  minBorrowUSD ? minBorrowUSD?.toFixed(2) : 100
                }${
                  minBorrowAsset
                    ? ` / ${toCeil(
                        Number(utils.formatUnits(minBorrowAsset, asset.underlyingDecimals)),
                        2
                      )} ${asset.underlyingSymbol}`
                    : ''
                } for now.`}
              </Text>
            </Alert>
          </Row>

          {asset.liquidity.isZero() ? (
            <Alert status="info">
              <AlertIcon />
              Unable to borrow this asset yet. The asset does not have enough liquidity.
              <br /> Feel free to supply this asset to be borrowed by others in this pool to earn
              interest.
            </Alert>
          ) : (
            <>
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
                    mode={FundOperationMode.BORROW}
                    asset={asset}
                    updateAmount={updateAmount}
                    poolChainId={poolChainId}
                  />
                </Row>
              </MidasBox>
              <Row width="100%" mt={1} mainAxisAlignment="flex-end" crossAxisAlignment="center">
                <Text variant="smText" mr={2}>
                  Wallet Balance:
                </Text>
                <SimpleTooltip
                  label={`${
                    myBalance ? utils.formatUnits(myBalance, asset.underlyingDecimals) : 0
                  } ${asset.underlyingSymbol}`}
                >
                  <Text textOverflow="ellipsis" whiteSpace="nowrap" overflow="hidden">
                    {myBalance ? utils.formatUnits(myBalance, asset.underlyingDecimals) : 0}{' '}
                    {asset.underlyingSymbol}
                  </Text>
                </SimpleTooltip>
              </Row>

              {maxBorrowInAsset && maxBorrowInAsset.number !== 0 && (
                <MaxBorrowSlider
                  userEnteredAmount={userEnteredAmount}
                  updateAmount={updateAmount}
                  borrowableAmount={maxBorrowInAsset.number}
                  asset={asset}
                  poolChainId={poolChainId}
                />
              )}
            </>
          )}
        </Column>

        <StatsColumn
          amount={amount}
          assets={assets}
          asset={asset}
          mode={FundOperationMode.BORROW}
          poolChainId={poolChainId}
        />

        {isRisky && (
          <Box pt={4}>
            <Checkbox
              isChecked={isRiskyConfirmed}
              onChange={() => setIsRiskyConfirmed(!isRiskyConfirmed)}
            >
              {
                "I'm aware that I'm entering >80% of my borrow limit and thereby have a high risk of getting liquidated."
              }
            </Checkbox>
          </Box>
        )}

        <Button
          id="confirmFund"
          mt={4}
          width="100%"
          onClick={onBorrow}
          isDisabled={!amountIsValid || (isRisky && !isRiskyConfirmed)}
          height={16}
        >
          {depositOrWithdrawAlert ? depositOrWithdrawAlert : 'Borrow'}
        </Button>
      </Column>
    </Column>
  );
};

export default ModeBorrow;

export function fundOperationError(errorCode: number, minBorrowUSD?: number) {
  let err;

  if (errorCode >= 1000) {
    const comptrollerResponse = errorCode - 1000;
    let msg = ComptrollerErrorCodes[comptrollerResponse];

    if (msg === 'BORROW_BELOW_MIN') {
      msg = `As part of our guarded launch, you cannot borrow ${
        !!minBorrowUSD ? `less than $${minBorrowUSD.toFixed(2)} worth` : 'this amount'
      } of tokens at the moment.`;
    }

    // This is a comptroller error:
    err = new Error('Comptroller Error: ' + msg);
  } else {
    // This is a standard token error:
    err = new Error('CToken Code: ' + CTokenErrorCodes[errorCode]);
  }

  LogRocket.captureException(err);
  throw err;
}

export const fetchGasForCall = async (
  amountBN: BigNumber,
  currentSdk: MidasSdk,
  address: string
) => {
  const estimatedGas = BigNumber.from(
    (
      (
        await currentSdk.provider.estimateGas({
          from: address,
          // Cut amountBN in half in case it screws up the gas estimation by causing a fail in the event that it accounts for gasPrice > 0 which means there will not be enough ETH (after paying gas)
          value: amountBN.div(BigNumber.from(2)),
        })
      ).toNumber() *
      // 50% more gas for limit:
      3.13
    ).toFixed(0)
  );

  // Ex: 100 (in GWEI)
  const res = await axios.get('/api/getGasPrice');
  const average = res.data.average;
  const gasPrice = utils.parseUnits(average.toString(), 'gwei');
  const gasWEI = estimatedGas.mul(gasPrice);

  return { gasWEI, gasPrice, estimatedGas };
};
