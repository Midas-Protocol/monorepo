import { JsonRpcProvider } from '@ethersproject/providers';
import { chainIdToConfig } from '@midas-capital/chains';
import { MidasSdk } from '@midas-capital/sdk';
import Security from '@midas-capital/security';
import { SupportedChains } from '@midas-capital/types';
import * as Sentry from '@sentry/browser';
import { FetchSignerResult, Signer } from '@wagmi/core';
import { SdkConfig as ConnextSdkConfig } from "@connext/sdk";
import {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Chain, useAccount, useDisconnect, useNetwork, useSigner } from 'wagmi';

import { useEnabledChains } from '@ui/hooks/useChainConfig';
import { SUPPORTED_CHAINS_BY_CONNEXT } from '../constants';

export interface MultiMidasContextData {
  sdks: MidasSdk[];
  securities: Security[];
  getSecurity: (chainId: number) => Security | undefined;
  chainIds: SupportedChains[];
  isGlobalLoading: boolean;
  setGlobalLoading: Dispatch<boolean>;
  currentChain?: Chain & {
    unsupported?: boolean | undefined;
  };
  currentSdk?: MidasSdk;
  getSdk: (chainId: number) => MidasSdk | undefined;
  connextSdkConfig?: ConnextSdkConfig;
  address?: string;
  disconnect: () => void;
  isConnected: boolean;
  signer?: FetchSignerResult<Signer>;
  setAddress: Dispatch<string>;
}

export const MultiMidasContext = createContext<MultiMidasContextData | undefined>(undefined);

interface MultiMidasProviderProps {
  children: ReactNode;
}

export const MultiMidasProvider = ({ children }: MultiMidasProviderProps = { children: null }) => {
  const enabledChains = useEnabledChains();
  const { chain } = useNetwork();
  // const { chain, chains } = useNetwork();
  const { address: wagmiAddress, isConnected } = useAccount();
  // const { address, isConnecting, isReconnecting, isConnected } = useAccount();
  // const { isLoading: isNetworkLoading, isIdle, switchNetworkAsync } = useSwitchNetwork();
  const { data: signer } = useSigner();
  const { disconnect } = useDisconnect();
  const [address, setAddress] = useState<string | undefined>();
  const [currentChain, setCurrentChain] = useState<
    | (Chain & {
        unsupported?: boolean | undefined;
      })
    | undefined
  >();
  const [isGlobalLoading, setGlobalLoading] = useState<boolean>(false);

  const [sdks, securities, chainIds] = useMemo(() => {
    const _sdks: MidasSdk[] = [];
    const _securities: Security[] = [];
    const _chainIds: SupportedChains[] = [];
    enabledChains.map((chainId) => {
      const config = chainIdToConfig[chainId];
      _sdks.push(
        new MidasSdk(
          new JsonRpcProvider(config.specificParams.metadata.rpcUrls.default.http[0]),
          config
        )
      );
      _securities.push(
        new Security(
          chainId,
          new JsonRpcProvider(config.specificParams.metadata.rpcUrls.default.http[0])
        )
      );
      _chainIds.push(chainId);
    });

    return [_sdks, _securities, _chainIds.sort()];
  }, [enabledChains]);

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

  const connextSdkConfig = useMemo(() => {
    if (chain && !chain.unsupported) {
      const network = SUPPORTED_CHAINS_BY_CONNEXT[chain]?.network;  
      if (network && enabledChains.includes(chain)) {
        const enabledChainsForConnext = enabledChains.filter((chainId: number) => Object.keys(SUPPORTED_CHAINS_BY_CONNEXT).includes(chainId.toString()));
        const domainConfig: any = {};
        const chainConfig = chainIdToConfig[chain];
        for (const enabledChainId of enabledChainsForConnext) {
          const domainId = SUPPORTED_CHAINS_BY_CONNEXT[enabledChainId].domainId;
          
          domainConfig[domainId] = {
            providers: chainConfig.specificParams.metadata.rpcUrls.default.http
          }
        }
  
        const connextSdkConfig: ConnextSdkConfig = {
          signerAddress: wagmiAddress,
          network: network as ("mainnet" | "testnet"),
          chains: domainConfig,
        };
        return connextSdkConfig;
      }
    }
  }, [chain, enabledChains])

  const getSecurity = useCallback(
    (chainId: number) => securities.find((security) => security.chainConfig.chainId === chainId),
    [securities]
  );

  useEffect(() => {
    if (currentSdk && signer) {
      currentSdk.setSigner(signer);
    }
  }, [signer, currentSdk]);

  useEffect(() => {
    if (sdks.length > 0 && !signer) {
      sdks.map((sdk) => {
        const config = chainIdToConfig[sdk.chainId];
        sdk.removeSigner(
          new JsonRpcProvider(config.specificParams.metadata.rpcUrls.default.http[0])
        );
      });
    }
  }, [signer, sdks]);

  useEffect(() => {
    if (wagmiAddress) {
      Sentry.setUser({ id: wagmiAddress });
    }

    setAddress(wagmiAddress);
  }, [wagmiAddress]);

  useEffect(() => {
    setCurrentChain(chain);
  }, [chain]);

  const value = useMemo(() => {
    return {
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
      signer,
      setAddress,
      connextSdkConfig,
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
    signer,
    setAddress,
    connextSdkConfig
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
