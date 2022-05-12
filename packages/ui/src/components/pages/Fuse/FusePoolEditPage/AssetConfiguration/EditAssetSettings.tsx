import { Spinner, Text } from '@chakra-ui/react';
import React from 'react';

import { AssetSettings } from '@components/pages/Fuse/FusePoolEditPage/AssetConfiguration/AssetSettings';
import { useTokenData } from '@hooks/useTokenData';
import { Center } from '@utils/chakraUtils';

const EditAssetSettings = ({
  tokenAddress,
  poolName,
  poolID,
  comptrollerAddress,
  cTokenAddress,
  isPaused,
}: {
  tokenAddress: string;
  poolName: string;
  poolID: string;
  comptrollerAddress: string;
  cTokenAddress: string;
  isPaused: boolean;
}) => {
  const { data: tokenData, isLoading } = useTokenData(tokenAddress);
  if (isLoading) {
    return (
      <Center width="100%" height="100%">
        <Spinner />
      </Center>
    );
  }

  if (tokenData) {
    return (
      <AssetSettings
        comptrollerAddress={comptrollerAddress}
        poolName={poolName}
        poolID={poolID}
        tokenData={tokenData}
        cTokenAddress={cTokenAddress}
        isPaused={isPaused}
      />
    );
  }
  return (
    <Center width="100%" height="100%">
      <Text>Try again later</Text>
    </Center>
  );
};

export default EditAssetSettings;
