import {
  AvatarGroup,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Spacer,
  Spinner,
  Switch,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { Web3Provider } from '@ethersproject/providers';
import { ComptrollerErrorCodes, NativePricedFuseAsset } from '@midas-capital/types';
import { useQueryClient } from '@tanstack/react-query';
import { BigNumber, Contract, ContractTransaction, utils } from 'ethers';
import LogRocket from 'logrocket';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { WhitelistInfo } from '@ui/components/pages/Fuse/FusePoolCreatePage/WhitelistInfo';
import TransferOwnershipModal from '@ui/components/pages/Fuse/FusePoolEditPage/PoolConfiguration/TransferOwnershipModal';
import { ConfigRow } from '@ui/components/shared/ConfigRow';
import { CTokenIcon } from '@ui/components/shared/CTokenIcon';
import { Center, Column } from '@ui/components/shared/Flex';
import { ModalDivider } from '@ui/components/shared/Modal';
import { SliderWithLabel } from '@ui/components/shared/SliderWithLabel';
import { SwitchCSS } from '@ui/components/shared/SwitchCSS';
import { CLOSE_FACTOR, LIQUIDATION_INCENTIVE } from '@ui/constants/index';
import { useMidas } from '@ui/context/MidasContext';
import { useExtraPoolInfo } from '@ui/hooks/fuse/useExtraPoolInfo';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { handleGenericError } from '@ui/utils/errorHandling';

const PoolConfiguration = ({
  assets,
  comptrollerAddress,
  poolName,
}: {
  assets: NativePricedFuseAsset[];
  comptrollerAddress: string;
  poolName: string;
}) => {
  const router = useRouter();
  const poolId = router.query.poolId as string;

  const { midasSdk, address } = useMidas();
  const { cSwitch } = useColors();

  const queryClient = useQueryClient();
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  const { data } = useExtraPoolInfo(comptrollerAddress);

  const [inputPoolName, setInputPoolName] = useState<string>(poolName);
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      closeFactor: CLOSE_FACTOR.DEFAULT,
      liquidationIncentive: LIQUIDATION_INCENTIVE.DEFAULT,
      whitelist: [],
    },
  });

  const watchCloseFactor = Number(watch('closeFactor', CLOSE_FACTOR.DEFAULT));
  const watchLiquidationIncentive = Number(
    watch('liquidationIncentive', LIQUIDATION_INCENTIVE.DEFAULT)
  );

  const {
    isOpen: isTransferOwnershipModalOpen,
    onOpen: openTransferOwnershipModalOpen,
    onClose: closeTransferOwnershipModalOpen,
  } = useDisclosure();

  const changeWhitelistStatus = async (enforce: boolean) => {
    const comptroller = midasSdk.createComptroller(comptrollerAddress);

    try {
      const response = await comptroller.callStatic._setWhitelistEnforcement(enforce);
      if (!response.eq(0)) {
        const err = new Error(' Code: ' + ComptrollerErrorCodes[response.toNumber()]);
        LogRocket.captureException(err);
        throw err;
      }
      const tx = await comptroller._setWhitelistEnforcement(enforce);
      await tx.wait();
      LogRocket.track('Fuse-ChangeWhitelistStatus');

      await queryClient.refetchQueries();

      successToast({ description: 'Successfully changed whitelist status!' });
    } catch (e) {
      handleGenericError(e, errorToast);
    }
  };

  const addToWhitelist = async (newUser: string, onChange: (v: string[]) => void) => {
    const comptroller = midasSdk.createComptroller(comptrollerAddress);

    const newList = data ? [...data.whitelist, newUser] : [newUser];

    try {
      const response = await comptroller.callStatic._setWhitelistStatuses(
        newList,
        Array(newList.length).fill(true)
      );

      if (!response.eq(0)) {
        const err = new Error(' Code: ' + ComptrollerErrorCodes[response.toNumber()]);

        LogRocket.captureException(err);
        throw err;
      }

      const tx = await comptroller._setWhitelistStatuses(newList, Array(newList.length).fill(true));
      await tx.wait();
      LogRocket.track('Fuse-AddToWhitelist');

      await queryClient.refetchQueries();

      onChange(newList);

      successToast({ description: 'Successfully added!' });
    } catch (e) {
      handleGenericError(e, errorToast);
    }
  };

  const removeFromWhitelist = async (removeUser: string, onChange: (v: string[]) => void) => {
    const comptroller = midasSdk.createComptroller(comptrollerAddress);

    let whitelist = data?.whitelist;
    if (!whitelist) {
      console.warn('No whitelist not set');
      whitelist = [];
    }

    try {
      const response = await comptroller.callStatic._setWhitelistStatuses(
        whitelist,
        whitelist?.map((user) => user !== removeUser)
      );

      if (!response.eq(0)) {
        const err = new Error(' Code: ' + ComptrollerErrorCodes[response.toNumber()]);

        LogRocket.captureException(err);
        throw err;
      }

      const tx = await comptroller._setWhitelistStatuses(
        whitelist,
        whitelist?.map((user) => user !== removeUser)
      );
      await tx.wait();
      LogRocket.track('Fuse-RemoveFromWhitelist');

      await queryClient.refetchQueries();

      onChange(whitelist.filter((v) => v !== removeUser));

      successToast({ description: 'Successfully removed from the whitelist!' });
    } catch (e) {
      handleGenericError(e, errorToast);
    }
  };

  const renounceOwnership = async () => {
    const unitroller = new Contract(
      comptrollerAddress,
      midasSdk.artifacts.Unitroller.abi,
      midasSdk.provider as Web3Provider
    );

    try {
      const response = await unitroller.callStatic._toggleAdminRights(false);
      if (!response.eq(0)) {
        const err = new Error(' Code: ' + ComptrollerErrorCodes[response.toNumber()]);

        LogRocket.captureException(err);
        throw err;
      }
      const tx: ContractTransaction = await unitroller._toggleAdminRights(false);
      await tx.wait();
      LogRocket.track('Fuse-RenounceOwnership');

      await queryClient.refetchQueries();

      successToast({ description: 'Successfully changed admin rights!' });
    } catch (e) {
      handleGenericError(e, errorToast);
    }
  };

  // Update values on refetch!
  useEffect(() => {
    if (data) {
      setValue('closeFactor', parseInt(utils.formatUnits(data.closeFactor, 16)));
      setValue(
        'liquidationIncentive',
        parseInt(utils.formatUnits(data.liquidationIncentive, 16)) - 100
      );
    }
  }, [data, setValue]);

  const updateCloseFactor = async ({ closeFactor }: { closeFactor: number }) => {
    setIsUpdating(true);
    // 50% -> 0.5 * 1e18
    const bigCloseFactor: BigNumber = utils.parseUnits((closeFactor / 100).toString());

    const comptroller = midasSdk.createComptroller(comptrollerAddress);

    try {
      const response = await comptroller.callStatic._setCloseFactor(bigCloseFactor);

      if (!response.eq(0)) {
        const err = new Error(' Code: ' + ComptrollerErrorCodes[response.toNumber()]);

        LogRocket.captureException(err);
        throw err;
      }

      const tx = await comptroller._setCloseFactor(bigCloseFactor);
      await tx.wait();
      LogRocket.track('Fuse-UpdateCloseFactor');

      await queryClient.refetchQueries();

      successToast({ description: 'Successfully updated close factor!' });
    } catch (e) {
      handleGenericError(e, errorToast);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateLiquidationIncentive = async ({
    liquidationIncentive,
  }: {
    liquidationIncentive: number;
  }) => {
    // 8% -> 1.08 * 1e8
    const bigLiquidationIncentive: BigNumber = utils.parseUnits(
      (liquidationIncentive / 100 + 1).toString()
    );

    const comptroller = midasSdk.createComptroller(comptrollerAddress);

    try {
      const response = await comptroller.callStatic._setLiquidationIncentive(
        bigLiquidationIncentive
      );

      if (!response.eq(0)) {
        const err = new Error(' Code: ' + ComptrollerErrorCodes[response.toNumber()]);

        LogRocket.captureException(err);
        throw err;
      }

      const tx = await comptroller._setLiquidationIncentive(bigLiquidationIncentive);
      await tx.wait();
      LogRocket.track('Fuse-UpdateLiquidationIncentive');

      await queryClient.refetchQueries();

      successToast({ description: 'Successfully updated liquidation incentive!' });
    } catch (e) {
      handleGenericError(e, errorToast);
    }
  };

  const onSave = async () => {
    if (!inputPoolName) {
      handleGenericError('Input pool name', errorToast);
      return;
    }
    try {
      setIsSaving(true);
      const FusePoolDirectory = new Contract(
        midasSdk.chainDeployment.FusePoolDirectory.address,
        midasSdk.chainDeployment.FusePoolDirectory.abi,
        midasSdk.provider as Web3Provider
      );
      const tx = await FusePoolDirectory.setPoolName(poolId, inputPoolName, {
        from: address,
      });
      await tx.wait();
    } catch (e) {
      handleGenericError(e, errorToast);
    } finally {
      setIsSaving(false);
    }
  };

  const onCancel = () => {
    setInputPoolName(poolName);
    setIsEditable(false);
  };

  const setLiquidationIncentiveDefault = () => {
    if (data) {
      setValue(
        'liquidationIncentive',
        parseInt(utils.formatUnits(data.liquidationIncentive, 16)) - 100
      );
    }
  };

  const setCloseFactorDefault = () => {
    if (data) {
      setValue('closeFactor', parseInt(utils.formatUnits(data.closeFactor, 16)));
    }
  };

  return (
    <Column height="100%">
      <ConfigRow>
        <Heading size="sm">{`Pool ${poolId} Configuration`}</Heading>
      </ConfigRow>
      <ModalDivider />
      {data ? (
        <Column expand overflowY="auto">
          <Flex px={{ base: 4, md: 8 }} py={4} w="100%" direction={{ base: 'column', md: 'row' }}>
            <InputGroup width="100%">
              <InputLeftElement>
                <Text fontWeight="bold">Pool Name:</Text>
              </InputLeftElement>
              <Input
                value={inputPoolName}
                onChange={(e) => setInputPoolName(e.target.value)}
                readOnly={!isEditable}
                borderWidth={isEditable ? 1 : 0}
                ml="110px"
              />
            </InputGroup>
            {isEditable ? (
              <ButtonGroup mt={{ base: 2, md: 0 }} ml="auto">
                <Button
                  ml={4}
                  px={6}
                  onClick={onSave}
                  isLoading={isSaving}
                  isDisabled={poolName === inputPoolName}
                >
                  <Center fontWeight="bold">Save</Center>
                </Button>
                <Button variant="silver" ml={2} px={6} onClick={onCancel} isDisabled={isSaving}>
                  <Center fontWeight="bold">Cancel</Center>
                </Button>
              </ButtonGroup>
            ) : (
              <Button ml="auto" mt={{ base: 2, sm: 0 }} px={6} onClick={() => setIsEditable(true)}>
                <Center fontWeight="bold">Edit</Center>
              </Button>
            )}
          </Flex>
          <ModalDivider />
          <ConfigRow>
            <Text fontWeight="bold" mr={2}>
              Assets:
            </Text>
            {assets.length > 0 ? (
              <>
                <AvatarGroup size="sm" max={30}>
                  {assets.map(({ underlyingToken, cToken }) => {
                    return <CTokenIcon key={cToken} address={underlyingToken} />;
                  })}
                </AvatarGroup>
                <Text ml={2} flexShrink={0}>
                  {assets.map(({ underlyingSymbol }, index, array) => {
                    return underlyingSymbol + (index !== array.length - 1 ? ' / ' : '');
                  })}
                </Text>
              </>
            ) : (
              <Text>None</Text>
            )}
          </ConfigRow>
          <ModalDivider />
          <ConfigRow>
            <Text fontWeight="bold">Whitelist:</Text>
            <SwitchCSS symbol="whitelist" color={cSwitch.bgColor} />
            <Switch
              ml="auto"
              h="20px"
              isDisabled={!data.upgradeable}
              isChecked={data.enforceWhitelist}
              onChange={() => {
                changeWhitelistStatus(!data.enforceWhitelist);
              }}
              className="switch-whitelist"
            />
          </ConfigRow>
          {data.enforceWhitelist && (
            <ConfigRow>
              <Flex as="form" w="100%" direction={{ base: 'column', md: 'row' }}>
                <FormControl>
                  <Column mainAxisAlignment="flex-start" crossAxisAlignment="flex-start">
                    <Controller
                      control={control}
                      name="whitelist"
                      render={({ field: { value, onChange } }) => (
                        <WhitelistInfo
                          value={value}
                          onChange={onChange}
                          addToWhitelist={addToWhitelist}
                          removeFromWhitelist={removeFromWhitelist}
                        />
                      )}
                    />
                  </Column>
                </FormControl>
              </Flex>
            </ConfigRow>
          )}
          {/* {data.enforceWhitelist ? (
            <WhitelistInfo
              whitelist={data.whitelist}
              addToWhitelist={addToWhitelist}
              removeFromWhitelist={removeFromWhitelist}
            />
          ) : null} */}

          <ModalDivider />

          <ConfigRow>
            <Flex w="100%" direction={{ base: 'column', md: 'row' }}>
              <Text fontWeight="bold">Upgradeable:</Text>
              {data.upgradeable ? (
                <Flex mt={{ base: 2, md: 0 }} ml="auto" flexWrap="wrap" gap={2}>
                  <Button height="35px" ml="auto" onClick={openTransferOwnershipModalOpen}>
                    <Center fontWeight="bold">Transfer Ownership</Center>
                  </Button>
                  <TransferOwnershipModal
                    isOpen={isTransferOwnershipModalOpen}
                    onClose={closeTransferOwnershipModalOpen}
                    comptrollerAddress={comptrollerAddress}
                  />
                  <Button height="35px" onClick={renounceOwnership} ml="auto">
                    <Center fontWeight="bold">Renounce Ownership</Center>
                  </Button>
                </Flex>
              ) : (
                <Text ml="auto" fontWeight="bold">
                  Admin Rights Disabled
                </Text>
              )}
            </Flex>
          </ConfigRow>
          <ModalDivider />
          <ConfigRow>
            <Flex
              as="form"
              w="100%"
              direction={'column'}
              onSubmit={handleSubmit(updateCloseFactor)}
            >
              <FormControl isInvalid={!!errors.closeFactor}>
                <Flex
                  w="100%"
                  wrap="wrap"
                  direction={{ base: 'column', sm: 'row' }}
                  alignItems="center"
                >
                  <FormLabel htmlFor="closeFactor" margin={0}>
                    <Text fontWeight="bold">Close Factor:</Text>
                  </FormLabel>
                  <Spacer />
                  <Column mainAxisAlignment="flex-start" crossAxisAlignment="flex-start">
                    <Controller
                      control={control}
                      name="closeFactor"
                      rules={{
                        required: 'Close factor is required',
                        min: {
                          value: CLOSE_FACTOR.MIN,
                          message: `Close factor must be at least ${CLOSE_FACTOR.MIN}%`,
                        },
                        max: {
                          value: CLOSE_FACTOR.MAX,
                          message: `Close factor must be no more than ${CLOSE_FACTOR.MAX}%`,
                        },
                      }}
                      render={({ field: { name, value, ref, onChange } }) => (
                        <SliderWithLabel
                          min={CLOSE_FACTOR.MIN}
                          max={CLOSE_FACTOR.MAX}
                          name={name}
                          value={value}
                          reff={ref}
                          onChange={onChange}
                          mt={{ base: 2, sm: 0 }}
                        />
                      )}
                    />
                    <FormErrorMessage maxWidth="270px" marginBottom="-10px">
                      {errors.closeFactor && errors.closeFactor.message}
                    </FormErrorMessage>
                  </Column>
                </Flex>
              </FormControl>
              {data && watchCloseFactor !== parseInt(utils.formatUnits(data.closeFactor, 16)) && (
                <ButtonGroup gap={0} mt={2} alignSelf="end">
                  <Button type="submit" disabled={isUpdating}>
                    Save
                  </Button>
                  <Button variant="silver" disabled={isUpdating} onClick={setCloseFactorDefault}>
                    Cancel
                  </Button>
                </ButtonGroup>
              )}
            </Flex>
          </ConfigRow>
          <ModalDivider />
          <ConfigRow>
            <Flex
              as="form"
              w="100%"
              direction={'column'}
              onSubmit={handleSubmit(updateLiquidationIncentive)}
            >
              <FormControl isInvalid={!!errors.liquidationIncentive}>
                <Flex
                  w="100%"
                  wrap="wrap"
                  direction={{ base: 'column', sm: 'row' }}
                  alignItems="center"
                >
                  <FormLabel htmlFor="liquidationIncentive" margin={0}>
                    <Text fontWeight="bold">Liquidation Incentive:</Text>
                  </FormLabel>
                  <Spacer />
                  <Column mainAxisAlignment="flex-start" crossAxisAlignment="flex-start">
                    <Controller
                      control={control}
                      name="liquidationIncentive"
                      rules={{
                        required: 'Liquidation incentive is required',
                        min: {
                          value: LIQUIDATION_INCENTIVE.MIN,
                          message: `Liquidation incentive must be at least ${LIQUIDATION_INCENTIVE.MIN}%`,
                        },
                        max: {
                          value: LIQUIDATION_INCENTIVE.MAX,
                          message: `Liquidation incentive must be no more than ${LIQUIDATION_INCENTIVE.MAX}%`,
                        },
                      }}
                      render={({ field: { name, value, ref, onChange } }) => (
                        <SliderWithLabel
                          min={LIQUIDATION_INCENTIVE.MIN}
                          max={LIQUIDATION_INCENTIVE.MAX}
                          name={name}
                          value={value}
                          reff={ref}
                          onChange={onChange}
                          mt={{ base: 2, sm: 0 }}
                        />
                      )}
                    />
                    <FormErrorMessage maxWidth="270px" marginBottom="-10px">
                      {errors.liquidationIncentive && errors.liquidationIncentive.message}
                    </FormErrorMessage>
                  </Column>
                </Flex>
              </FormControl>
              {data &&
                watchLiquidationIncentive !==
                  parseInt(utils.formatUnits(data.liquidationIncentive, 16)) - 100 && (
                  <ButtonGroup gap={0} mt={2} alignSelf="end">
                    <Button type="submit" disabled={isUpdating}>
                      Save
                    </Button>
                    <Button
                      variant="silver"
                      disabled={isUpdating}
                      onClick={setLiquidationIncentiveDefault}
                    >
                      Cancel
                    </Button>
                  </ButtonGroup>
                )}
            </Flex>
          </ConfigRow>
        </Column>
      ) : (
        <Center width="100%" height="100%">
          <Spinner />
        </Center>
      )}
    </Column>
  );
};

export default PoolConfiguration;
