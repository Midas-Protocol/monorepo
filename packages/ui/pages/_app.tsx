import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { createConfig, WagmiConfig } from 'wagmi';

import Layout from '@ui/components/shared/Layout';
import RainbowKit from '@ui/components/shared/RainbowKitProvider';
import { config } from '@ui/config/index';
import { MultiMidasProvider } from '@ui/context/MultiMidasContext';
import { theme } from '@ui/theme/index';
import { chains, connectors, publicClient } from '@ui/utils/connectors';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

function MidasDapp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKit>
          <QueryClientProvider client={queryClient}>
            <MultiMidasProvider chains={chains}>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </MultiMidasProvider>
            {config.isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </RainbowKit>
      </WagmiConfig>
    </ChakraProvider>
  );
}

export default appWithTranslation(MidasDapp);
