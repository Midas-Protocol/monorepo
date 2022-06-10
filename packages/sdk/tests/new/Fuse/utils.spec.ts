import proxyquire from "proxyquire";
import { SinonSpy, SinonStub, spy, stub } from "sinon";

import { expect } from "../globalTestHook";
import { mkAddress } from "../helpers";

describe("Fuse utils", () => {
  let solidityKeccak256Spy: SinonSpy;
  let keccak256Spy: SinonSpy;
  let getCreate2AddressSpy: SinonSpy;
  let ContractFactoryStub: SinonStub;
  let ContractStub: SinonStub;
  let AbiCoderStub: SinonStub;

  let utilsFns;

  beforeEach(() => {
    utilsFns = proxyquire("../../../src/Fuse/utils", {
      ethers: {
        utils: {
          solidityKeccak256: solidityKeccak256Spy,
          keccak256: keccak256Spy,
          getCreate2Address: getCreate2AddressSpy,
        },
        ContractFactory: ContractFactoryStub,
        Contract: ContractStub,
        AbiCoder: AbiCoderStub,
      },
    });
  });

  describe("filterOnlyObjectProperties", () => {
    it("should filter out NaN key from object", () => {
      const obj = {
        a: "1",
        b: undefined,
        3: "number",
      };
      const r = utilsFns.filterOnlyObjectProperties(obj);
      expect(r).to.have.property("a", "1");
      expect(r).not.to.have.property(3);
    });
  });

  describe("filterPoolName", () => {
    it("should mask Pool Name", () => {
      const name = "R1";
      const r = utilsFns.filterPoolName(name);
      expect(r).to.equal("  ");
    });
  });

  describe("getComptrollerFactory", () => {
    ContractFactoryStub = stub();
    it("ContractFactory should be called", () => {
      utilsFns.getComptrollerFactory();
      expect(ContractFactoryStub).to.be.calledOnce;
    });
  });

  describe("getSaltsHash", () => {
    solidityKeccak256Spy = spy();
    it("Get KECCAK256 encoded value", () => {
      utilsFns.getSaltsHash(mkAddress("0xa"), "R1", 12345);
      expect(solidityKeccak256Spy).to.be.calledOnce;
    });
  });

  describe("getBytecodeHash", () => {
    keccak256Spy = spy();
    AbiCoderStub = stub().returns({
      encode: () => "0x1231",
    });
    it("Get KECCAK256 encoded value", () => {
      utilsFns.getBytecodeHash(mkAddress("0xa"));
      expect(keccak256Spy).to.be.calledOnce;
    });
  });

  describe("getPoolAddress", () => {
    getCreate2AddressSpy = spy();
    it("Get pool address", () => {
      utilsFns.getPoolAddress(mkAddress("0xabc"), "Test", 1, mkAddress("0xfcc"), mkAddress("0xacc"));
      expect(getCreate2AddressSpy).to.be.calledOnce;
    });
  });

  describe("getPoolUnitroller", () => {
    ContractStub = stub();
    it("Unitroller should be called", () => {
      utilsFns.getPoolUnitroller();
      expect(ContractStub).to.be.calledOnce;
    });
  });

  describe("getPoolComptroller", () => {
    ContractStub = stub();
    it("Comptroller should be called", () => {
      utilsFns.getPoolComptroller();
      expect(ContractStub).to.be.calledTwice;
    });
  });
});
