import { SupportedChains } from "@midas-capital/types";

export const defaultDocs = (blockExplorerUrl: string, tokenAddress: string): string => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p>Check out the token tracker for this asset in the <a href="${blockExplorerUrl}/token/${tokenAddress}" target="_blank">Official Block Explorer</a>, where you can access the token's site as well as market information</p>`;
};

export const wrappedAssetDocs = (chainId: SupportedChains) => {
  const wrapAddress = {
    [SupportedChains.bsc]: {
      swapName: "PancakeSwap",
      swapAddress: "https://pancakeswap.finance/swap?outputCurrency=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    },
    [SupportedChains.polygon]: {
      swapName: "SushiSwap",
      swapAddress:
        "https://app.sushi.com/swap?tokens=MATIC&tokens=0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270&chainId=137",
    },
    [SupportedChains.moonbeam]: {
      swapName: "StellaSwap",
      swapAddress: "https://app.stellaswap.com/exchange/swap",
    },
    [SupportedChains.arbitrum]: {
      swapName: "SushiSwap",
      swapAddress:
        "https://app.sushi.com/swap?inputCurrency=ETH&outputCurrency=0x82aF49447D8a07e3bd95BD0d56f35241523fBab1&chainId=42161",
    },
    [SupportedChains.ganache]: {},
    [SupportedChains.evmos]: {},
    [SupportedChains.neon_devnet]: {
      swapName: "MoraSwap",
      swapAddress: "https://moraswap.com/exchange/swap",
    },
    [SupportedChains.chapel]: {},
  }[chainId];

  return `<p><b>How to acquire the wrapped token: </b><p/><br />
  Head over to the <a href="${wrapAddress.swapAddress}" target="_blank">${wrapAddress.swapName} Exchange and swap your native token for the wrapped token</a></p>
  `;
};

export const ellipsisDocs = (poolAddress: string, poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head over to the <a href="https://ellipsis.finance/pool/${poolAddress}" target="_blank">${poolName} Ellipsis Finance Pool</a> and click on "Add Liquidity".</p><br />
  <p> 2. You can then supply any of the underlying assets, and upon adding liquidity.</p>
  <p> You will get back the <a href="https://bscscan.com/address/${tokenAddress}" target="_blank">${poolName} pool LP tokens</a>.</p><br />
  <p> 3. Come back here and hit "MAX" to deposit them all in this pool.</p> 
  `;
};

export const ankrBNBDocs = (variant: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p>Head over to <a href="https://www.ankr.com/staking/stake/bnb/?token=${variant}" target="_blank">Ankr BNB Staking</a>, where you can acquire ${variant} by depositing BNB</p>`;
};

export const stkBNBDocs = () => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p>Head over to <a href="https://bnb.pstake.finance/" target="_blank">pStake's BNB Staking</a>, where you can acquire stkBNB by depositing BNB</p>`;
};

export const BNBxDocs = () => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p>Head over to <a href="https://bnbchain.staderlabs.com/liquid-staking/bnbx/" target="_blank">Stader Lab's BNB Staking</a>, where you can acquire BNBx by depositing BNB</p>`;
};

export const pancakeSwapDocs = (token0: string, token1: string, poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head to <a href="https://pancakeswap.finance/add/${token0}/${token1}" target="_blank">Pancakeswap</a>.</p><br />
  <p> 2. Ensure that the tokens are correct, and tap "Add Liquidity".</p>
  <p><b>NOTE:</b> You might have to convert between tokens and/or have to approve Pancakeswap to spend them. Finally, click on supply.</p>
  <p>You will get back <a href="https://bscscan.com/address/${tokenAddress}" target="_blank">Pancakeswap ${poolName} LP tokens</a> in your wallet.</p><br />
  <p> 3. Come back here and hit "MAX" to deposit them all in this pool.</p>
  `;
};

export const apeSwapDocs = (token0: string, token1: string, poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head to <a href="https://apeswap.finance/add-liquidity/${token0}/${token1}" target="_blank">Apeswap</a>.</p><br />
  <p> 2. Ensure that the tokens are correct, and tap "Add Liquidity".</p>
  <p><b>NOTE:</b> You might have to convert between tokens and/or have to approve Pancakeswap to spend them. Finally, click on supply.</p>
  <p>You will get back <a href="https://bscscan.com/address/${tokenAddress}" target="_blank">Apeswap ${poolName} LP tokens</a> in your wallet.</p><br />
  <p> 3. Come back here and hit "MAX" to deposit them all in this pool.</p>
  `;
};

