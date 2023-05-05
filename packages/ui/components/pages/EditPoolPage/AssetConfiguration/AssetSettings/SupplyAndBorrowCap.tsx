import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Button,
  ButtonGroup,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  InputGroup,
  InputRightAddon,
  NumberInput,
  NumberInputField,
  Spacer,
  Text,
} from '@chakra-ui/react';
import type { NativePricedFuseAsset } from '@midas-capital/types';
import { useQueryClient } from '@tanstack/react-query';
import { utils } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { CButton } from '@ui/components/shared/Button';
import { Column } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { BORROW_CAP, DEFAULT_DECIMALS, SUPPLY_CAP } from '@ui/constants/index';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useCTokenData } from '@ui/hooks/fuse/useCTokenData';
import { useIsEditableAdmin } from '@ui/hooks/fuse/useIsEditableAdmin';
import { useAllUsdPrices } from '@ui/hooks/useAllUsdPrices';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { smallUsdFormatter } from '@ui/utils/bigUtils';
import { handleGenericError } from '@ui/utils/errorHandling';
interface SupplyAndBorrowCapsProps {
  comptrollerAddress: string;
  poolChainId: number;
  selectedAsset: NativePricedFuseAsset;
}

export const SupplyAndBorrowCaps = ({
  comptrollerAddress,
  selectedAsset,
  poolChainId,
}: SupplyAndBorrowCapsProps) => {
  const queryClient = useQueryClient();
  const { cToken: cTokenAddress } = selectedAsset;
  const { currentSdk } = useMultiMidas();
  const { data: usdPrices } = useAllUsdPrices();
  const usdPrice = useMemo(() => {
    if (usdPrices && usdPrices[poolChainId.toString()]) {
      return usdPrices[poolChainId.toString()].value;
    } else {
      return undefined;
    }
  }, [usdPrices, poolChainId]);
  const [isEditSupplyCap, setIsEditSupplyCap] = useState<boolean>(false);
  const [isEditBorrowCap, setIsEditBorrowCap] = useState<boolean>(false);
  const { data: cTokenData } = useCTokenData(comptrollerAddress, cTokenAddress, poolChainId);

  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      borrowCap: BORROW_CAP.DEFAULT,
      supplyCap: SUPPLY_CAP.DEFAULT,
    },
  });

  const isEditableAdmin = useIsEditableAdmin(comptrollerAddress, poolChainId);

  const watchSupplyCap = Number(watch('supplyCap', SUPPLY_CAP.DEFAULT));
  const watchBorrowCap = Number(watch('borrowCap', BORROW_CAP.DEFAULT));

  useEffect(() => {
    if (cTokenData) {
      setValue('supplyCap', parseFloat(utils.formatUnits(cTokenData.supplyCap, DEFAULT_DECIMALS)));
      setValue('borrowCap', parseFloat(utils.formatUnits(cTokenData.borrowCap, DEFAULT_DECIMALS)));
    }
  }, [cTokenData, setValue]);

  const updateSupplyCaps = async ({ supplyCap }: { supplyCap: number }) => {
    if (!cTokenAddress || !currentSdk) return;

    const comptroller = currentSdk.createComptroller(comptrollerAddress, currentSdk.signer);
    try {
      const tx = await comptroller._setMarketSupplyCaps(
        [cTokenAddress],
        [utils.parseUnits(supplyCap.toString(), selectedAsset.underlyingDecimals)]
      );
      await tx.wait();

      await queryClient.refetchQueries();

      successToast({
        description: 'Successfully updated max supply amount!',
        id: 'Updated max supply - ' + Math.random().toString(),
      });
    } catch (error) {
      const sentryProperties = {
        chainId: currentSdk.chainId,
        comptroller: comptrollerAddress,
        supplyCap,
        token: cTokenAddress,
      };
      const sentryInfo = {
        contextName: 'Updating max supply amount',
        properties: sentryProperties,
      };
      handleGenericError({ error, sentryInfo, toast: errorToast });
    } finally {
      setIsEditSupplyCap(false);
    }
  };

  const updateBorrowCap = async ({ borrowCap }: { borrowCap: number }) => {
    if (!cTokenAddress || !currentSdk) return;

    const comptroller = currentSdk.createComptroller(comptrollerAddress, currentSdk.signer);
    try {
      const tx = await comptroller._setMarketBorrowCaps(
        [cTokenAddress],
        [utils.parseUnits(borrowCap.toString(), selectedAsset.underlyingDecimals)]
      );
      await tx.wait();

      await queryClient.refetchQueries();

      successToast({
        description: 'Successfully updated max total borrow amount!',
        id: 'Updated max total borrow - ' + Math.random().toString(),
      });
    } catch (error) {
      const sentryProperties = {
        borrowCap,
        chainId: currentSdk.chainId,
        comptroller: comptrollerAddress,
        token: cTokenAddress,
      };
      const sentryInfo = {
        contextName: 'Updating max total borrow amount',
        properties: sentryProperties,
      };
      handleGenericError({ error, sentryInfo, toast: errorToast });
    } finally {
      setIsEditBorrowCap(false);
    }
  };

  const setSupplyCapsDefault = () => {
    if (cTokenData) {
      setValue(
        'supplyCap',
        parseInt(utils.formatUnits(cTokenData.supplyCap, selectedAsset.underlyingDecimals))
      );
    }

    setIsEditSupplyCap(false);
  };

  const setTotalBorrowCapsDefault = () => {
    if (cTokenData) {
      setValue(
        'borrowCap',
        parseInt(utils.formatUnits(cTokenData.borrowCap, selectedAsset.underlyingDecimals))
      );
    }

    setIsEditBorrowCap(false);
  };

  if (!cTokenData) return null;

  return (
    <Column
      crossAxisAlignment="flex-start"
      height="100%"
      mainAxisAlignment="flex-start"
      overflowY="auto"
      width="100%"
    >
      <>
        <Flex
          as="form"
          direction="column"
          onSubmit={handleSubmit(updateSupplyCaps)}
          px={{ base: 4, md: 8 }}
          py={4}
          w="100%"
        >
          <FormControl isInvalid={!!errors.supplyCap}>
            <Flex
              alignItems="center"
              direction={{ base: 'column', sm: 'row' }}
              w="100%"
              wrap="wrap"
            >
              <FormLabel htmlFor="supplyCap" margin={0}>
                <HStack>
                  <Text size="md" width="max-content">
                    Supply Cap
                  </Text>
                  <SimpleTooltip
                    label={'Total token amount which is allowed to be supplied to this market'}
                  >
                    <InfoOutlineIcon ml={1} />
                  </SimpleTooltip>
                </HStack>
              </FormLabel>
              <Spacer />
              <Column crossAxisAlignment="flex-start" mainAxisAlignment="flex-start">
                <Controller
                  control={control}
                  name="supplyCap"
                  render={({ field: { name, value, ref, onChange } }) => (
                    <InputGroup>
                      <NumberInput
                        allowMouseWheel
                        clampValueOnBlur={false}
                        isDisabled={isSubmitting || !isEditableAdmin}
                        isReadOnly={!isEditSupplyCap}
                        min={SUPPLY_CAP.MIN}
                        onChange={onChange}
                        value={value === 0 && !isEditSupplyCap ? 'Unlimited' : value}
                        width={100}
                      >
                        <NumberInputField
                          borderRightRadius={0}
                          name={name}
                          paddingLeft={2}
                          paddingRight={2}
                          ref={ref}
                          textAlign="center"
                        />
                      </NumberInput>
                      <InputRightAddon px={2}>
                        {selectedAsset.underlyingSymbol}{' '}
                        {usdPrice &&
                          value !== 0 &&
                          `(${smallUsdFormatter(
                            value *
                              Number(
                                utils.formatUnits(selectedAsset.underlyingPrice, DEFAULT_DECIMALS)
                              ) *
                              usdPrice
                          )})`}
                      </InputRightAddon>
                    </InputGroup>
                  )}
                  rules={{
                    min: {
                      message: `Supply caps must be at least ${SUPPLY_CAP.MIN} ${selectedAsset.underlyingSymbol}`,
                      value: SUPPLY_CAP.MIN,
                    },
                    required: 'Supply caps is required',
                  }}
                />
                <FormErrorMessage marginBottom="-10px" maxWidth="200px">
                  {errors.supplyCap && errors.supplyCap.message}
                </FormErrorMessage>
              </Column>
            </Flex>
          </FormControl>
          {isEditSupplyCap ? (
            <ButtonGroup alignSelf="end" gap={0} mt={2}>
              <Button
                isDisabled={
                  isSubmitting ||
                  !isEditableAdmin ||
                  !cTokenData ||
                  watchSupplyCap ===
                    parseFloat(utils.formatUnits(cTokenData.supplyCap, DEFAULT_DECIMALS))
                }
                type="submit"
              >
                Save
              </Button>
              <Button
                isDisabled={isSubmitting || !isEditableAdmin}
                onClick={setSupplyCapsDefault}
                variant="silver"
              >
                Cancel
              </Button>
            </ButtonGroup>
          ) : (
            <ButtonGroup alignSelf="end" gap={0} mt={2}>
              <CButton
                isDisabled={isSubmitting || !isEditableAdmin}
                onClick={() => setIsEditSupplyCap(true)}
              >
                Edit
              </CButton>
            </ButtonGroup>
          )}
        </Flex>
        <Divider />
        <Flex
          as="form"
          direction="column"
          onSubmit={handleSubmit(updateBorrowCap)}
          px={{ base: 4, md: 8 }}
          py={4}
          w="100%"
        >
          <FormControl isInvalid={!!errors.borrowCap}>
            <Flex
              alignItems="center"
              direction={{ base: 'column', sm: 'row' }}
              w="100%"
              wrap="wrap"
            >
              <FormLabel htmlFor="borrowCap" margin={0}>
                <HStack>
                  <Text size="md" width="max-content">
                    Borrow Cap
                  </Text>
                  <SimpleTooltip
                    label={'Total token amount which is allowed to be borrowed from this market'}
                  >
                    <InfoOutlineIcon ml={1} />
                  </SimpleTooltip>
                </HStack>
              </FormLabel>
              <Spacer />
              <Column crossAxisAlignment="flex-start" mainAxisAlignment="flex-start">
                <Controller
                  control={control}
                  name="borrowCap"
                  render={({ field: { name, value, ref, onChange } }) => (
                    <InputGroup>
                      <NumberInput
                        allowMouseWheel
                        clampValueOnBlur={false}
                        isDisabled={isSubmitting || !isEditableAdmin}
                        isReadOnly={!isEditBorrowCap}
                        min={BORROW_CAP.MIN}
                        onChange={onChange}
                        value={value === 0 && !isEditBorrowCap ? 'Unlimited' : value}
                        width={100}
                      >
                        <NumberInputField
                          borderRightRadius={0}
                          name={name}
                          paddingLeft={2}
                          paddingRight={2}
                          ref={ref}
                          textAlign="center"
                        />
                      </NumberInput>
                      <InputRightAddon px={2}>
                        {selectedAsset.underlyingSymbol}{' '}
                        {usdPrice &&
                          value !== 0 &&
                          `(${smallUsdFormatter(
                            value *
                              Number(
                                utils.formatUnits(selectedAsset.underlyingPrice, DEFAULT_DECIMALS)
                              ) *
                              usdPrice
                          )})`}
                      </InputRightAddon>
                    </InputGroup>
                  )}
                  rules={{
                    min: {
                      message: `Borrow cap must be at least ${BORROW_CAP.MIN} ${selectedAsset.underlyingSymbol}`,
                      value: BORROW_CAP.MIN,
                    },
                    required: 'Borrow cap is required',
                  }}
                />
                <FormErrorMessage marginBottom="-10px" maxWidth="200px">
                  {errors.borrowCap && errors.borrowCap.message}
                </FormErrorMessage>
              </Column>
            </Flex>
          </FormControl>
          {isEditBorrowCap ? (
            <ButtonGroup alignSelf="end" gap={0} mt={2}>
              <Button
                isDisabled={
                  isSubmitting ||
                  !isEditableAdmin ||
                  !cTokenData ||
                  watchBorrowCap ===
                    parseFloat(utils.formatUnits(cTokenData.borrowCap, DEFAULT_DECIMALS))
                }
                type="submit"
              >
                Save
              </Button>
              <Button
                isDisabled={isSubmitting || !isEditableAdmin}
                onClick={setTotalBorrowCapsDefault}
                variant="silver"
              >
                Cancel
              </Button>
            </ButtonGroup>
          ) : (
            <ButtonGroup alignSelf="end" gap={0} mt={2}>
              <CButton
                isDisabled={isSubmitting || !isEditableAdmin}
                onClick={() => setIsEditBorrowCap(true)}
              >
                Edit
              </CButton>
            </ButtonGroup>
          )}
        </Flex>
      </>
    </Column>
  );
};
