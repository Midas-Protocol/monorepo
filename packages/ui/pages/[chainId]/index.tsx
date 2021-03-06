import { NextPage } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';

import FusePoolsPage from '@ui/components/pages/Fuse/FusePoolsPage';
import { useRari } from '@ui/context/RariContext';

export async function getInitialProps() {
  return {};
}

const FusePage: NextPage = () => {
  const { setLoading } = useRari();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <>
      <Head>
        <title>Midas Capital</title>
      </Head>
      <FusePoolsPage />
    </>
  );
};

export default FusePage;
