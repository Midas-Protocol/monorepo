type CONFIG = {
  allowedAddresses: string[];
  hidePools137: string[];
  hidePools56: string[];
  hidePools97: string[];
  iconServerURL: string | undefined;
  isArbitrumEnabled: boolean;
  isBscEnabled: boolean;
  isDevelopment: boolean;
  isEvmosEnabled: boolean;
  isMoonbeamEnabled: boolean;
  isPolygonEnabled: boolean;
  isFantomEnabled: boolean;
  isTestnetEnabled: boolean;
  productDomain: string | undefined;
  productUrl: string | undefined;
  supabasePluginRewardsTableName: string;
  supabaseAssetApyTableName: string;
  supabasePluginTableName: string;
  supabasePublicKey: string;
  supabaseUrl: string;
};

const config: CONFIG = {
  allowedAddresses: process.env.FEATURE_CREATE_POOL
    ? process.env.FEATURE_CREATE_POOL.toLowerCase().split(',')
    : [],

  hidePools137: process.env.HIDE_POOLS_137 ? process.env.HIDE_POOLS_137.split(',') : [],
  hidePools56: process.env.HIDE_POOLS_56 ? process.env.HIDE_POOLS_56.split(',') : [],
  hidePools97: process.env.HIDE_POOLS_97 ? process.env.HIDE_POOLS_97.split(',') : [],
  iconServerURL: process.env.ICON_SERVER,
  isArbitrumEnabled: process.env.ARBITRUM === 'true',
  isBscEnabled: process.env.BSC === 'true',
  isDevelopment: process.env.NODE_ENV === 'development',
  isEvmosEnabled: process.env.EVMOS === 'true',
  isMoonbeamEnabled: process.env.MOONBEAM === 'true',
  isPolygonEnabled: process.env.POLYGON === 'true',
  isFantomEnabled: process.env.FANTOM === 'true',
  isTestnetEnabled: process.env.NEXT_PUBLIC_SHOW_TESTNETS === 'true',
  productDomain: process.env.PRODUCT_DOMAIN,
  productUrl: process.env.PRODUCT_URL,
  supabasePluginRewardsTableName: process.env.SUPABASE_PLUGIN_REWARDS_TABLE_NAME ?? '',
  supabaseAssetApyTableName: process.env.SUPABASE_ASSET_APY_TABLE_NAME ?? '',
  supabasePluginTableName: process.env.SUPABASE_PLUGIN_TABLE_NAME ?? '',
  supabasePublicKey: process.env.SUPABASE_KEY ?? '',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
};

export { config };
