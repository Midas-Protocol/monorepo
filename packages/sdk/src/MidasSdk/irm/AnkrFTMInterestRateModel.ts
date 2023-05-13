//
import { keccak256 } from "viem";

import AnkrFTMInterestRateModelArtifact from "../../../artifacts/AnkrFTMInterestRateModel.json";

import AnkrCertificateInterestRateModel from "./AnkrCertificateInterestRateModel";

export default class AnkrFTMInterestRateModel extends AnkrCertificateInterestRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(AnkrFTMInterestRateModelArtifact.deployedBytecode.object);
}
