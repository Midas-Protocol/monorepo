/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreateToastFnReturn } from '@chakra-ui/react';
import LogRocket from 'logrocket';

export const handleGenericError = (e: any, errorToast?: CreateToastFnReturn) => {
  console.error(e);
  console.error(JSON.stringify(e));
  let message: string;

  if (e instanceof Error) {
    message = e.toString();
    LogRocket.captureException(e);
  } else {
    message = (e as { message: string }).message || JSON.stringify(e);
    LogRocket.captureException(new Error(message));
  }

  if (errorToast) {
    if (e.code === 'ACTION_REJECTED') {
      errorToast({
        title: 'Action Rejected!',
        status: 'warning',
        description: 'Your transaction has been rejected!',
      });
    } else if (e.method === 'estimateGas') {
      errorToast({
        description: 'Gas cannot be estimated!',
      });
    } else {
      errorToast({ description: message });
    }
  }
};
