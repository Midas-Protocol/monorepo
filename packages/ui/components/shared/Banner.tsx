import { Alert, AlertDescription, AlertIcon, AlertProps } from '@chakra-ui/alert';
import { Link, Text } from '@chakra-ui/react';
import React from 'react';

export const Banner = ({
  text,
  linkText,
  linkUrl,
  status = 'warning',
  ...alertProps
}: {
  text: string;
  linkText?: string;
  linkUrl?: string;
  status?: string;
} & AlertProps) => {
  return (
    <Alert status={status} justifyContent="center" {...alertProps}>
      <AlertIcon />
      <AlertDescription>
        <Text variant="mdText">
          {text}
          {linkText && linkUrl && (
            <Link fontWeight="bold" href={linkUrl} isExternal>
              {linkText}
            </Link>
          )}
        </Text>
      </AlertDescription>
    </Alert>
  );
};
