import { ganache } from "@midas-capital/chains";
import { constants, Contract, ContractFactory, ContractReceipt, providers, Signer, utils } from "ethers";
import { createStubInstance, restore, SinonStub, SinonStubbedInstance, stub } from "sinon";

import { Comptroller, FusePoolDirectory, Unitroller } from "../../lib/contracts/typechain";
import { ARTIFACTS } from "../../src/Artifacts";
import { MidasBase } from "../../src/MidasSdk/index";
import JumpRateModel from "../../src/MidasSdk/irm/JumpRateModel";
import * as utilsFns from "../../src/MidasSdk/utils";
import { expect } from "../globalTestHook";
import { mkAddress } from "../helpers";

const mockReceipt: Partial<ContractReceipt> = { status: 1, events: [{ args: [constants.Two] }] as any, blockNumber: 1 };

describe("Fuse Index", () => {
  let fuseBase: MidasBase;
  let mockContract: SinonStubbedInstance<Contract>;
  let mockFactory: SinonStubbedInstance<ContractFactory>;
  beforeEach(() => {
    mockContract = createStubInstance(Contract);
    mockContract.connect.returns(mockContract);
    Object.defineProperty(mockContract, "callStatic", {
      value: {
        getAllPools: stub().resolves({ length: 2 }),
      },
    });
    mockContract.deployPool = stub().resolves({
      wait: () => Promise.resolve(mockReceipt),
    });

    mockFactory = createStubInstance(ContractFactory, {
      deploy: stub().resolves({ address: mkAddress("0x123") }),
    });

    const mockProvider = createStubInstance(providers.Web3Provider);
    (mockProvider as any)._isProvider = true;
    (mockProvider as any)._isSigner = true;
    (mockProvider as any).getSigner = () => mkAddress("0xabcd");
    (mockProvider as any).getCode = (address: string) => address;
    ganache.chainDeployments = {
      FusePoolDirectory: { abi: [], address: mkAddress("0xacc") },
      FusePoolLens: { abi: [], address: mkAddress("0xbcc") },
      FusePoolLensSecondary: { abi: [], address: mkAddress("0xdcc") },
      FuseSafeLiquidator: { abi: [], address: mkAddress("0xecc") },
      FuseFeeDistributor: { abi: [], address: mkAddress("0xfcc") },
      JumpRateModel: { abi: [], address: mkAddress("0xaac") },
      WhitePaperInterestRateModel: { abi: [], address: mkAddress("0xabc") },
    };
    fuseBase = new MidasBase(mockProvider, ganache);
    fuseBase.contracts.FusePoolDirectory = mockContract as unknown as FusePoolDirectory;
  });
  afterEach(function () {
    restore();
  });
  describe("#deployPool", () => {
    let getPoolAddressStub: SinonStub<
      [
        from: string,
        poolName: string,
        blockNumber: number,
        fuseFeeDistributorAddress: string,
        fusePoolDirectoryAddress: string
      ],
      string
    >;
    let getPoolUnitrollerStub: SinonStub<[poolAddress: string, signer?: Signer], Unitroller>;
    let getPoolComptrollerStub: SinonStub<[poolAddress: string, signer?: Signer], Comptroller>;
    let mockUnitroller: SinonStubbedInstance<Contract>;
    let mockComptroller: SinonStubbedInstance<Contract>;
    beforeEach(() => {
      getPoolAddressStub = stub(utilsFns, "getPoolAddress").returns(mkAddress("0xbeef"));

      mockUnitroller = createStubInstance(Contract);
      mockUnitroller._acceptAdmin = stub().resolves({ wait: () => Promise.resolve(mockReceipt) });
      getPoolUnitrollerStub = stub(utilsFns, "getPoolUnitroller").returns(mockUnitroller as unknown as Unitroller);

      mockComptroller = createStubInstance(Contract);
      mockComptroller._setWhitelistStatuses = stub().resolves({ wait: () => Promise.resolve(mockReceipt) });
      getPoolComptrollerStub = stub(utilsFns, "getPoolComptroller").returns(mockComptroller as unknown as Comptroller);
    });
    afterEach(function () {
      restore();
    });
    it("should deploy a pool when comptroller is already deployed and enforce whitelist is false", async () => {
      fuseBase.chainDeployment.Comptroller = { abi: [], address: mkAddress("0xccc") };
      await fuseBase.deployPool(
        "Test",
        false,
        constants.One,
        constants.One,
        mkAddress("0xa"),
        { from: mkAddress("0xabc") },
        [mkAddress("0xbbb")]
      );
      expect(mockContract.deployPool).to.be.calledOnceWithExactly(
        "Test",
        mkAddress("0xccc"),
        new utils.AbiCoder().encode(["address"], [mkAddress("0xfcc")]),
        false,
        constants.One,
        constants.One,
        mkAddress("0xa")
      );

      expect(getPoolAddressStub).to.be.calledOnceWithExactly(
        mkAddress("0xabc"),
        "Test",
        2,
        mkAddress("0xfcc"),
        mkAddress("0xacc")
      );

      expect(mockUnitroller._acceptAdmin).to.be.calledOnceWithExactly();

      expect(getPoolComptrollerStub).callCount(0);
    });

    it("should deploy a pool when comptroller is already deployed and enforce whitelist is true", async () => {
      fuseBase.chainDeployment.Comptroller = { abi: [], address: mkAddress("0xccc") };
      await fuseBase.deployPool(
        "Test",
        true,
        constants.One,
        constants.One,
        mkAddress("0xa"),
        { from: mkAddress("0xabc") },
        [mkAddress("0xbbb")]
      );

      expect(mockContract.deployPool).to.be.calledOnceWithExactly(
        "Test",
        mkAddress("0xccc"),
        new utils.AbiCoder().encode(["address"], [mkAddress("0xfcc")]),
        true,
        constants.One,
        constants.One,
        mkAddress("0xa")
      );
      expect(getPoolUnitrollerStub).be.calledOnce;
      expect(getPoolComptrollerStub).be.calledOnce;
    });

    it("should deploy a pool when comptroller is not deployed", async () => {
      fuseBase.chainDeployment.Comptroller = { abi: [], address: mkAddress("0xccc") };
      await fuseBase.deployPool(
        "Test",
        false,
        constants.One,
        constants.One,
        mkAddress("0xa"),
        { from: mkAddress("0xabc") },
        [mkAddress("0xbbb")]
      );
      expect(mockContract.deployPool).to.be.calledOnceWithExactly(
        "Test",
        mkAddress("0xccc"),
        new utils.AbiCoder().encode(["address"], [mkAddress("0xfcc")]),
        false,
        constants.One,
        constants.One,
        mkAddress("0xa")
      );
    });
  });

  describe("#identifyInterestRateModel", () => {
    let model;
    let interestRateModelAddress;

    it("should throw error when model address hash mismatches", async () => {
      interestRateModelAddress = mkAddress("0xabc");
      await expect(fuseBase.identifyInterestRateModel(interestRateModelAddress)).to.be.rejectedWith(Error);
    });

    it("should return new IRM when model address hash matches", async () => {
      interestRateModelAddress = ARTIFACTS.JumpRateModel.deployedBytecode.object;
      model = await fuseBase.identifyInterestRateModel(interestRateModelAddress);
      expect(model).not.to.be.null;
    });
  });

  describe("#getInterestRateModel", () => {
    let model;
    let getAssetContractStub: SinonStub;
    let mockAssetContract: SinonStubbedInstance<Contract>;

    beforeEach(() => {
      mockAssetContract = createStubInstance(Contract);
    });

    it("should be rejected with Error when interestRateModel is null", async () => {
      Object.defineProperty(mockAssetContract, "callStatic", {
        value: {
          interestRateModel: () => Promise.resolve(mkAddress("0xabc")),
        },
      });
      getAssetContractStub = stub(utilsFns, "getContract").returns(mockAssetContract);
      model = fuseBase.getInterestRateModel(mkAddress("0xabc"));
      await expect(model).to.be.rejectedWith(Error);
      expect(getAssetContractStub).to.be.calledOnce;
    });

    it("should init interest Rate Model when model is not null ", async () => {
      const initStub = stub(JumpRateModel.prototype, "init");
      const interestRateModelAddress = ARTIFACTS.JumpRateModel.deployedBytecode.object;
      Object.defineProperty(mockAssetContract, "callStatic", {
        value: {
          interestRateModel: () => Promise.resolve(interestRateModelAddress),
        },
      });
      getAssetContractStub = stub(utilsFns, "getContract").returns(mockAssetContract);
      model = await fuseBase.getInterestRateModel(mkAddress("0xabc"));
      expect(initStub).to.be.calledOnce;
      expect(getAssetContractStub).to.be.calledOnce;
      expect(model).not.to.be.null;
    });
  });

  describe("#getPriceOracle", () => {
    let name: string;

    it("should return text when oracle is not found", async () => {
      name = await fuseBase.getPriceOracle(mkAddress("0xabc"));
      expect(name).to.equal("Unrecognized Oracle");
    });
  });
});
