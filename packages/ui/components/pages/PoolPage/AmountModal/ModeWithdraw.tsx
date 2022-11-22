import { Button, Text } from '@chakra-ui/react';
import { ComptrollerErrorCodes, FundOperationMode } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BigNumber, constants, ContractTransaction, utils } from 'ethers';
import LogRocket from 'logrocket';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { MidasSdk } from '@midas-capital/sdk';
import { CTokenErrorCodes } from '@midas-capital/types';
import { MidasBox } from '@ui/components/shared/Box';
import { Column, Row } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { DEFAULT_DECIMALS, UserAction } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast } from '@ui/hooks/useToast';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';
import { handleGenericError } from '@ui/utils/errorHandling';
import { fetchMaxAmount } from '@ui/utils/fetchMaxAmount';
import { toFixedNoRound } from '@ui/utils/formatNumber';
import axios from 'axios';
import { AmountInput } from './AmountInput';
import { StatsColumn } from './StatsColumn';
import { TokenNameAndMaxButton } from './TokenAmountAndMaxButton';

interface ModeWithdrawProps {
  asset: MarketData;
  assets: MarketData[];
  comptrollerAddress: string;
  onClose: () => void;
  poolChainId: number;
}
const ModeWithdraw = ({ assets, asset, onClose, poolChainId }: ModeWithdrawProps) => {
  const { currentSdk, address, currentChain } = useMultiMidas();
  const addRecentTransaction = useAddRecentTransaction();
  if (!currentChain || !currentSdk) throw new Error("SDK doesn't exist");

  const errorToast = useErrorToast();

  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);

  const [userAction, setUserAction] = useState(UserAction.NO_ACTION);

  const [userEnteredAmount, _setUserEnteredAmount] = useState('');

  const [amount, _setAmount] = useState<BigNumber>(constants.Zero);

  const [availableToWithdraw, setAvailableToWithdraw] = useState('0.0');

  const { cCard } = useColors();

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
    ['isValidWithdraw', currentSdk.chainId, address, amount],
    async () => {
      if (amount === null || amount.isZero()) {
        return false;
      }
      if (!currentSdk || !address) return null;

      const maxRedeem = await currentSdk.contracts.FusePoolLensSecondary.callStatic.getMaxRedeem(
        address,
        asset.cToken,
        { from: address }
      );

      if (maxRedeem) {
        return BigNumber.from(maxRedeem);
      } else {
        throw new Error('Could not fetch your max withdraw amount! Code: ');
      }
    }
  );

  let depositOrWithdrawAlert = useMemo(() => {
    if (amount === null || amount.isZero()) return 'Enter a valid amount to withdraw.';
    if (amountIsValid === undefined) return `Loading your balance of ${asset.underlyingSymbol}...`;

    if (!amountIsValid) return 'You cannot withdraw this much!';
    return null;
  }, [amount, asset]);

  const onWithdraw = async () => {
    if (!currentSdk || !address) return;

    try {
      setUserAction(UserAction.WAITING_FOR_TRANSACTIONS);

      let tx: ContractTransaction;

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
        fundOperationError(resp.errorCode);
      } else {
        tx = resp.tx;
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
      setUserAction(UserAction.NO_ACTION);
    }
  };

  const updateAvailableToWithdraw = useCallback(async () => {
    if (!currentSdk || !address) return;

    const max = await fetchMaxAmount(FundOperationMode.WITHDRAW, currentSdk, address, asset);
    setAvailableToWithdraw(utils.formatUnits(max, asset.underlyingDecimals));
  }, [address, asset, currentSdk]);

  useEffect(() => {
    updateAvailableToWithdraw();
  }, [updateAvailableToWithdraw]);

  return (
    <Column
      id="fundOperationModal"
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      bg={cCard.bgColor}
      color={cCard.txtColor}
      borderRadius={16}
    >
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
                  autoFocus
                />
                <TokenNameAndMaxButton
                  mode={FundOperationMode.WITHDRAW}
                  asset={asset}
                  updateAmount={updateAmount}
                  optionToWrap={false}
                  poolChainId={poolChainId}
                />
              </Row>
            </MidasBox>
            <Row width="100%" mt={1} mainAxisAlignment="flex-end" crossAxisAlignment="center">
              <Text variant="smText" mr={2}>
                Available To Withdraw:
              </Text>
              <SimpleTooltip label={`${availableToWithdraw} ${asset.underlyingSymbol}`}>
                <Text
                  maxWidth="250px"
                  textOverflow={'ellipsis'}
                  whiteSpace="nowrap"
                  overflow="hidden"
                >
                  {availableToWithdraw} {asset.underlyingSymbol}
                </Text>
              </SimpleTooltip>
            </Row>
          </Column>

          <StatsColumn
            amount={amount}
            assets={assets}
            asset={asset}
            mode={FundOperationMode.WITHDRAW}
            poolChainId={poolChainId}
          />

          <Button
            id="confirmFund"
            mt={4}
            width="100%"
            onClick={onWithdraw}
            isDisabled={!amountIsValid}
            height={16}
          >
            {depositOrWithdrawAlert || 'Confirm'}
          </Button>
        </Column>
      </>
    </Column>
  );
};

export default ModeWithdraw;

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
