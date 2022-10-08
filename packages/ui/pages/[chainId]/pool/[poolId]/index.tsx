import { NextPage } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';

import FusePoolPage from '@ui/components/pages/Fuse/FusePoolPage';
import { useMultiMidas } from '@ui/context/MultiMidasContext';

const FusePage: NextPage = () => {
  const { setGlobalLoading } = useMultiMidas();
  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  return (
    <>
      <Head>
        <title key="title">Pool Details</title>
      </Head>
      <FusePoolPage />
    </>
  );
};

export default FusePage;
