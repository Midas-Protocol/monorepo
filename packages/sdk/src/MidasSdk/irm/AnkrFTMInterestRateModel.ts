//
import { keccak256, numberToHex } from "viem";

import AnkrFTMInterestRateModelArtifact from "../../../artifacts/AnkrFTMInterestRateModel.json";

import AnkrCertificateInterestRateModel from "./AnkrCertificateInterestRateModel";

export default class AnkrFTMInterestRateModel extends AnkrCertificateInterestRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(
    numberToHex(BigInt(AnkrFTMInterestRateModelArtifact.deployedBytecode.object))
  );
}