export const quickSwapDocs = (token0: string, token1: string, poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head to <a href="https://quickswap.exchange/#/pools" target="_blank">Quickswap</a>.</p><br />
  <p> 2. Input the token addresses -- token 1: ${token0} and  token 2: ${token1}".</p>
  <p><b>NOTE:</b> You might have to convert between tokens and/or have to approve QuickSwap to spend them.</p><br />
  <p> 3. Finally, click on supply.</p>
  <p>You will get back <a href="https://polygonscan.com/address/${tokenAddress}" target="_blank">Quickswap ${poolName} LP tokens</a> in your wallet.</p><br />
  <p> 4. Come back here and hit "MAX" to deposit them all in this pool.</p>
  `;
};

export const beamSwapDocs = (token0: string, token1: string, poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head to <a href="https://app.beamswap.io/exchange/add/${token0}/${token1}" target="_blank">BeamSwap</a> and supply the desired liquidity pairs.</p>
  <p><b>NOTE:</b> You might have to convert between tokens and/or have to approve BeamSwap to spend them.</p><br />
  <p> 2. You will get back <a href="https://moonbeam.moonscan.com/address/${tokenAddress}" target="_blank">BeamSwap ${poolName} LP tokens</a> in your wallet.</p><br />
  <p> 3. Come back here and hit "MAX" to deposit them all in this pool. </p>
  `;
};

export const beamSwapStableDocs = (poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head to <a href="https://app.beamswap.io/exchange/add/multi/${poolName}" target="_blank">BeamSwap</a> and supply the desired liquidity pairs.<p>
  <p><b>NOTE:</b> You might have to convert between tokens and/or have to approve BeamSwap to spend them.</p><br />
  <p> 2. You will get back <a href="https://moonbeam.moonscan.com/address/${tokenAddress}" target="_blank">BeamSwap ${poolName} Stable LP tokens</a> in your wallet.</p><br />
  <p> 3. Come back here and hit "MAX" to deposit them all in this pool. </p>
  `;
};

export const stellaSwapDocs = (token0: string, token1: string, poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head to <a href="https://app.stellaswap.com/exchange/add/${token0}/${token1}" target="_blank">StellaSwap</a> and supply the desired liquidity pairs.</p>
  <p><b>NOTE:</b> You might have to convert between tokens and/or have to approve StellaSwap to spend them.</p><br />
  <p> 2. You will get back <a href="https://moonbeam.moonscan.com/address/${tokenAddress}" target="_blank">StellaSwap ${poolName} LP tokens</a> in your wallet.</p><br />
  <p> 3. Come back here and hit "MAX" to deposit them all in this pool. </p>
  `;
};

export const curveFinancePolygonDocs = (
  poolNumber: number,
  poolName: string,
  tokenAddress: string,
  isFactory = false
) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head over to the <a href="https://polygon.curve.fi${
    isFactory ? "/factory/" : "/"
  }${poolNumber}/deposit" target="_blank"> Curve ${poolName} Pool</a>.</p><br />
  <p> 2. You can then supply any of the underlying assets, and upon adding liquidity.</p> 
  <p>You will get back the <a href="https://polygonscan.com/address/${tokenAddress}" target="_blank"> Curve ${poolName} LP tokens</a>.</p><br />
  <p> 3. Come back back here and hit "MAX" to deposit them all in this pool.</p>
  `;
};

export const balacerDocs = (chain: string, poolAddress: string, poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head over to the <a href="https://${chain}.balancer.fi/#/pool/${poolAddress}" target="_blank"> Balancer ${poolName} Pool</a>.</p><br />
  <p> 2. You can then supply any of the underlying assets, and upon adding liquidity.</p> 
  <p>You will get back the <a href="https://polygonscan.com/address/${tokenAddress}" target="_blank"> Balancer ${poolName} LP tokens</a>.</p><br />
  <p> 3. Come back back here and hit "MAX" to deposit them all in this pool.</p>
  `;
};

export const curveFinanceArbitrumDocs = (poolName: string, tokenAddress: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p> 1. Head over to the <a href="https://arbitrum.curve.fi/${poolName}/deposit" target="_blank"> Curve ${poolName} Pool</a>.</p><br />
  <p> 2. You can then supply any of the underlying assets, and upon adding liquidity.</p> 
  <p>You will get back the <a href="https://arbiscan.com/address/${tokenAddress}" target="_blank"> Curve ${poolName} LP tokens</a>.</p><br />
  <p> 3. Come back back here and hit "MAX" to deposit them all in this pool.</p>
  `;
};

export const jarvisDocs = (v: string) => {
  return `<p><b>How to acquire this token</b><p/><br />
  <p>You can acquire this asset on the <a href="https://${v}-app.jarvis.exchange/" target="_blank">Jarvis Network</a> website</p>`;
};

export const arrakisDocs = (networkName: string, chainId: number, vaultAddress: string) => {
  return `<p><b>How to acquire this Arrakis Vault token</b><p/><br /><p> 1. Make sure you are connected to ${networkName} Network on your browser wallet.</p><br />
  <p> 2. Head to the <a href="https://beta.arrakis.finance/vaults/${chainId}/${vaultAddress}/add" target="_blank">Arrakis Finance Vault</a> and deposit the desired amount of token pairs.</p>
  <p><b>NOTE:</b> You might have to convert between tokens and/or have to approve Arrakis to spend them. </p><br />
  <p> 3. Click on "Deposit & Stake".</p>
  <p>This will credit your wallet with the Arrakis Vault Tokens</p><br />
  <p> 4. Come back back here and hit "MAX" to deposit them all in this pool.</p>
  `;
};
