import { CheckIcon, SmallCloseIcon as CloseIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  CircularProgress,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useCallback, useMemo, useState } from 'react';

import ClipboardValue from '@ui/components/shared/ClipboardValue';
import { Center } from '@ui/components/shared/Flex';
import { ModalDivider } from '@ui/components/shared/Modal';
import { useRari } from '@ui/context/RariContext';
import { useFlywheel } from '@ui/hooks/rewards/useFlywheel';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { AddFlywheelModalProps, AddFlywheelProps } from '@ui/types/ComponentPropsType';
import { shortAddress } from '@ui/utils/shortAddress';

const AddFlywheel = ({ comptrollerAddress, onSuccess }: AddFlywheelProps) => {
  const { midasSdk, address } = useRari();

  const successToast = useSuccessToast();
  const errorToast = useErrorToast();

  const [flywheelAddress, setFlywheelAddress] = useState<string>('');
  const { data: flywheel, error, isLoading } = useFlywheel(flywheelAddress);

  const [isAdding, setIsAdding] = useState(false);
  const isReady = useMemo(
    () => flywheel?.address === flywheelAddress,
    [flywheel?.address, flywheelAddress]
  );

  const addFlywheel = useCallback(async () => {
    if (!flywheel) return;
    try {
      setIsAdding(true);
      const comptroller = midasSdk.createComptroller(comptrollerAddress);
      const tx = await comptroller.functions._addRewardsDistributor(flywheel?.address, {
        from: address,
      });
      await tx.wait();
      successToast({ description: 'Flywheel added to pool!' });
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      errorToast({
        description: e as string,
      });
    } finally {
      setIsAdding(false);
    }
  }, [address, comptrollerAddress, errorToast, flywheel, midasSdk, onSuccess, successToast]);

  return (
    <VStack width="100%">
      <InputGroup>
        <Input
          px={2}
          textAlign="center"
          placeholder="Flywheel Address: 0xXX...XX"
          value={flywheelAddress}
          isInvalid={!!error}
          onChange={(event) => setFlywheelAddress(event.target.value)}
          autoFocus
        />
        <InputRightElement>
          {error ? (
            <CloseIcon color="fail" />
          ) : isLoading ? (
            <CircularProgress size={'16px'} isIndeterminate color="ecru" />
          ) : flywheel ? (
            <CheckIcon color="success" />
          ) : null}
        </InputRightElement>
      </InputGroup>

      {flywheel && (
        <VStack width={'100%'}>
          <HStack width={'100%'} justify={'space-between'}>
            <Text>Owner:</Text>
            <ClipboardValue label={shortAddress(flywheel.owner)} value={flywheel.address} />
          </HStack>
          <HStack width={'100%'} justify={'space-between'}>
            <Text>Reward Token:</Text>
            <ClipboardValue label={shortAddress(flywheel.rewardToken)} value={flywheel.address} />
          </HStack>
          <HStack width={'100%'} justify={'space-between'}>
            <Text>Rewards Contract:</Text>
            <ClipboardValue label={shortAddress(flywheel.rewards)} value={flywheel.address} />
          </HStack>
          <HStack width={'100%'} justify={'space-between'}>
            <Text>Booster:</Text>
            <ClipboardValue label={shortAddress(flywheel.booster)} value={flywheel.address} />
          </HStack>
        </VStack>
      )}
      <Box px={4} py={2} width="100%">
        <Button
          width="100%"
          isLoading={isAdding}
          disabled={isAdding || !isReady}
          onClick={addFlywheel}
        >
          Add to Pool
        </Button>
      </Box>
    </VStack>
  );
};

const AddFlywheelModal = ({ isOpen, onClose, ...rest }: AddFlywheelModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Existing Flywheel</ModalHeader>
        <ModalCloseButton top={4} />
        <ModalDivider />
        <Center p={4}>
          <AddFlywheel {...rest} onSuccess={onClose} />
        </Center>
      </ModalContent>
    </Modal>
  );
};

export default AddFlywheelModal;
