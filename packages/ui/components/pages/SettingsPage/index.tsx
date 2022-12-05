import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Spacer,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Controller, useForm } from 'react-hook-form';

import FusePageLayout from '@ui/components/pages/Layout/FusePageLayout';
import { Column } from '@ui/components/shared/Flex';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { handleGenericError } from '@ui/utils/errorHandling';

export const SettingsPage = () => {
  const { data: session } = useSession();
  const errorToast = useErrorToast();
  const successToast = useSuccessToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const setEmail = async ({ email }: { email: string }) => {
    try {
      if (session?.user?.name && email) {
        await axios.post('/api/accounts', {
          address: session.user.name,
          email,
        });

        successToast({
          title: 'Update',
          description: 'Successfully updated!',
        });
      }
    } catch (e) {
      handleGenericError(e, errorToast);
    }
  };

  return (
    <FusePageLayout>
      <Flex
        as="form"
        w="500px"
        px={{ base: 4, md: 8 }}
        py={4}
        direction="column"
        onSubmit={handleSubmit(setEmail)}
        gap={4}
      >
        {session?.user && <Text>You are signed in as {session.user.name}</Text>}
        <FormControl isInvalid={!!errors.email}>
          <Flex w="100%" wrap="wrap" direction={{ base: 'column', sm: 'row' }} alignItems="center">
            <FormLabel htmlFor="supplyCaps" margin={0}>
              <HStack>
                <Text variant="smText" width="max-content">
                  Email
                </Text>
              </HStack>
            </FormLabel>
            <Spacer width={10} />
            <Column mainAxisAlignment="flex-start" crossAxisAlignment="flex-start">
              <Controller
                control={control}
                name="email"
                rules={{
                  required: 'Email is required',
                }}
                render={({ field: { name, value, ref, onChange } }) => (
                  <Input type="email" name={name} value={value} ref={ref} onChange={onChange} />
                )}
              />
              <FormErrorMessage maxWidth="200px" marginBottom="-10px">
                {errors.email && errors.email.message}
              </FormErrorMessage>
            </Column>
          </Flex>
        </FormControl>
        <Button type="submit">Save</Button>
      </Flex>
    </FusePageLayout>
  );
};
