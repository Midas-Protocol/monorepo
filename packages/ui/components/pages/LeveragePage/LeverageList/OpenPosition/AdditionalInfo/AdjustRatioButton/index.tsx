import { Box, Button, useDisclosure } from '@chakra-ui/react';
import type { OpenPosition } from '@midas-capital/types';

import { AdjustRatioModal } from '@ui/components/pages/LeveragePage/LeverageList/OpenPosition/AdditionalInfo/AdjustRatioButton/AdjustRatioModal/index';

export const AdjustRatioButton = ({ position }: { position: OpenPosition }) => {
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();

  return (
    <Box>
      <Button onClick={openModal}>Adjust Leverage Ratio</Button>
      <AdjustRatioModal isOpen={isModalOpen} onClose={closeModal} position={position} />
    </Box>
  );
};
