import { chainIdToConfig } from '@midas-capital/chains';
import { MidasSdk } from '@midas-capital/sdk';
import Security from '@midas-capital/security';
import type { SupportedChains } from '@midas-capital/types';
import * as Sentry from '@sentry/browser';
import type { Dispatch, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { WalletClient } from 'viem';
import { createPublicClient, http } from 'viem';
import { useAccount, useDisconnect, useNetwork, useWalletClient } from 'wagmi';
import type { Chain } from 'wagmi';

import { MIDAS_LOCALSTORAGE_KEYS } from '@ui/constants/index';

export interface MultiMidasContextData {
  address?: string;
  chainIds: SupportedChains[];
  currentChain?: Chain & {
    unsupported?: boolean | undefined;
  };
  currentSdk?: MidasSdk;
  disconnect: () => void;
  getSdk: (chainId: number) => MidasSdk | undefined;
  getSecurity: (chainId: number) => Security | undefined;
  isConnected: boolean;
  isGlobalLoading: boolean;
  isSidebarCollapsed: boolean | undefined;
  sdks: MidasSdk[];
  securities: Security[];
  setAddress: Dispatch<string>;
  setGlobalLoading: Dispatch<boolean>;
  setIsSidebarCollapsed: Dispatch<boolean>;
  walletClient?: WalletClient | null;
}

export const MultiMidasContext = createContext<MultiMidasContextData | undefined>(undefined);

interface MultiMidasProviderProps {
  chains: Chain[];
  children: ReactNode;
}

export const MultiMidasProvider = (
  { children, chains }: MultiMidasProviderProps = { chains: [], children: null }
) => {
  const { chain } = useNetwork();
  // const { chain, chains } = useNetwork();
  const { address: wagmiAddress, isConnected } = useAccount();
  // const { address, isConnecting, isReconnecting, isConnected } = useAccount();
  // const { isLoading: isNetworkLoading, isIdle, switchNetworkAsync } = useSwitchNetwork();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();
  const [address, setAddress] = useState<string | undefined>();
  const [currentChain, setCurrentChain] = useState<
    | (Chain & {
        unsupported?: boolean | undefined;
      })
    | undefined
  >();
  const [isGlobalLoading, setGlobalLoading] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>();

  const [sdks, securities, chainIds] = useMemo(() => {
    const _sdks: MidasSdk[] = [];
    const _securities: Security[] = [];
    const _chainIds: SupportedChains[] = [];
    chains.map((chain) => {
      const config = chainIdToConfig[chain.id];
      const publicClient = createPublicClient({
        chain: chain,
        transport: http(config.specificParams.metadata.rpcUrls.default.http[0]),
      });

      _sdks.push(new MidasSdk(publicClient, null, config));
      _securities.push(new Security(chain.id, publicClient, null));
      _chainIds.push(chain.id);
    });

    return [_sdks, _securities, _chainIds.sort()];
  }, [chains]);

  const currentSdk = useMemo(() => {
    if (chain && !chain.unsupported) {
      return sdks.find((sdk) => sdk.chainId === chain.id);
    }
  }, [sdks, chain]);

  const getSdk = useCallback(
    (chainId: number) => {
      return sdks.find((sdk) => sdk.chainId === chainId);
    },
    [sdks]
  );

  const getSecurity = useCallback(
    (chainId: number) => securities.find((security) => security.chainConfig.chainId === chainId),
    [securities]
  );

  useEffect(() => {
    sdks.map((sdk) => {
      if (walletClient && sdk.chainId === walletClient.chain.id) {
        sdk.setClients(sdk.publicClient, walletClient);
      } else {
        sdk.setClients(sdk.publicClient, null);
      }
    });
  }, [walletClient, sdks]);

  useEffect(() => {
    if (wagmiAddress) {
      Sentry.setUser({ id: wagmiAddress });
    }

    setAddress(wagmiAddress);
  }, [wagmiAddress]);

  useEffect(() => {
    setCurrentChain(chain);
  }, [chain]);

  useEffect(() => {
    const oldData = localStorage.getItem(MIDAS_LOCALSTORAGE_KEYS);
    if (oldData && JSON.parse(oldData).isSidebarCollapsed) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, []);

  useEffect(() => {
    if (isSidebarCollapsed !== undefined) {
      const oldData = localStorage.getItem(MIDAS_LOCALSTORAGE_KEYS);
      let oldObj;
      if (oldData) {
        oldObj = JSON.parse(oldData);
      }
      const data = { ...oldObj, isSidebarCollapsed };
      localStorage.setItem(MIDAS_LOCALSTORAGE_KEYS, JSON.stringify(data));
    }
  }, [isSidebarCollapsed]);

  const value = useMemo(() => {
    return {
      address,
      chainIds,
      currentChain,
      currentSdk,
      disconnect,
      getSdk,
      getSecurity,
      isConnected,
      isGlobalLoading,
      isSidebarCollapsed,
      sdks,
      securities,
      setAddress,
      setGlobalLoading,
      setIsSidebarCollapsed,
      walletClient,
    };
  }, [
    sdks,
    securities,
    getSecurity,
    chainIds,
    isGlobalLoading,
    setGlobalLoading,
    currentChain,
    currentSdk,
    getSdk,
    address,
    disconnect,
    isConnected,
    walletClient,
    setAddress,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  ]);

  return <MultiMidasContext.Provider value={value}>{children}</MultiMidasContext.Provider>;
};

// Hook
export function useMultiMidas() {
  const context = useContext(MultiMidasContext);

  if (context === undefined) {
    throw new Error(`useMultiMidas must be used within a MultiMidasProvider`);
  }

  return context;
}
