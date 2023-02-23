import { Box, Button, useDisclosure } from '@chakra-ui/react';
import { ComptrollerErrorCodes, NativePricedFuseAsset } from '@midas-capital/types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import ConfirmDeleteAlert from '@ui/components/shared/ConfirmDeleteAlert';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useIsEditableAdmin } from '@ui/hooks/fuse/useIsEditableAdmin';
import { useIsUpgradeable } from '@ui/hooks/fuse/useIsUpgradable';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { handleGenericError } from '@ui/utils/errorHandling';

const RemoveAssetButton = ({
  comptrollerAddress,
  asset,
  poolChainId,
  setSelectedAsset,
  assets,
}: {
  comptrollerAddress: string;
  asset: NativePricedFuseAsset;
  poolChainId: number;
  setSelectedAsset: (value: NativePricedFuseAsset) => void;
  assets: NativePricedFuseAsset[];
}) => {
  const { currentSdk } = useMultiMidas();
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();
  const isUpgradeable = useIsUpgradeable(comptrollerAddress, poolChainId);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();
  const [isRemoving, setIsRemoving] = useState(false);
  const isEditableAdmin = useIsEditableAdmin(comptrollerAddress, poolChainId);

  const removeAsset = () => {
    onClose();
    remove();
  };

  const remove = async () => {
    if (!currentSdk) return;

    setIsRemoving(true);
    const comptroller = currentSdk.createComptroller(comptrollerAddress, currentSdk.signer);
    const response = await comptroller.callStatic._unsupportMarket(asset.cToken);

    if (!response.eq(0)) {
      const err = new Error(' Code: ' + ComptrollerErrorCodes[response.toNumber()]);
      throw err;
    }

    try {
      const tx = await comptroller._unsupportMarket(asset.cToken);
      await tx.wait();

      await queryClient.refetchQueries();
      setSelectedAsset(assets[0]);

      successToast({
        description: 'You have successfully removed an asset from this pool!',
      });
    } catch (error) {
      const sentryProperties = {
        token: asset.cToken,
        chainId: currentSdk.chainId,
        comptroller: comptrollerAddress,
      };
      const sentryInfo = {
        contextName: 'Removing asset',
        properties: sentryProperties,
      };
      handleGenericError({ error, toast: errorToast, sentryInfo });

      return;
    }

    setIsRemoving(false);
  };

  return isUpgradeable ? (
    <Box ml="auto">
      <Button isDisabled={!isEditableAdmin} isLoading={isRemoving} ml={2} onClick={onOpen}>
        Remove {asset.underlyingSymbol}
      </Button>
      <ConfirmDeleteAlert
        description="You can't undo this action afterwards"
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={removeAsset}
        title={`Are you sure to remove ${asset.underlyingSymbol}?`}
      />
    </Box>
  ) : null;
};

export default RemoveAssetButton;
