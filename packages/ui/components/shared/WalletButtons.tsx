import {
  Button,
  Center,
  Flex,
  HStack,
  Img,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getCsrfToken, signIn, signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { memo } from 'react';
import { BsFillPersonFill } from 'react-icons/bs';
import { GoSignOut } from 'react-icons/go';
import { IoSettingsSharp } from 'react-icons/io5';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { SiweMessage } from 'siwe';
import { useSignMessage } from 'wagmi';

import ClaimAllRewardsButton from '@ui/components/shared/ClaimAllRewardsButton';
import { Row } from '@ui/components/shared/Flex';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useColors } from '@ui/hooks/useColors';
import { useIsSmallScreen } from '@ui/hooks/useScreenSize';
import { useErrorToast } from '@ui/hooks/useToast';
import { handleGenericError } from '@ui/utils/errorHandling';
import { shortAddress } from '@ui/utils/shortAddress';

export const WalletButtons = memo(() => {
  const isMobile = useIsSmallScreen();
  const { disconnect, isConnected, currentChain, address } = useMultiMidas();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { cPage } = useColors();
  const { data: session } = useSession();
  const { signMessageAsync } = useSignMessage();
  const errorToast = useErrorToast();

  const signInFunc = async () => {
    if (isConnected && !session) {
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

  return (
    <Row mainAxisAlignment="center" crossAxisAlignment="center" gap={2}>
      <ClaimAllRewardsButton />
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return <Button onClick={openConnectModal}>Connect Wallet</Button>;
                }

                if (chain.unsupported) {
                  return <Button onClick={openChainModal}>Change Network</Button>;
                }

                return (
                  <Flex gap={2}>
                    <Button onClick={openChainModal} px={2}>
                      {chain.iconUrl && (
                        <Img
                          alt={chain.name ?? 'Chain icon'}
                          src={chain.iconUrl}
                          width={6}
                          height={6}
                          borderRadius="50%"
                        />
                      )}
                      {!isMobile && <Text ml={2}>{chain.name}</Text>}
                    </Button>
                    <Menu isOpen={isOpen}>
                      <MenuButton as={Button} px={2} onMouseEnter={onOpen} onMouseLeave={onClose}>
                        {account.hasPendingTransactions ? (
                          <HStack>
                            <Center height="100%">
                              <Spinner size="md" thickness="4px" speed="1s" />
                            </Center>
                            {!isMobile && <Text>Pending</Text>}
                          </HStack>
                        ) : (
                          <HStack>
                            {<Jazzicon diameter={23} seed={jsNumberForAddress(account.address)} />}
                            {!isMobile && <Text>{shortAddress(account.address)}</Text>}
                          </HStack>
                        )}
                      </MenuButton>
                      <MenuList onMouseEnter={onOpen} onMouseLeave={onClose}>
                        {!session && (
                          <MenuItem onClick={signInFunc}>
                            <HStack>
                              <BsFillPersonFill fontSize={20} color={cPage.primary.txtColor} />
                              <Text>Sign in</Text>
                            </HStack>
                          </MenuItem>
                        )}
                        {session?.user && (
                          <>
                            <MenuItem onClick={openAccountModal}>
                              <HStack>
                                <BsFillPersonFill fontSize={20} color={cPage.primary.txtColor} />
                                <Text>Account</Text>
                              </HStack>
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                router.push('/settings');
                              }}
                            >
                              <HStack>
                                <IoSettingsSharp fontSize={20} color={cPage.primary.txtColor} />
                                <Text>Settings</Text>
                              </HStack>
                            </MenuItem>
                            <MenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                disconnect();
                                signOut();
                              }}
                            >
                              <HStack>
                                <GoSignOut fontSize={20} color={cPage.primary.txtColor} />
                                <Text>Sign out</Text>
                              </HStack>
                            </MenuItem>
                          </>
                        )}
                      </MenuList>
                    </Menu>
                  </Flex>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </Row>
  );
});
