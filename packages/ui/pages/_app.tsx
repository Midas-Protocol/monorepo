import '@ui/styles/index.css';
import { ChakraProvider } from '@chakra-ui/react';
import LogRocket from 'logrocket';
import { appWithTranslation } from 'next-i18next';
import { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { createClient, WagmiConfig } from 'wagmi';

import CheckConnection from '@ui/components/shared/CheckConnection';
import Layout from '@ui/components/shared/Layout';
import { config } from '@ui/config/index';
import { theme } from '@ui/theme/index';
import { connectors, provider } from '@ui/utils/connectors';

const queryClient = new QueryClient();

if (!config.isDevelopment) {
  LogRocket.init('ylr02p/midas-ui');
}

const client = createClient({
  autoConnect: true,
  connectors,
  provider,
});

function MidasDapp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <WagmiConfig client={client}>
        <QueryClientProvider client={queryClient}>
          {config.isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
          <CheckConnection>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </CheckConnection>
        </QueryClientProvider>
      </WagmiConfig>
    </ChakraProvider>
  );
}

export default appWithTranslation(MidasDapp);
