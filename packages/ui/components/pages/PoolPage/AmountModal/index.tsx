import { Modal, ModalBody, ModalContent, ModalOverlay } from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';
import { useEffect, useState } from 'react';

import { MarketData } from '@ui/types/TokensDataMap';
import { ModalHeader } from './ModalHeader';
import ModeBorrow from './ModeBorrow';
import ModeRepay from './ModeRepay';
import { ModeSelect } from './ModeSelect';
import ModeSupply from './ModeSupply';
import ModeWithdraw from './ModeWithdraw';

interface PoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode: FundOperationMode;
  asset: MarketData;
  assets: MarketData[];
  comptrollerAddress: string;
  supplyBalanceFiat?: number;
  poolChainId: number;
}

const PoolModal = (props: PoolModalProps) => {
  const [mode, setMode] = useState<FundOperationMode>(props.defaultMode);
  useEffect(() => {
    setMode(props.defaultMode);
  }, [props.isOpen, props.defaultMode]);

  return (
    <Modal motionPreset="slideInBottom" isOpen={props.isOpen} onClose={props.onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalBody p={0}>
          <ModalHeader mode={mode} asset={props.asset} poolChainId={props.poolChainId} />

          <ModeSelect mode={mode} setMode={setMode} asset={props.asset} px={4} />

          {mode === FundOperationMode.SUPPLY && (
            <ModeSupply
              comptrollerAddress={props.comptrollerAddress}
              onClose={props.onClose}
              assets={props.assets}
              asset={props.asset}
              poolChainId={props.poolChainId}
            />
          )}
          {mode === FundOperationMode.WITHDRAW && (
            <ModeWithdraw
              comptrollerAddress={props.comptrollerAddress}
              onClose={props.onClose}
              assets={props.assets}
              asset={props.asset}
              poolChainId={props.poolChainId}
            />
          )}
          {mode === FundOperationMode.REPAY && (
            <ModeRepay
              onClose={props.onClose}
              assets={props.assets}
              asset={props.asset}
              poolChainId={props.poolChainId}
            />
          )}

          {mode === FundOperationMode.BORROW && (
            <ModeBorrow
              onClose={props.onClose}
              assets={props.assets}
              asset={props.asset}
              poolChainId={props.poolChainId}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PoolModal;
