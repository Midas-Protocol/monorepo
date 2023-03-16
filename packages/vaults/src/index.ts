import { BigNumber } from 'ethers';
import { levenbergMarquardt } from 'ml-levenberg-marquardt';

import { getAprAfterDeposit, getIrms } from './irm';

// Define the function to solve the optimization problem
export async function optimizeAllocation(
  cTokenAddresses: string[],
  totalFundsDeposited: BigNumber
): Promise<void> {
  const irms = await getIrms(cTokenAddresses);
  console.log({ irms });

  // Define the decision variables
  const n = cTokenAddresses.length;
  const x = Array(n).fill(0);

  // Define the total amount of funds deposited in the vault

  // Define the objective function
  const objective = async (x: number[]) => {
    let apr = 0;
    for (const [idx, cToken] of cTokenAddresses.entries()) {
      const poolApr = await getAprAfterDeposit(irms[idx].irm, cToken, BigNumber.from(x[idx]));
      console.log('poolApr', poolApr.toString());
      apr += x[idx] * poolApr;
    }
    return -apr; // Minimize the negative of the APR to maximize the APR
  };

  // Define the optimization solver
  const options = {
    damping: 1e-2,
    maxIterations: 100,
    errorTolerance: 1e-8,
    minValues: Array(n).fill(0),
    maxValues: Array(n).fill(totalFundsDeposited),
  };

  const data = {
    x: x0,
    y: [f(x0)],
  };

  const result = await levenbergMarquardt(data, objective, options);

  // Print the optimal allocation of funds to each pool
  console.log({
    iterations: result.iterations,
    parameterValues: result.parameterValues,
    error: result.parameterError,
  });
}
