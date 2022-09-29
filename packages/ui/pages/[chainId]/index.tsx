import { NextPage } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';

import { useMultiMidas } from '@ui/context/MultiMidasContext';

export async function getInitialProps() {
  return {};
}

const FusePage: NextPage = () => {
  const { setGlobalLoading } = useMultiMidas();

  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  return (
    <>
      <Head>
        <title>Midas Capital</title>
      </Head>
    </>
  );
};

export default FusePage;
