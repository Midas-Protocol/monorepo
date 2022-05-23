import LogRocket from 'logrocket';

export const handleGenericError = (e: any, toast: (input: any) => any) => {
  let message: string;

  if (e instanceof Error) {
    message = e.toString();
    LogRocket.captureException(e);
  } else {
    message = e.message ?? JSON.stringify(e);
    LogRocket.captureException(new Error(message));
  }

  toast({
    title: 'Error!',
    description: message,
    status: 'error',
    duration: 9000,
    isClosable: true,
    position: 'top-right',
  });
};
