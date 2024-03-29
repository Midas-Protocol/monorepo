import { task } from "hardhat/config";

import { configureAddressesProviderStrategies } from "../../chainDeploy/helpers/liquidators/fuseSafeLiquidator";
import { configureLiquidatorsRegistry } from "../../chainDeploy/helpers/liquidators/registry";

export default task(
  "config:strategies",
  "Configure the redemption and funding strategies in the AddressesProvider for testing purposes"
).setAction(async ({}, { ethers, getNamedAccounts, getChainId }) => {
  const chainId = parseInt(await getChainId());

  await configureAddressesProviderStrategies({
    ethers,
    getNamedAccounts,
    chainId,
  });

  //// Configure Liquidators Registry
  await configureLiquidatorsRegistry({
    ethers,
    getNamedAccounts,
    chainId,
  });
});
