import { Input, InputProps } from '@chakra-ui/react';

export const AmountInput = ({
  displayAmount,
  updateAmount,
  disabled = false,
  ...inputProps
}: {
  displayAmount: string;
  updateAmount: (symbol: string) => void;
  disabled?: boolean;
} & InputProps) => {
  return (
    <Input
      id="fundInput"
      type="number"
      inputMode="decimal"
      fontSize={22}
      fontWeight="bold"
      variant="unstyled"
      placeholder="0.0"
      value={displayAmount}
      onChange={(event) => updateAmount(event.target.value)}
      mr={4}
      disabled={disabled}
      {...inputProps}
    />
  );
};
