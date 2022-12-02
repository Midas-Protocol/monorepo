import { InfoOutlineIcon } from '@chakra-ui/icons';
import { HStack, SystemProps, Text, TextProps } from '@chakra-ui/react';

import { Column } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { useMaybeResponsiveProp } from '@ui/hooks/useMaybeResponsiveProp';
import { CaptionedStatProps } from '@ui/types/ComponentPropsType';

const CaptionedStat = ({
  stat,
  caption,
  spacing,
  crossAxisAlignment,
  tooltip,
}: CaptionedStatProps) => {
  const crossAxisAlignmentStatic = useMaybeResponsiveProp(crossAxisAlignment);
  const textAlign = crossAxisAlignmentStatic.replace('flex-', '') as SystemProps['textAlign'];

  return (
    <Column mainAxisAlignment="center" crossAxisAlignment={crossAxisAlignment} gap={2}>
      <HStack>
        <Caption mt={spacing ?? 0} textAlign={textAlign}>
          {caption}
        </Caption>
        {tooltip && (
          <SimpleTooltip label={tooltip}>
            <Text fontWeight="bold">
              <InfoOutlineIcon />
            </Text>
          </SimpleTooltip>
        )}
      </HStack>
      <Stat text={stat} />
    </Column>
  );
};

const Stat = ({ text }: { text: string }) => {
  return (
    <Text variant="smText" fontWeight="bold">
      {text}
    </Text>
  );
};

const Caption = ({ textAlign, children, ...restOfProps }: TextProps) => {
  return (
    <Text
      textTransform="capitalize"
      letterSpacing="wide"
      variant="smText"
      textAlign={textAlign}
      {...restOfProps}
    >
      {children}
    </Text>
  );
};

export default CaptionedStat;
