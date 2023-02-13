import { ArrowBackIcon } from '@chakra-ui/icons';
import { Flex, HStack, Spinner, Text, useDisclosure } from '@chakra-ui/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { memo, useEffect } from 'react';

import AssetConfiguration from '@ui/components/pages/EditPoolPage/AssetConfiguration';
import AddAssetButton from '@ui/components/pages/EditPoolPage/AssetConfiguration/AddAssetButton';
import AddAssetModal from '@ui/components/pages/EditPoolPage/AssetConfiguration/AddAssetModal';
import FlywheelEdit from '@ui/components/pages/EditPoolPage/FlywheelEdit';
import PoolConfiguration from '@ui/components/pages/EditPoolPage/PoolConfiguration';
import FusePageLayout from '@ui/components/pages/Layout/FusePageLayout';
import { AdminAlert } from '@ui/components/shared/Alert';
import { MidasBox } from '@ui/components/shared/Box';
import { Center, Column, RowOrColumn } from '@ui/components/shared/Flex';
import PageTransitionLayout from '@ui/components/shared/PageTransitionLayout';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useIsComptrollerAdmin } from '@ui/hooks/fuse/useIsComptrollerAdmin';
import { useIsEditableAdmin } from '@ui/hooks/fuse/useIsEditableAdmin';
import { useColors } from '@ui/hooks/useColors';
import { useFusePoolData } from '@ui/hooks/useFusePoolData';
import { useNativePriceInUSD } from '@ui/hooks/useNativePriceInUSD';
import { useIsSemiSmallScreen } from '@ui/hooks/useScreenSize';

const EditPoolPage = memo(() => {
  const isMobile = useIsSemiSmallScreen();

  const {
    isOpen: isAddAssetModalOpen,
    onOpen: openAddAssetModal,
    onClose: closeAddAssetModal,
  } = useDisclosure();

  const { setGlobalLoading } = useMultiMidas();

  const router = useRouter();
  const poolId = router.query.poolId as string;
  const poolChainId = router.query.chainId as string;
  const { data } = useFusePoolData(poolId, Number(poolChainId));
  const { data: usdPrice } = useNativePriceInUSD(Number(poolChainId));
  const isAdmin = useIsComptrollerAdmin(data?.comptroller, data?.chainId);
  const isEditableAdmin = useIsEditableAdmin(data?.comptroller, Number(poolChainId));
  const { cPage } = useColors();

  useEffect(() => {
    if (!isEditableAdmin) {
      closeAddAssetModal();
    }
  }, [isEditableAdmin, closeAddAssetModal]);

  if (!data || !usdPrice) {
    return (
      <Center height="100vh">
        <Spinner />
      </Center>
    );
  }

  return (
    <>
      <Head>
        <title key="title">{`Edit: ${data.name}`}</title>
      </Head>
      <PageTransitionLayout>
        <FusePageLayout>
          <AddAssetModal
            comptrollerAddress={data.comptroller}
            isOpen={isAddAssetModalOpen}
            onClose={closeAddAssetModal}
            poolChainId={Number(poolChainId)}
            poolID={poolId}
            poolName={data.name}
          />

          <Flex
            alignItems="flex-start"
            bgColor={cPage.primary.bgColor}
            color={cPage.primary.txtColor}
            flexDir="column"
            justifyContent="flex-start"
            mx="auto"
            width="100%"
          >
            <HStack mx="auto" spacing={6} width="100%">
              <ArrowBackIcon
                cursor="pointer"
                fontSize="2xl"
                fontWeight="extrabold"
                onClick={() => {
                  setGlobalLoading(true);
                  router.back();
                }}
              />
              <Text fontWeight="bold" size="lg" textAlign="left">
                Back
              </Text>
            </HStack>
            {!!data && (
              <AdminAlert
                isAdmin={isAdmin}
                isAdminText="You are the admin of this Pool!"
                isNotAdminText="You are not the admin of this Pool!"
              />
            )}

            <RowOrColumn
              alignItems="stretch"
              crossAxisAlignment="flex-start"
              isRow={!isMobile}
              mainAxisAlignment="flex-start"
              width="100%"
            >
              <MidasBox mt={4} width={isMobile ? '100%' : '50%'}>
                {data ? (
                  <PoolConfiguration
                    assets={data.assets}
                    comptrollerAddress={data.comptroller}
                    poolChainId={data.chainId}
                    poolName={data.name}
                  />
                ) : (
                  <Center height="100%" py={48}>
                    <Spinner my={8} />
                  </Center>
                )}
              </MidasBox>

              <MidasBox ml={isMobile ? 0 : 4} mt={4} width={isMobile ? '100%' : '50%'}>
                {data.assets.length > 0 ? (
                  <AssetConfiguration
                    assets={data.assets}
                    comptrollerAddress={data.comptroller}
                    openAddAssetModal={openAddAssetModal}
                    poolChainId={data.chainId}
                  />
                ) : (
                  <Column crossAxisAlignment="center" expand mainAxisAlignment="center" py={4}>
                    <Text mb={4}>There are no assets in this pool.</Text>

                    <AddAssetButton
                      comptrollerAddress={data.comptroller}
                      openAddAssetModal={openAddAssetModal}
                      poolChainId={data.chainId}
                    />
                  </Column>
                )}
              </MidasBox>
            </RowOrColumn>
            <FlywheelEdit pool={data} />
          </Flex>
        </FusePageLayout>
      </PageTransitionLayout>
    </>
  );
});

export default EditPoolPage;
