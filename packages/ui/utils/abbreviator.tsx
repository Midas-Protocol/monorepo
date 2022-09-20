import { Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

import { PopoverTooltip } from '@ui/components/shared/PopoverTooltip';

export function abbreviator(str: string | undefined, len: number): string | undefined | ReactNode {
  if (str === undefined) return undefined;
  return str?.length <= len ? (
    str
  ) : (
    <PopoverTooltip placement="top-start" body={str}>
      <Text>{str?.slice(0, len) + '...'}</Text>
    </PopoverTooltip>
  );
}
