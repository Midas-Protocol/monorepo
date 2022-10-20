import { IrmTypes } from "@midas-capital/types";

const baseIrms = [IrmTypes.WhitePaperInterestRateModel, IrmTypes.JumpRateModel];

const irms: IrmTypes[] = [
  ...baseIrms,
  IrmTypes.AnkrBNBInterestRateModel,
  IrmTypes.JumpRateModel_JARVIS_2_004_4_08,
  IrmTypes.AdjustableJumpRateModel_PSTAKE_WBNB,
  IrmTypes.AdjustableJumpRateModel_TRANSFERO_BRZ,
  IrmTypes.AdjustableJumpRateModel_TRANSFERO_BTCB_ETH_MAI_WBNB,
  IrmTypes.AdjustableJumpRateModel_STADER_WBNB,
];

export default irms;
