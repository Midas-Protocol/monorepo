import { SupportedChains } from '@midas-capital/sdk';

import { ChainMetadata } from '@ui/types/ChainMetaData';

const mainnet: ChainMetadata = {
  chainId: SupportedChains.neon_evm_mainnet,
  chainIdHex: '0xE9AC0D6',
  name: 'Neon EVM Mainnet',
  shortName: 'Neon EVM Mainnet',
  img: '/images/neon.svg',
  enabled: process.env.NEON_EVM_MAINNET === 'true',
  supported: process.env.NEON_EVM_MAINNET === 'true',
  blocksPerMin: 20, //TODO: check blocks per min
  blockExplorerUrls: { default: { name: 'NeonScan', url: 'https://neonscan.org/' } },
  rpcUrls: { default: 'https://proxy.mainnet.neonlabs.org/solana' },
  nativeCurrency: {
    symbol: 'NEON',
    name: 'Neon EVM Mainnet',
  },
  wrappedNativeCurrency: {
    symbol: 'WNEON',
    address: '', //TODO: address should be added
    name: 'Neon EVM Mainnet',
    decimals: 18,
    color: '#627EEA',
    overlayTextColor: '#fff',
    logoURL: '/images/neon.svg',
    coingeckoId: '', // TODO: coingeckoid couldn't find right now
  },
};

const testnet: ChainMetadata = {
  chainId: SupportedChains.neon_evm_devnet,
  chainIdHex: '0xE9AC0CE',
  name: 'Neon EVM Devnet',
  shortName: 'Neon EVM Devnet',
  img: '/images/neon.svg',
  rpcUrls: { default: 'https://proxy.devnet.neonlabs.org/solana' },
  enabled: true,
  supported:
    process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_TESTNETS === 'true',
  blocksPerMin: 20, //TODO: check blocks per min
  blockExplorerUrls: { default: { name: 'NeonScan', url: 'https://neonscan.org/' } },
  nativeCurrency: {
    symbol: 'NEON',
    name: 'Neon EVM Devnet',
  },
  wrappedNativeCurrency: {
    symbol: 'NEON',
    address: '', //TODO: address should be added
    name: 'Neon EVM Devnet',
    decimals: 18,
    color: '#627EEA',
    overlayTextColor: '#fff',
    logoURL: '/images/neon.svg',
    coingeckoId: '', // TODO: coingeckoid couldn't find right now
  },
  testnet: true,
};

const chain = { mainnet, testnet };

export default chain;
