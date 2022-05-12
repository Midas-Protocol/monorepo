import { SupportedChains } from '@midas-capital/sdk';

import { ChainMetadata } from '@type/ChainMetaData';

const mainnet: ChainMetadata = {
  chainId: SupportedChains.moonbeam,
  chainIdHex: '0x504',
  name: 'Moonbeam',
  shortName: 'Moonbeam',
  img: 'https://raw.githubusercontent.com/sushiswap/icons/master/network/moonbeam.jpg',
  enabled: true,
  supported: true,
  blocksPerMin: 5,
  blockExplorerUrls: { default: { name: 'Moonbeam', url: 'https://moonscan.io/' } },
  rpcUrls: { default: 'ttps://rpc.api.moonbeam.network' },
  nativeCurrency: {
    symbol: 'GLMR',
    address: '0x0000000000000000000000000000000000000000',
    name: 'Moonbeam',
    decimals: 18,
    color: '#627EEA',
    overlayTextColor: '#fff',
    logoURL: 'https://raw.githubusercontent.com/sushiswap/icons/master/network/moonbeam.jpg',
    coingeckoId: 'moonbeam',
  },
};

const testnet: ChainMetadata = {
  chainId: SupportedChains.moonbase_alpha,
  chainIdHex: '0x507',
  name: 'Moonbase Alpha',
  shortName: 'Moonbase Alpha',
  img: 'https://raw.githubusercontent.com/sushiswap/icons/master/network/moonbeam.jpg',
  rpcUrls: { default: 'https://rpc.testnet.moonbeam.network' },
  enabled: true,
  supported: process.env.NODE_ENV === 'development' || !!process.env.NEXT_PUBLIC_SHOW_TESTNETS,
  blocksPerMin: 5,
  blockExplorerUrls: {
    default: { name: 'Moonbeam(Testnet)', url: 'https://moonbase.moonscan.io/' },
  },
  nativeCurrency: {
    symbol: 'DEV',
    address: '0x0000000000000000000000000000000000000000',
    name: 'Moonbase Alpha',
    decimals: 18,
    color: '#627EEA',
    overlayTextColor: '#fff',
    logoURL: 'https://raw.githubusercontent.com/sushiswap/icons/master/network/moonbeam.jpg',
    coingeckoId: 'moonbeam',
  },
  testnet: true,
};

const chain = { mainnet, testnet };

export default chain;
