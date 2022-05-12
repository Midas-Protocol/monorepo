import { Box } from '@chakra-ui/react';
import React from 'react';

import { DarkGlowingBox } from '@components/shared/GlowingBox';
import { useColors } from '@hooks/useColors';
import { ExtendedBoxProps } from '@type/ComponentPropsType';

const DashboardBox = ({ children, glow = false, ...props }: ExtendedBoxProps) => {
  const { cCard } = useColors();
  return (
    <>
      {glow ? (
        <DarkGlowingBox
          borderRadius="10px"
          borderWidth="1px"
          borderColor={cCard.borderColor}
          bgColor={cCard.bgColor}
          color={cCard.txtColor}
          {...props}
        >
          {children}
        </DarkGlowingBox>
      ) : (
        <Box
          borderRadius={10}
          borderWidth={2}
          borderColor={cCard.borderColor}
          bgColor={cCard.bgColor}
          color={cCard.txtColor}
          {...props}
        >
          {children}
        </Box>
      )}
    </>
  );
};

export default DashboardBox;
