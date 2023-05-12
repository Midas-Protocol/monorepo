export interface FuseAsset {
  cToken: string;
  plugin?: string;

  /** scaled by `underlying.decimals()`  */
  borrowBalance: bigint;
  /** scaled by `underlying.decimals()`  */
  supplyBalance: bigint;

  /** scaled by `underlying.decimals()`  */
  liquidity: bigint;
  membership: boolean;

  underlyingName: string;
  underlyingSymbol: string;
  underlyingToken: string;
  underlyingDecimals: bigint;

  /** scaled by `1e18` */
  underlyingPrice: bigint;

  /** scaled by `underlying.decimals()`  */
  underlyingBalance: bigint;

  /** scaled by `1e18` */
  collateralFactor: bigint;
  /** scaled by `1e18` */
  reserveFactor: bigint;

  adminFee: bigint;
  fuseFee: bigint;

  borrowRatePerBlock: bigint;
  supplyRatePerBlock: bigint;

  /** scaled by `underlying.decimals()`  */
  totalBorrow: bigint;
  /** scaled by `underlying.decimals()`  */
  totalSupply: bigint;

  isBorrowPaused: boolean;
  isSupplyPaused: boolean;
}

export interface NativePricedFuseAsset extends FuseAsset {
  supplyBalanceNative: number;
  borrowBalanceNative: number;

  totalSupplyNative: number;
  totalBorrowNative: number;

  liquidityNative: number;
  utilization: number;

  extraDocs?: string;

  borrowGuardianPaused: boolean;
  mintGuardianPaused: boolean;

  logoUrl?: string;
  originalSymbol?: string;
}

export interface FusePoolData {
  id: number;
  chainId: number;
  assets: NativePricedFuseAsset[];
  creator: string;
  comptroller: string;
  name: string;
  totalLiquidityNative: number;
  totalAvailableLiquidityNative: number;

  /** scaled by `1e18` */
  totalSuppliedNative: number;
  /** scaled by `1e18` */
  totalBorrowedNative: number;

  totalSupplyBalanceNative: number;
  totalBorrowBalanceNative: number;
  blockPosted: bigint;
  timestampPosted: bigint;
  underlyingTokens: string[];
  underlyingSymbols: string[];
  utilization: number;
}

export interface FusePool {
  name: string;
  creator: string;
  comptroller: string;
  blockPosted: number;
  timestampPosted: number;
}

export interface AssetPrice {
  usdPrice: number;
  underlyingPrice: number;
  createdAt: number;
}

export interface AssetTvl {
  createdAt: number;
  tvlNative: number;
  tvlUnderlying: number;
}

export interface AssetTotalApy {
  createdAt: number;
  totalSupplyApy: number;
  supplyApy: number;
  ankrBNBApr?: number;
  compoundingApy?: number;
  rewardApy?: number;
  borrowApy?: number;
}

export interface ChartData {
  createdAt: number;
  [key: string]: number;
}
