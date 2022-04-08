import { updateCumulativePrices } from './index';
import { BigNumber, utils } from 'ethers';
import { Fuse } from '@midas-capital/sdk';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { getPriceOracle } from './utils';

export default async function tryUpdateCumulativePrices(
  fuse: Fuse,
  lastTransaction: TransactionResponse | null,
  lastTransactionSent: number | null
): Promise<[TransactionResponse | null, number]> {
  const supportedPairs = process.env.SUPPORTED_PAIRS!.split(',');
  // Check if last TX sent is still pending; if so, wait until it has been 5 minutes since sending, after which we will overwrite it (i.e., same nonce)

  const rootPriceOracleContract = await getPriceOracle(fuse);
  let useNonce: boolean | number = false;

  if (lastTransaction !== null) {
    try {
      lastTransaction = await fuse.provider.getTransaction(lastTransaction.hash);
    } catch (e) {
      console.log(e);
    }

    if (lastTransaction && lastTransaction.blockNumber === null) {
      // Transaction found and block not yet mined
      if (
        lastTransactionSent! <
        new Date().getTime() / 1000 - parseInt(process.env.SPEED_UP_TRANSACTION_AFTER_SECONDS!)
      )
        useNonce = lastTransaction.nonce;
      else return [null, 0];
    } else {
      // Transaction not found or block already mined => no more pending TX
      lastTransactionSent = 0;
    }
  }
  // Get pairs, min periods, and deviation thresholds
  let pairs = [];
  let baseTokens = [];
  let minPeriods = [];
  let deviationThresholds = [];

  for (let i = 0; i < supportedPairs.length; i++) {
    const parts = supportedPairs[i].split('|');
    pairs[i] = parts[0];
    baseTokens[i] = parts[1];
    minPeriods[i] =
      parts[2] !== undefined
        ? BigNumber.from(parts[2])
        : BigNumber.from(process.env.DEFAULT_MIN_PERIOD);

    deviationThresholds[i] = utils.parseEther(
      parts[3] !== undefined ? parts[3] : process.env.DEFAULT_DEVIATION_THRESHOLD!
    );
  }

  // Get workable pairs and validate
  const workable = await rootPriceOracleContract.callStatic.workable(
    pairs,
    baseTokens,
    minPeriods,
    deviationThresholds
  );

  console.log(workable, 'workable');
  let workableSince: {
    [key: string]: number | undefined;
  } = {};
  if (parseInt(process.env.REDUNDANCY_DELAY_SECONDS!) > 0) {
    let redundancyDelayPassed = false;

    for (let i = 0; i < workable.length; i++) {
      if (workable[i]) {
        let epochNow = new Date().getTime() / 1000;
        if (workableSince[pairs[i]]! < epochNow - parseInt(process.env.REDUNDANCY_DELAY_SECONDS!))
          redundancyDelayPassed = true;
        else if (workableSince[pairs[i]] === undefined) workableSince[pairs[i]] = epochNow;
      } else {
        workableSince[pairs[i]] = undefined;
      }
    }

    if (!redundancyDelayPassed) return [null, 0];
  }

  let workablePairs = [];
  for (let i = 0; i < workable.length; i++) {
    if (workable[i]) {
      workablePairs.push(pairs[i]);
    }
  }
  if (workablePairs.length <= 0) return [null, 0];

  // Update cumulative prices and return TX
  const tx = await updateCumulativePrices(workablePairs, useNonce, fuse);

  lastTransactionSent = new Date().getTime() / 1000;
  console.log('Pending TX hash:', lastTransaction?.hash);
  return [tx, lastTransactionSent];
}
