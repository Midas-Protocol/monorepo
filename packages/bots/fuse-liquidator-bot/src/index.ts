export { default as approveTokensToSafeLiquidator } from "./approveTokensToSafeLiquidator";

export { default as sendTransactionToSafeLiquidator } from "./sendTransactionToSafeLiquidator";

export { default as liquidateUnhealthyBorrows } from "./liquidateUnhealthyBorrows";

export { default as liquidateAndRepeat } from "./liquidateAndRepeat";

export { default as setUpSdk } from "./setUpSdk";

import pino from "pino";

export const logger = pino({
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});
