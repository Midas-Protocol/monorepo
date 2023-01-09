import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  HStack,
  IconButton,
  Img,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FlywheelClaimableRewards } from '@midas-capital/sdk/dist/cjs/src/modules/Flywheel';
import { useChainModal } from '@rainbow-me/rainbowkit';
import { BigNumber, utils } from 'ethers';
import { useCallback, useMemo, useState } from 'react';
import { BsFillArrowRightCircleFill, BsFillGiftFill } from 'react-icons/bs';
import { useSwitchNetwork } from 'wagmi';

import { Center } from '@ui/components/shared/Flex';
import { SimpleTooltip } from '@ui/components/shared/SimpleTooltip';
import { TokenIcon } from '@ui/components/shared/TokenIcon';
import { useMultiMidas } from '@ui/context/MultiMidasContext';
import { useChainConfig } from '@ui/hooks/useChainConfig';
import { useColors } from '@ui/hooks/useColors';
import { useErrorToast, useSuccessToast } from '@ui/hooks/useToast';
import { useTokenData } from '@ui/hooks/useTokenData';
import { RewardsPerChainProps } from '@ui/types/ComponentPropsType';
import { dynamicFormatter } from '@ui/utils/bigUtils';
import { handleGenericError } from '@ui/utils/errorHandling';

const ClaimableToken = ({
  data,
  onClaim,
  claimingRewardTokens,
  rewardChainId,
}: {
  data: FlywheelClaimableRewards;
  onClaim: () => void;
  claimingRewardTokens: string[];
  rewardChainId: string;
}) => {
  const { currentChain } = useMultiMidas();
  const { rewards, rewardToken } = useMemo(() => data, [data]);
  const { data: tokenData } = useTokenData(rewardToken, Number(rewardChainId));
  const { openChainModal } = useChainModal();
  const { switchNetworkAsync } = useSwitchNetwork();
  const chainConfig = useChainConfig(Number(rewardChainId));
  const { cPage } = useColors();

  const totalRewardsString = useMemo(
    () =>
      utils.formatUnits(
        rewards.reduce((acc, curr) => (curr ? acc.add(curr.amount) : acc), BigNumber.from(0)),
        tokenData?.decimals
      ),
    [rewards, tokenData?.decimals]
  );

  const handleSwitch = async () => {
    if (chainConfig && switchNetworkAsync) {
      await switchNetworkAsync(chainConfig.chainId);
    } else if (openChainModal) {
      openChainModal();
    }
  };

  return (
    <HStack width="90%" justify="space-between">
      {currentChain && (
        <TokenIcon
          address={rewardToken}
          chainId={Number(rewardChainId)}
          size="xs"
          withMotion={false}
          withTooltip={false}
        />
      )}
      <SimpleTooltip label={totalRewardsString}>
        <Text minWidth="140px" textAlign="end" fontWeight="bold" fontSize={'16'}>
          {dynamicFormatter(Number(totalRewardsString), {
            minimumFractionDigits: 4,
            maximumFractionDigits: 8,
          })}
        </Text>
      </SimpleTooltip>
      <Text minW="80px">{tokenData?.extraData?.shortName ?? tokenData?.symbol}</Text>
      <Box width="150px">
        {currentChain?.id !== Number(rewardChainId) ? (
          <ButtonGroup isAttached width="100%">
            <IconButton
              variant="silver"
              aria-label="Switch network"
              icon={
                chainConfig ? (
                  <Img
                    width={6}
                    height={6}
                    borderRadius="50%"
                    src={chainConfig.specificParams.metadata.img}
                    alt=""
                  />
                ) : (
                  <BsFillArrowRightCircleFill size={24} />
                )
              }
              disabled={claimingRewardTokens.length > 0}
              onClick={handleSwitch}
              borderRightColor={cPage.primary.bgColor}
              borderRightWidth={1}
            />
            <Button
              variant="silver"
              width="100%"
              disabled={claimingRewardTokens.length > 0}
              onClick={handleSwitch}
              whiteSpace="normal"
            >
              {chainConfig ? chainConfig.specificParams.metadata.shortName : 'Switch Network'}
            </Button>
          </ButtonGroup>
        ) : (
          <ButtonGroup isAttached width="100%">
            <IconButton
              aria-label="Claim rewards"
              icon={
                chainConfig ? (
                  <Img
                    width={6}
                    height={6}
                    borderRadius="50%"
                    src={chainConfig.specificParams.metadata.img}
                    alt=""
                  />
                ) : (
                  <BsFillGiftFill size={24} />
                )
              }
              disabled={claimingRewardTokens.length > 0}
              borderRightColor={cPage.primary.bgColor}
              borderRightWidth={1}
            />
            <Button
              width="100%"
              disabled={claimingRewardTokens.length > 0}
              onClick={onClaim}
              isLoading={claimingRewardTokens.includes(rewardToken)}
            >
              Claim
            </Button>
          </ButtonGroup>
        )}
      </Box>
    </HStack>
  );
};

