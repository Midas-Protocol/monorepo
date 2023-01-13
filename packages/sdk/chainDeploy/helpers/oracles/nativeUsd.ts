import { NativeUSDPriceOracle } from "../../../typechain/NativeUSDPriceOracle";
import { NativeUsdDeployFnParams } from "../types";

export const deployNativeUsdPriceFeed = async ({
  ethers,
  getNamedAccounts,
  deployments,
  nativeUsdOracleAddress,
  quoteAddress,
}: NativeUsdDeployFnParams): Promise<{ nativeUsdPriceOracle: NativeUSDPriceOracle }> => {
  const { upgradesAdmin, oraclesAdmin } = await getNamedAccounts();

  //// NativeUSDPriceOracle
  const nativeUsd = await deployments.deploy("NativeUSDPriceOracle", {
    from: upgradesAdmin,
    args: [],
    log: true,
    proxy: {
      execute: {
        init: {
          methodName: "initialize",
          args: [nativeUsdOracleAddress, quoteAddress],
        },
      },
      owner: upgradesAdmin,
      proxyContract: "OpenZeppelinTransparentProxy",
    },
  });

  if (nativeUsd.transactionHash) await ethers.provider.waitForTransaction(nativeUsd.transactionHash);
  console.log("NativeUSDPriceOracle: ", nativeUsd.address);

  const nativeUsdPriceOracle = (await ethers.getContract("NativeUSDPriceOracle", oraclesAdmin)) as NativeUSDPriceOracle;
  return { nativeUsdPriceOracle };
};
