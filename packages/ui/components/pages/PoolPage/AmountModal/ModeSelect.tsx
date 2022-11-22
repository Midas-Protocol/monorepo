import { Box, BoxProps, Tab, TabList, Tabs } from '@chakra-ui/react';
import { FundOperationMode } from '@midas-capital/types';
import { ReactNode } from 'react';

import { useColors } from '@ui/hooks/useColors';
import { MarketData } from '@ui/types/TokensDataMap';
interface ModeSelectProps extends BoxProps {
  mode: FundOperationMode;
  setMode: (mode: FundOperationMode) => void;
  asset: MarketData;
}

export const ModeSelect = ({ mode, setMode, asset, ...boxProps }: ModeSelectProps) => {
  return (
    <Box width="100%" {...boxProps}>
      <Tabs
        isFitted
        width="100%"
        align="center"
        index={mode}
        onChange={(index: number) => {
          setMode(index);
        }}
      >
        <TabList height={10} gap={2}>
          <AmountTab className="supplyTab" isDisabled={asset.isSupplyPaused}>
            Supply
          </AmountTab>

          <AmountTab className="withdrawTab" isDisabled={asset.supplyBalanceFiat === 0}>
            Withdraw
          </AmountTab>

          <AmountTab
            className="borrowTab"
            isDisabled={asset.isBorrowPaused || asset.supplyBalanceFiat === 0}
          >
            Borrow
          </AmountTab>

          <AmountTab className="repayTab" isDisabled={asset.borrowBalanceFiat === 0}>
            Repay
          </AmountTab>
        </TabList>
      </Tabs>
    </Box>
  );
};

const AmountTab = ({ children, ...props }: { children: ReactNode; [x: string]: ReactNode }) => {
  const { cOutlineBtn } = useColors();
  return (
    <Tab
      fontWeight="bold"
      _selected={{
        bg: cOutlineBtn.primary.selectedBgColor,
        color: cOutlineBtn.primary.selectedTxtColor,
      }}
      borderRadius={12}
      borderWidth={2}
      borderColor={cOutlineBtn.primary.borderColor}
      background={cOutlineBtn.primary.bgColor}
      color={cOutlineBtn.primary.txtColor}
      mb="-1px"
      _hover={{
        bg: cOutlineBtn.primary.hoverBgColor,
        color: cOutlineBtn.primary.hoverTxtColor,
      }}
      {...props}
    >
      {children}
    </Tab>
  );
};
