import { extendTheme } from '@chakra-ui/react';

import { LinkStyleConfig } from './components/Link';

import { AvatarStyleConfig } from '@ui/theme/components/Avatar';
import { ButtonStyleConfig } from '@ui/theme/components/Button';
import { IconButtonStyleConfig } from '@ui/theme/components/IconButton';
import { InputConfigStyle } from '@ui/theme/components/Input';
import { ModalStyleConfig } from '@ui/theme/components/Modal';
import { PopoverStyleConfig } from '@ui/theme/components/Popover';
import { SelectConfigStyle } from '@ui/theme/components/Select';
import { StatStyleConfig } from '@ui/theme/components/Stat';
import { TooltipStyleConfig } from '@ui/theme/components/Tooltip';

export const COLOR_PALETTE = {
  success: '#48BB78',
  fail: '#F56565',
  warn: '#ECC94B',
  grullo: '#B29E84',
  grullo30: '#B29E844d',
  ecru: '#BCAC83',
  ecru30: '#4E4A45',
  ecru80: '#BCAC83cc', // alpha 0.8
  bone: '#EBE6E0',
  white: '#FFFFFF',
  white50: '#FFFFFF80',
  whiteBg: '#F6F4F1',
  silverMetallic: '#A5ADB4',
  silverMetallic30: '#DEDEDE',
  silverMetallic80: '#8c9298',
  gunmetal: '#253439',
  gunmetal80: '#253439CC',
  raisinBlack: '#282828',
  raisinBlack80: '#282828CC',
};

export const theme = extendTheme({
  styles: {
    global: {
      body: {
        // bg: COLOR_PALETTE.bone,
        // color: COLOR_PALETTE.raisinBlack,
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: 'Poppins, sans-serif',
    body: 'Poppins, sans-serif',
    mono: 'monospace',
  },
  colors: {
    nav: {
      50: '#F0FFF4',
      100: '#41C143',
      200: '#9AE6B4',
      300: '#68D391',
      400: '#48BB78',
      500: '#38A169',
      600: '#2F855A',
      700: '#276749',
      800: '#22543D',
      900: '#1C4532',
    },
    ...COLOR_PALETTE,
  },
  components: {
    Avatar: AvatarStyleConfig,
    Button: ButtonStyleConfig,
    IconButton: IconButtonStyleConfig,
    Input: InputConfigStyle,
    Link: LinkStyleConfig,
    Modal: ModalStyleConfig,
    NumberInput: InputConfigStyle,
    Popover: PopoverStyleConfig,
    Select: SelectConfigStyle,
    Stat: StatStyleConfig,
    Tooltip: TooltipStyleConfig,
  },
});

export default theme;
