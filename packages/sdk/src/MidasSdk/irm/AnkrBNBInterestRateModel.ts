//

import { keccak256 } from "viem";

import AnkrBNBInterestRateModelArtifact from "../../../artifacts/AnkrBNBInterestRateModel.json";

import AnkrCertificateInterestRateModel from "./AnkrCertificateInterestRateModel";

export default class AnkrBNBInterestRateModel extends AnkrCertificateInterestRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(AnkrBNBInterestRateModelArtifact.deployedBytecode.object);
}
