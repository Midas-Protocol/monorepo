import { SupportedChainsArray } from '@midas-capital/types';

export const SUPPORTED_NETWORKS_REGEX = new RegExp(SupportedChainsArray.join('|'));
export const VALID_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const ABILLY = 1e9;

export const MIDAS_DOCS_URL = 'https://docs.midascapital.xyz/';
export const MIDAS_DISCORD_URL = 'https://discord.gg/85YxVuPeMt';
export const MIDAS_TELEGRAM_URL = 'https://t.me/midascapitaltg';
export const MIDAS_TWITTER_URL = 'https://twitter.com/MidasCapitalxyz';

export const CLOSE_FACTOR = {
  DEFAULT: 50,
  MIN: 5,
  MAX: 90,
};

export const LIQUIDATION_INCENTIVE = {
  DEFAULT: 8,
  MIN: 0,
  MAX: 50,
};

export const LOAN_TO_VALUE = {
  DEFAULT: 50,
  MIN: 5,
  MAX: 90,
};

export const RESERVE_FACTOR = {
  DEFAULT: 10,
  MIN: 0,
  MAX: 50,
};

export const ADMIN_FEE = {
  DEFAULT: 5,
  MIN: 0,
  MAX: 30,
};

export const POOLS_PER_PAGE = 6;

// TODO: We should replace this with NATIVE_DECIMALS from the @midas-capital/chains package
export const DEFAULT_DECIMALS = 18;

// enums

export enum FusePoolMetric {
  totalLiquidityNative,
  totalSuppliedNative,
  totalBorrowedNative,
}

export enum UserAction {
  NO_ACTION,
  WAITING_FOR_TRANSACTIONS,
}

export const MINUTES_PER_YEAR = 24 * 365 * 60;

export const UP_LIMIT = 0.005;
export const DOWN_LIMIT = 0;

// for additional APR for aBNBC in Ankr
export const aBNBcContractAddress = '0xBb1Aa6e59E5163D8722a122cd66EBA614b59df0d';
export const aprDays = 7;
export const aBNBcContractABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'day', type: 'uint256' }],
    name: 'averagePercentageRate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export const MARKETS_COUNT_PER_PAGE = [25, 50, 75];
export const POOLS_COUNT_PER_PAGE = [25, 50, 75];

export const REWARDS = 'Rewards';
export const COLLATERAL = 'Collateral';
export const PROTECTED = 'Protected';
export const BORROWABLE = 'Borrowable';
export const DEPRECATED = 'Deprecated';
export const SEARCH = 'Search';
export const ALL = 'All';

export const RESERVE_FACTOR_TOOLTIP =
  'The reserve factor defines the portion of borrower interest that is converted into reserves.';
export const ADMIN_FEE_TOOLTIP =
  "The fraction of interest generated on a given asset that is routed to the asset's admin address as a fee.";
export const LOAN_TO_VALUE_TOOLTIP =
  'The Loan to Value (LTV) ratio defines the maximum amount of tokens in the pool that can be borrowed with a specific collateral. It’s expressed in percentage: if in a pool ETH has 75% LTV, for every 1 ETH worth of collateral, borrowers will be able to borrow 0.75 ETH worth of other tokens in the pool.';
export const MIDAS_LOCALSTORAGE_KEYS = 'midas_localstorage_keys';
export const SHRINK_ASSETS = 10;
export const MIDAS_T_AND_C_ACCEPTED = 'MidasTandCAccepted';
export const SUPPLY_STEPS = ['Approve', 'Enter Market', 'Mint Market Share'];
export const MARKET_LTV = 'Market / LTV';
export const SUPPLY_APY = 'Supply APY';
export const BORROW_APY = 'Borrow APY';
export const SUPPLY_BALANCE = 'Supply Balance';
export const BORROW_BALANCE = 'Borrow Balance';
export const TOTAL_SUPPLY = 'Total Supply';
export const TOTAL_BORROW = 'Total Borrow';
export const LIQUIDITY = 'Liquidity';
export const MARKET_COLUMNS = [
  MARKET_LTV,
  SUPPLY_APY,
  BORROW_APY,
  SUPPLY_BALANCE,
  BORROW_BALANCE,
  TOTAL_SUPPLY,
  TOTAL_BORROW,
  LIQUIDITY,
  COLLATERAL,
];
