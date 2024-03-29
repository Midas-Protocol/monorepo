import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Spacer,
  Text,
} from '@chakra-ui/react';
import type { NativePricedFuseAsset } from '@midas-capital/types';
import { useAddRecentTransaction } from '@rainbow-me/rainbowkit';
import { utils } from 'ethers';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { CButton } from '@ui/components/shared/Button';
import { Column } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import {
  ADD,
  BORROW_CAP_WHITELIST,
  BORROW_CAP_WHITELIST_TOOLTIP,
  REMOVE,
} from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useCTokenData } from '@ui/hooks/fuse/useCTokenData';
import { useErrorToast, useInfoToast, useSuccessToast } from '@ui/hooks/useToast';
import { handleGenericError } from '@ui/utils/errorHandling';

interface BorrowCapWhitelistProps {
  comptrollerAddress: string;
  poolChainId: number;
  selectedAsset: NativePricedFuseAsset;
}

export const BorrowCapWhitelist = ({
  comptrollerAddress,
  selectedAsset,
  poolChainId,
}: BorrowCapWhitelistProps) => {
  const { cToken: cTokenAddress, underlyingSymbol } = selectedAsset;
  const { currentSdk } = useMultiMidas();
  const { data: cTokenData } = useCTokenData(comptrollerAddress, cTokenAddress, poolChainId);
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();
  const infoToast = useInfoToast();
  const addRecentTransaction = useAddRecentTransaction();

  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      addressWhitelisted: BORROW_CAP_WHITELIST.DEFAULT,
      mode: ADD,
    },
  });

  const watchAddressWhitelisted = watch('addressWhitelisted', BORROW_CAP_WHITELIST.DEFAULT);
  const watchMode = watch('mode', ADD);

  const updateBorrowCapWhitelist = async ({
    addressWhitelisted,
    mode,
  }: {
    addressWhitelisted: string;
    mode: string;
  }) => {
    if (!currentSdk) return;

    try {
      setIsUpdating(true);

      const validAddress = utils.getAddress(addressWhitelisted);
      const comptroller = currentSdk.createComptroller(comptrollerAddress, currentSdk.signer);
      const isBorrowCapwhitelisted = await comptroller.callStatic.isBorrowCapWhitelisted(
        cTokenAddress,
        validAddress
      );

      if (
        (!isBorrowCapwhitelisted && mode === ADD) ||
        (isBorrowCapwhitelisted && mode === REMOVE)
      ) {
        const tx = await comptroller._borrowCapWhitelist(cTokenAddress, validAddress, mode === ADD);
        addRecentTransaction({
          description: `${
            mode === ADD ? 'Adding' : 'Removing'
          } ${validAddress} in whitelist to borrow ${underlyingSymbol}`,
          hash: tx.hash,
        });
        await tx.wait();

        successToast({
          description: `Successfully ${mode === ADD ? 'added' : 'removed'} in whitelist.`,
          id: 'Whitelist - ' + Math.random().toString(),
        });
      } else {
        infoToast({
          description: `This address is already ${
            mode === ADD ? 'added' : 'removed'
          } in whitelist.`,
          id: 'Already added - ' + Math.random().toString(),
        });
      }
    } catch (error) {
      const sentryProperties = {
        account: addressWhitelisted,
        chainId: currentSdk.chainId,
        comptroller: comptrollerAddress,
        token: cTokenAddress,
      };
      const sentryInfo = {
        contextName: 'Updating Borrow Cap Whitelist',
        properties: sentryProperties,
      };
      handleGenericError({ error, sentryInfo, toast: errorToast });
    } finally {
      setIsUpdating(false);
      setAddressWhitelistDefault();
    }
  };

  const setAddressWhitelistDefault = () => {
    setValue('addressWhitelisted', BORROW_CAP_WHITELIST.DEFAULT);
  };

  return (
    <Column
      crossAxisAlignment="flex-start"
      height="100%"
      mainAxisAlignment="flex-start"
      overflowY="auto"
      width="100%"
    >
      {cTokenData && (
        <>
          <Flex
            as="form"
            direction="column"
            onSubmit={handleSubmit(updateBorrowCapWhitelist)}
            px={{ base: 4, md: 8 }}
            py={4}
            w="100%"
          >
            <Flex
              alignItems="stretch"
              direction={{ base: 'column', sm: 'row' }}
              w="100%"
              wrap="wrap"
            >
              <FormLabel htmlFor="whitelist" margin={0}>
                <HStack>
                  <Text size="md" width="max-content">
                    Borrow Cap Whitelist{' '}
                  </Text>
                  <SimpleTooltip label={BORROW_CAP_WHITELIST_TOOLTIP}>
                    <InfoOutlineIcon ml={1} />
                  </SimpleTooltip>
                </HStack>
              </FormLabel>
              <Spacer />
              <FormControl isInvalid={!!errors.addressWhitelisted} width="max-content">
                <HStack alignItems="flex-start">
                  <Column crossAxisAlignment="flex-start" mainAxisAlignment="flex-start">
                    <Controller
                      control={control}
                      name="addressWhitelisted"
                      render={({ field: { value, onChange } }) => (
                        <Input
                          onChange={(event) => onChange(event.target.value)}
                          placeholder="0x0000000000000000000000000000000000000000"
                          type="text"
                          value={value}
                          width={200}
                        />
                      )}
                      rules={{
                        required: 'Address is required',
                        validate: {
                          isValidAdress: (v) => utils.isAddress(v) || 'Invalid address',
                        },
                      }}
                    />

                    <FormErrorMessage marginBottom="-10px" maxWidth="270px">
                      {errors.addressWhitelisted && errors.addressWhitelisted.message}
                    </FormErrorMessage>
                  </Column>
                  <Column crossAxisAlignment="flex-start" mainAxisAlignment="flex-start">
                    <Controller
                      control={control}
                      name="mode"
                      render={({ field: { onChange } }) => (
                        <ButtonGroup
                          gap={0}
                          isAttached={true}
                          justifyContent="flex-start"
                          spacing={0}
                        >
                          {[ADD, REMOVE].map((_mode) => (
                            <CButton
                              height={10}
                              isDisabled={isUpdating}
                              isSelected={watchMode === _mode}
                              key={_mode}
                              onClick={() => onChange(_mode)}
                              variant="filter"
                            >
                              {_mode}
                            </CButton>
                          ))}
                        </ButtonGroup>
                      )}
                    />
                  </Column>
                </HStack>
              </FormControl>
            </Flex>

            {watchAddressWhitelisted !== '' && (
              <ButtonGroup alignSelf="end" gap={0} mt={2}>
                <Button isDisabled={isUpdating} isLoading={isUpdating} type="submit">
                  Save
                </Button>
                <Button
                  isDisabled={isUpdating}
                  onClick={setAddressWhitelistDefault}
                  variant="silver"
                >
                  Cancel
                </Button>
              </ButtonGroup>
            )}
          </Flex>
        </>
      )}
    </Column>
  );
};
