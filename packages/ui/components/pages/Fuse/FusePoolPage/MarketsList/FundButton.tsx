import { Box, Button, useDisclosure } from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';
import { useMemo } from 'react';

import { BorrowModal } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/BorrowModal';
import { SupplyModal } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/SupplyModal';
import { WithdrawModal } from '@ui/components/pages/Fuse/FusePoolPage/MarketsList/WithdrawModal';
import { useTokenData } from '@ui/hooks/useTokenData';
import { MarketData } from '@ui/types/TokensDataMap';

export const FundButton = ({
  comptrollerAddress,
  assets,
  asset,
  mode,
  isDisabled,
  // supplyBalanceFiat,
  poolChainId,
}: {
  comptrollerAddress: string;
  assets: MarketData[];
  asset: MarketData;
  mode: FundOperationMode;
  isDisabled?: boolean;
  // supplyBalanceFiat?: number;
  poolChainId: number;
}) => {
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();
  const { data: tokenData } = useTokenData(asset.underlyingToken, poolChainId);
  const modeName = useMemo(() => {
    const enumName = FundOperationMode[mode].toLowerCase();
    const name = enumName.charAt(0).toUpperCase() + enumName.slice(1);

    return name;
  }, [mode]);

  return (
    <Box>
      <Button
        className={`${tokenData?.symbol ?? asset.underlyingSymbol} ${modeName.toLowerCase()}`}
        onClick={openModal}
        isDisabled={isDisabled}
      >
        {modeName}
      </Button>
      {mode === FundOperationMode.SUPPLY && (
        <SupplyModal
          isOpen={isModalOpen}
          asset={asset}
          assets={assets}
          comptrollerAddress={comptrollerAddress}
          onClose={closeModal}
          poolChainId={poolChainId}
        />
      )}
      {mode === FundOperationMode.WITHDRAW && (
        <WithdrawModal
          isOpen={isModalOpen}
          asset={asset}
          assets={assets}
          onClose={closeModal}
          poolChainId={poolChainId}
        />
      )}
      {mode === FundOperationMode.BORROW && (
        <BorrowModal
          isOpen={isModalOpen}
          asset={asset}
          assets={assets}
          onClose={closeModal}
          poolChainId={poolChainId}
        />
      )}
      {/* <PoolModal
        defaultMode={mode}
        comptrollerAddress={comptrollerAddress}
        assets={assets}
        asset={asset}
        isOpen={isModalOpen}
        onClose={closeModal}
        supplyBalanceFiat={supplyBalanceFiat}
        poolChainId={poolChainId}
      /> */}
    </Box>
  );
};
