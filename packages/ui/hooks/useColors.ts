import { useColorModeValue } from '@chakra-ui/react';

import { COLOR_PALETTE } from '@ui/theme/index';

export function useColors() {
  const cPage = {
    primary: {
      bgColor: useColorModeValue(COLOR_PALETTE.whiteBg, COLOR_PALETTE.raisinBlack),
      borderColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
      dividerColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru30),
      hoverColor: useColorModeValue(COLOR_PALETTE.silverMetallic30, COLOR_PALETTE.ecru20),
      txtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.whiteBg),
    },
    secondary: {
      bgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
      borderColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
      dividerColor: useColorModeValue(COLOR_PALETTE.gunmetal80, COLOR_PALETTE.ecru80),
      txtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.raisinBlack),
    },
  };

  const cSolidBtn = {
    primary: {
      bgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
      hoverBgColor: useColorModeValue(COLOR_PALETTE.ecru80, COLOR_PALETTE.ecru80),
      hoverTxtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.raisinBlack),
      txtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.raisinBlack),
    },
    secondary: {
      bgColor: useColorModeValue(COLOR_PALETTE.silverMetallic, COLOR_PALETTE.silverMetallic),
      hoverBgColor: useColorModeValue(COLOR_PALETTE.bone, COLOR_PALETTE.bone),
      hoverTxtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.raisinBlack),
      txtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.raisinBlack),
    },
  };

  const cOutlineBtn = {
    primary: {
      bgColor: useColorModeValue(COLOR_PALETTE.whiteBg, COLOR_PALETTE.raisinBlack),
      borderColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
      hoverBgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
      hoverTxtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.raisinBlack),
      selectedBgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
      selectedTxtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.raisinBlack),
      txtColor: useColorModeValue(COLOR_PALETTE.gunmetal, COLOR_PALETTE.ecru),
    },
  };

  const cCard = {
    bgColor: useColorModeValue(COLOR_PALETTE.whiteBg, COLOR_PALETTE.raisinBlack),
    borderColor: cPage.primary.borderColor,
    dividerColor: cPage.primary.dividerColor,
    headingBgColor: useColorModeValue(COLOR_PALETTE.silverMetallic50, COLOR_PALETTE.ecru30),
    hoverBgColor: useColorModeValue(COLOR_PALETTE.silverMetallic20, COLOR_PALETTE.ecru10),
    txtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.white),
  };

  const cSwitch = {
    bgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
  };

  const cSelect = {
    bgColor: useColorModeValue(COLOR_PALETTE.whiteBg, COLOR_PALETTE.raisinBlack),
    borderColor: cPage.primary.borderColor,
    hoverBgColor: useColorModeValue(COLOR_PALETTE.silverMetallic30, COLOR_PALETTE.ecru30),
    txtColor: useColorModeValue(COLOR_PALETTE.gunmetal, COLOR_PALETTE.ecru),
  };

  const cChart = {
    borrowColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
    labelBgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
    tokenColor: useColorModeValue(COLOR_PALETTE.bone, COLOR_PALETTE.bone),
  };

  const cInput = {
    bgColor: useColorModeValue(COLOR_PALETTE.whiteBg, COLOR_PALETTE.raisinBlack),
    borderColor: cPage.primary.borderColor,
    placeHolderTxtColor: useColorModeValue(COLOR_PALETTE.silverMetallic, COLOR_PALETTE.white50),
    txtColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.white),
  };

  const cAlert = {
    bgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
    iconColor: useColorModeValue(COLOR_PALETTE.gunmetal, COLOR_PALETTE.gunmetal),
  };

  const cSlider = {
    filledTrackBgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
    thumbBgColor: useColorModeValue(COLOR_PALETTE.raisinBlack, COLOR_PALETTE.raisinBlack),
    thumbBorderColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
    trackBgColor: useColorModeValue(COLOR_PALETTE.bone, COLOR_PALETTE.bone),
  };

  const cRadio = {
    bgColor: useColorModeValue(COLOR_PALETTE.ecru, COLOR_PALETTE.ecru),
  };

  return {
    cAlert,
    cCard,
    cChart,
    cInput,
    cOutlineBtn,
    cPage,
    cRadio,
    cSelect,
    cSlider,
    cSolidBtn,
    cSwitch,
  };
}
