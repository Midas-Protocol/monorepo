import { Container } from '@chakra-ui/react';
import { getCsrfToken, signIn, useSession } from 'next-auth/react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { SiweMessage } from 'siwe';
import { useSignMessage } from 'wagmi';

import Terms from '@ui/components/pages/Fuse/Modals/Terms';
import { Column } from '@ui/components/shared/Flex';
import LoadingOverlay from '@ui/components/shared/LoadingOverlay';
import { MIDAS_T_AND_C_ACCEPTED } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast } from '@ui/hooks/useToast';
import { handleGenericError } from '@ui/utils/errorHandling';

const Layout = ({ children }: { children: ReactNode }) => {
  const { isGlobalLoading, isConnected, address, currentChain } = useMultiMidas();
  const { cPage } = useColors();
  const [isAcceptedTerms, setAcceptedTerms] = useState<boolean | undefined>();
  const mounted = useRef(false);
  const errorToast = useErrorToast();

  const { signMessageAsync } = useSignMessage();

  const { data: session } = useSession();

  useEffect(() => {
    mounted.current = true;

    if (mounted.current) {
      setAcceptedTerms(localStorage.getItem(MIDAS_T_AND_C_ACCEPTED) === 'true');
    }

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const func = async () => {
      if (isConnected && !session && address) {
        try {
          const callbackUrl = '/';
          const message = new SiweMessage({
            domain: window.location.host,
            address: address,
            statement: 'Sign in with Ethereum to the app.',
            uri: window.location.origin,
            version: '1',
            chainId: currentChain?.id,
            nonce: await getCsrfToken(),
          });

          const signature = await signMessageAsync({
            message: message.prepareMessage(),
          });

          signIn('credentials', {
            message: JSON.stringify(message),
            redirect: false,
            signature,
            callbackUrl,
          });
        } catch (error) {
          handleGenericError(error, errorToast);
        }
      }
    };

    func();
  }, [isConnected, session, address, currentChain?.id, signMessageAsync, errorToast]);

  return (
    <LoadingOverlay isLoading={isGlobalLoading}>
      <Column
        height="100%"
        flex={1}
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        bgColor={cPage.primary.bgColor}
      >
        <Container maxWidth="8xl" px={{ base: 2, md: 4 }}>
          <Column
            width={'98%'}
            height="100%"
            flex={1}
            mx="auto"
            mainAxisAlignment="center"
            crossAxisAlignment="stretch"
            position="relative"
          >
            {isAcceptedTerms !== undefined && <Terms isAcceptedTerms={isAcceptedTerms} />}
            {children}
          </Column>
        </Container>
      </Column>
    </LoadingOverlay>
  );
};

export default Layout;
