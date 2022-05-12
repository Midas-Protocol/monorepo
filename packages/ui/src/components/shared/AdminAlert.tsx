import { Alert, AlertIcon, AlertProps } from '@chakra-ui/alert';
import { Box } from '@chakra-ui/layout';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useColors } from '@hooks/useColors';

export const AdminAlert = ({
  isAdmin = false,
  isAdminText = 'You are the admin!',
  isNotAdminText = 'You are not the admin!!',
  rightAdornment,
  ...alertProps
}: {
  isAdmin: boolean;
  isAdminText?: string;
  isNotAdminText?: string;
  rightAdornment?: ReactNode;
} & AlertProps) => {
  const { t } = useTranslation();
  const { cAlert } = useColors();
  return (
    <Alert
      backgroundColor={cAlert.bgColor}
      colorScheme={isAdmin ? 'green' : 'red'}
      borderRadius={5}
      mt="5"
      {...alertProps}
    >
      <AlertIcon color={cAlert.iconColor} />
      <span style={{ color: 'black' }}>{t(isAdmin ? isAdminText : isNotAdminText)}</span>
      <Box h="100%" ml="auto">
        {rightAdornment}
      </Box>
    </Alert>
  );
};
