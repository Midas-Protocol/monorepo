import { SupportedChains } from '@midas-capital/types';

type RpcUrls = Partial<Record<SupportedChains, string>>;

export const rpcUrls: RpcUrls = {
  [SupportedChains.bsc]: 'https://bsc-dataseed1.binance.org/',
  [SupportedChains.moonbeam]: 'https://moonbeam.api.onfinality.io/public',
  [SupportedChains.polygon]: 'https://rpc-mainnet.matic.quiknode.pro',
};
