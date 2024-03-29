import { HStack, Switch, Text } from '@chakra-ui/react';

import { MidasBox } from '@ui/components/shared/Box';

export const EnableCollateral = ({
  enableAsCollateral,
  setEnableAsCollateral,
}: {
  enableAsCollateral: boolean;
  setEnableAsCollateral: (enabling: boolean) => void;
}) => {
  return (
    <MidasBox p={4} width="100%">
      <HStack alignItems="center" justifyContent="space-between" width="100%">
        <Text size="sm">Enable As Collateral:</Text>
        <Switch
          isChecked={enableAsCollateral}
          onChange={() => {
            setEnableAsCollateral(!enableAsCollateral);
          }}
        />
      </HStack>
    </MidasBox>
  );
};
