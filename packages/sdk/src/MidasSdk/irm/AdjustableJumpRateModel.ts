import { keccak256 } from "@ethersproject/keccak256";
import AdjustableJumpRateModelArtifact from "@artifacts/AdjustableJumpRateModel.json";

import JumpRateModel from "./JumpRateModel";

export default class AdjustableJumpRateModel extends JumpRateModel {
  static RUNTIME_BYTECODE_HASH = keccak256(AdjustableJumpRateModelArtifact.deployedBytecode.object);
}
