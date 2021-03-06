import { Spinner, Text } from '@chakra-ui/react';
import { NativePricedFuseAsset } from '@midas-capital/sdk';
import React from 'react';

import { AssetSettings } from '@ui/components/pages/Fuse/FusePoolEditPage/AssetConfiguration/AssetSettings';
import { Center } from '@ui/components/shared/Flex';
import { useTokenData } from '@ui/hooks/useTokenData';

const EditAssetSettings = ({
  comptrollerAddress,
  selectedAsset,
}: {
  comptrollerAddress: string;
  selectedAsset: NativePricedFuseAsset;
}) => {
  const { data: tokenData, isLoading } = useTokenData(selectedAsset.underlyingToken);
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
        selectedAsset={selectedAsset}
        tokenData={tokenData}
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
