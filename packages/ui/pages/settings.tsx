import { NextPage, NextPageContext } from 'next';
import { getCsrfToken } from 'next-auth/react';
import Head from 'next/head';
import { useEffect } from 'react';

import { SettingsPage } from '@ui/components/pages/SettingsPage';
import { useMultiMidas } from '@ui/context/MultiMidasContext';

export async function getInitialProps() {
  return {};
}

export async function getServerSideProps(context: NextPageContext) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  };
}

const Settings: NextPage = () => {
  const { setGlobalLoading } = useMultiMidas();

  useEffect(() => {
    setGlobalLoading(false);
  }, [setGlobalLoading]);

  return (
    <>
      <Head>
        <title>Settings</title>
      </Head>
      <SettingsPage />
    </>
  );
};

export default Settings;