const ClaimRewardsModal = ({
  isOpen,
  onClose,
  claimableRewards,
  refetchRewards,
}: {
  isOpen: boolean;
  onClose: () => void;
  claimableRewards: RewardsPerChainProps;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  refetchRewards: any;
}) => {
  const { currentSdk, address, signer } = useMultiMidas();
  const successToast = useSuccessToast();
  const errorToast = useErrorToast();
  const [claimingRewardTokens, setClaimingRewardTokens] = useState<string[]>([]);
  const chainConfig = useChainConfig(Number(currentSdk?.chainId));
  const { cPage } = useColors();
  const claimableRewardsOfCurrentChain = useMemo(() => {
    return currentSdk ? claimableRewards[currentSdk.chainId.toString()]?.data : undefined;
  }, [claimableRewards, currentSdk]);

  const claimRewards = useCallback(
    (rewards: FlywheelClaimableRewards[] | null | undefined) => async () => {
      if (!currentSdk || !address || !signer || !rewards) return;

      try {
        setClaimingRewardTokens(rewards.map((reward) => reward.rewardToken));
        const fwLensRouter = currentSdk.contracts.MidasFlywheelLensRouter;

        for (const reward of rewards) {
          const markets = reward.rewards.map((reward) => reward.market);
          const tx = await fwLensRouter
            .connect(signer)
            .getUnclaimedRewardsByMarkets(address, markets, [reward.flywheel], [true]);

          await tx.wait();
          successToast({
            title: 'Reward claimed!',
          });
          await refetchRewards();
        }
      } catch (e) {
        handleGenericError(e, errorToast);
      } finally {
        setClaimingRewardTokens([]);
      }
    },
    [address, currentSdk, refetchRewards, signer, errorToast, successToast]
  );

  return (
    <Modal motionPreset="slideInBottom" isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Text variant="title">Claim Rewards</Text>
        </ModalHeader>
        <ModalCloseButton top={4} />
        <Divider />
        <VStack m={4}>
          {!claimableRewards || !currentSdk ? (
            <Center>
              <Text fontSize={20} fontWeight="bold">
                No rewards available to be claimed
              </Text>
            </Center>
          ) : (
            <>
              {Object.entries(claimableRewards).map(([key, value]) => {
                if (value.data && value.data.length > 0) {
                  return value.data.map((cr: FlywheelClaimableRewards, index: number) => (
                    <ClaimableToken
                      key={index}
                      rewardChainId={key}
                      data={cr}
                      claimingRewardTokens={claimingRewardTokens}
                      onClaim={claimRewards(key === currentSdk.chainId.toString() ? [cr] : null)}
                    />
                  ));
                }
              })}
              <Center pt={4}>
                {claimableRewardsOfCurrentChain && claimableRewardsOfCurrentChain.length > 0 && (
                  <ButtonGroup isAttached width="100%">
                    <IconButton
                      aria-label="Claim rewards"
                      icon={
                        chainConfig ? (
                          <Img
                            width={6}
                            height={6}
                            borderRadius="50%"
                            src={chainConfig.specificParams.metadata.img}
                            alt=""
                          />
                        ) : (
                          <BsFillGiftFill size={24} />
                        )
                      }
                      disabled={claimingRewardTokens.length > 0}
                      borderRightColor={cPage.primary.bgColor}
                      borderRightWidth={1}
                    />
                    <Button
                      width="100%"
                      disabled={claimingRewardTokens.length > 0}
                      onClick={claimRewards(claimableRewardsOfCurrentChain)}
                      isLoading={
                        claimingRewardTokens.length === claimableRewardsOfCurrentChain.length
                      }
                    >
                      Claim All
                    </Button>
                  </ButtonGroup>
                )}
              </Center>
            </>
          )}
        </VStack>
      </ModalContent>
    </Modal>
  );
};

export default ClaimRewardsModal;
