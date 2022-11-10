import { SupportedChains } from '@midas-capital/types';
import { Handler } from '@netlify/functions';
import { rpcUrls } from '../assets';
import { updatePluginRewards } from '../controllers';

const handler: Handler = async (event, context) => {
  const rpcURL = rpcUrls[SupportedChains.bsc];
  if (!rpcURL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'RPC not set' }),
    };
  }
  await updatePluginRewards(SupportedChains.bsc, rpcURL);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'done' }),
  };
};

export { handler };
