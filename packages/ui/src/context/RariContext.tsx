import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Button, Link as ChakraLink, useToast } from '@chakra-ui/react';
import { Provider, Web3Provider } from '@ethersproject/providers';
import { Fuse } from '@midas-capital/sdk';
import { useTranslation } from 'next-i18next';
import {
  createContext,
  Dispatch,
  MutableRefObject,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from 'react-query';
import { Chain } from 'wagmi';

import { useColors } from '@hooks/useColors';
import { getScanUrlByChainId, NATIVE_TOKEN_DATA } from '@networkData/index';
import { handleGenericError } from '@utils/errorHandling';
import { initFuseWithProviders } from '@utils/web3Providers';
export interface RariContextData {
  fuse: Fuse;
  scanUrl: string | null;
  viewMode: string;
  setViewMode: Dispatch<string>;
  loading: boolean;
  setLoading: Dispatch<boolean>;
  pendingTxHash: string;
  setPendingTxHash: Dispatch<string>;
  pendingTxHashes: string[];
  setPendingTxHashes: Dispatch<string[]>;
  accountBtnElement: MutableRefObject<HTMLButtonElement | undefined>;
  networkBtnElement: MutableRefObject<HTMLButtonElement | undefined>;
  currentChain: Chain & {
    id: number;
    unsupported?: boolean | undefined;
  };
  chains: Chain[];
  address: string;
  disconnect: () => void;
  coingeckoId: string;
}

export const RariContext = createContext<RariContextData | undefined>(undefined);

export const RariProvider = ({
  children,
  currentChain,
  chains,
  signerProvider,
  address,
  disconnect,
}: {
  children: ReactNode;
  currentChain: Chain & {
    id: number;
    unsupported?: boolean | undefined;
  };
  chains: Chain[];
  signerProvider: Provider;
  address: string;
  disconnect: () => void;
}) => {
  // Rari and Fuse get initially set already
  const fuse = initFuseWithProviders(signerProvider as Web3Provider, currentChain.id);
  const scanUrl = getScanUrlByChainId(currentChain.id);
  const [viewMode, setViewMode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [pendingTxHashes, setPendingTxHashes] = useState<string[]>([]);
  const [pendingTxHash, setPendingTxHash] = useState<string>('');
  const [finishedTxHash, setFinishedTxHash] = useState<string>('');

  const accountBtnElement = useRef<HTMLButtonElement>();
  const networkBtnElement = useRef<HTMLButtonElement>();

  const toast = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { cPage } = useColors();

  const mounted = useRef(false);

  const coingeckoId = NATIVE_TOKEN_DATA[currentChain.id].coingeckoId;

  useEffect(() => {
    mounted.current = true;

    const pendingStr = localStorage.getItem('pendingTxHashes');
    const pending: string[] = pendingStr !== null ? JSON.parse(pendingStr) : [];
    if (pending.length !== 0) {
      pending.map((hash: string) => {
        mounted.current && setPendingTxHash(hash);
      });
    }

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pendingTxHashes', JSON.stringify(pendingTxHashes));
  }, [pendingTxHashes]);

  useEffect(() => {
    const pendingFunc = async (hash: string) => {
      try {
        const tx = await fuse.provider.getTransaction(hash);
        if (tx.from === address) {
          toast({
            title: <>{t('Pending')}!</>,
            description: <>{t('Transaction is pending now')}.</>,
            status: 'info',
            duration: 2000,
            isClosable: true,
            position: 'top-right',
          });
          const res = await tx.wait();
          toast({
            title: <>{t('Complete')}!</>,
            description: (
              <Button
                href={`${scanUrl}/tx/${tx.hash}`}
                rightIcon={<ExternalLinkIcon />}
                color={cPage.primary.bgColor}
                variant={'link'}
                as={ChakraLink}
                isExternal
                width="100%"
                py={2}
              >
                {t('View Transaction')}
              </Button>
            ),
            status: 'success',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          if (res.blockNumber) {
            mounted.current && setFinishedTxHash(hash);
            await queryClient.refetchQueries();
          }
        }
      } catch (e) {
        handleGenericError(e, toast);
        mounted.current && setFinishedTxHash(hash);
      }
    };

    if (pendingTxHash) {
      mounted.current &&
        !pendingTxHashes.includes(pendingTxHash) &&
        setPendingTxHashes([...pendingTxHashes, pendingTxHash]);
      pendingFunc(pendingTxHash);
      setPendingTxHash('');
    }
  }, [pendingTxHash, fuse, address]);

  useEffect(() => {
    if (mounted.current) {
      setPendingTxHashes((pendingTxHashes) =>
        [...pendingTxHashes].filter((hash) => {
          return hash !== finishedTxHash;
        })
      );
    }
  }, [finishedTxHash]);

  const value = useMemo(() => {
    return {
      fuse,
      scanUrl,
      viewMode,
      setViewMode,
      loading,
      setLoading,
      pendingTxHash,
      setPendingTxHash,
      pendingTxHashes,
      setPendingTxHashes,
      accountBtnElement,
      networkBtnElement,
      currentChain,
      chains,
      address,
      disconnect,
      coingeckoId,
    };
  }, [
    fuse,
    scanUrl,
    viewMode,
    setViewMode,
    loading,
    setLoading,
    pendingTxHash,
    setPendingTxHash,
    pendingTxHashes,
    setPendingTxHashes,
    accountBtnElement,
    networkBtnElement,
    currentChain,
    chains,
    address,
    disconnect,
    coingeckoId,
  ]);

  return <RariContext.Provider value={value}>{children}</RariContext.Provider>;
};

// Hook
export function useRari() {
  const context = useContext(RariContext);

  if (context === undefined) {
    throw new Error(`useRari must be used within a RariProvider`);
  }

  return context;
}
