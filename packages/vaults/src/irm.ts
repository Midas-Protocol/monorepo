import { bsc } from '@midas-capital/chains';
import { MidasSdk } from '@midas-capital/sdk';
import JRM from '@midas-capital/sdk/artifacts/JumpRateModel.json';
import { BigNumber, ethers } from 'ethers';

import { provider } from './utils';

const MINUTES_PER_YEAR = 24 * 365 * 60;

export async function getIrms(cTokens: string[]) {
  const sdk = new MidasSdk(provider, bsc);
  return await Promise.all(
    cTokens.map(async (cToken) => {
      const irm = await sdk
        .createCErc20PluginRewardsDelegate(cToken)
        .callStatic.interestRateModel();
      return {
        irm,
      };
    })
  );
}

export async function getAprAfterDeposit(
  irmAddress: string,
  cTokenAddress: string,
  amount: BigNumber
) {
  const irmContract = new ethers.Contract(irmAddress, JRM.abi, provider);

  const sdk = new MidasSdk(provider, bsc);
  const cToken = sdk.createCErc20PluginRewardsDelegate(cTokenAddress);

  const srPerBlockAfterDepoist = await irmContract.callStatic.getSupplyRate(
    (await cToken.getCash()).add(amount),
    await cToken.callStatic.totalBorrows(),
    (
      await cToken.callStatic.totalReserves()
    )
      .add(await cToken.callStatic.totalAdminFees())
      .add(await cToken.callStatic.totalFuseFees())
      .add(await cToken.callStatic.adminFeeMantissa())
  );

  return sdk.ratePerBlockToAPY(
    srPerBlockAfterDepoist,
    bsc.specificParams.blocksPerYear.div(MINUTES_PER_YEAR).toNumber()
  );
}
