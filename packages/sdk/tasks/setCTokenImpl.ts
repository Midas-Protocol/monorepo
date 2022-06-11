import { task, types } from "hardhat/config";

export default task("ctoken:set-implementation", "Set new implementation to ctoken")
  .addOptionalParam("ctoken", "cToken for which to set the new implementation", undefined, types.string)
  .addOptionalParam("implementation", "new implementation address", undefined, types.string)
  .addOptionalParam("implementationData", "Implementation data", "0x00", types.string)
  .addParam("irm", "IRM to use", "JumpRateModel", types.string)
  .setAction(
    async (
      { ctoken: _ctoken, implementation: _implementation, implementationData: _implementationData },
      { getNamedAccounts, ethers }
    ) => {
      const { deployer } = await ethers.getNamedSigners();

      // @ts-ignore
      const fuseModule = await import("../tests/utils/fuseSdk");
      const sdk = await fuseModule.getOrCreateFuse();
      console.log(`Setting implementation to ${_implementation}`);

      const cToken = await sdk.getCTokenInstance(_ctoken);
      const setImplementationTx = await cToken._setImplementationSafe(_implementation, false, _implementationData);
      await setImplementationTx.wait();
    }
  );
