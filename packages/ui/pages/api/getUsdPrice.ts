import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import * as yup from 'yup';

import { config } from '@ui/config/index';
import { SUPPORTED_NETWORKS_REGEX } from '@ui/constants/index';

const querySchema = yup.object().shape({
  chainId: yup.string().matches(SUPPORTED_NETWORKS_REGEX, 'Not a supported Network').required(),
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    querySchema.validateSync(req.query);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return res.status(400).send({
        error: error.message,
      });
    } else {
      throw 'Unknown Error';
    }
  }

  const { chainId } = req.query;

  const client = createClient(config.supabaseUrl, config.supabasePublicKey);

  const { data, error } = await client
    .from(config.supabaseNativePricesTableName)
    .select('usd')
    .eq('chainId', parseInt(chainId as string, 10))
    .limit(1);

  if (!error) {
    if (data.length) {
      const usdPrice = parseFloat(data[0].usd);

      return res.json({ usdPrice });
    } else {
      // set usdPrice 1.0 when there is an empty result
      return res.json({ usdPrice: 1.0 });
    }
  } else {
    // set usdPrice 1.0 when couldn't get data
    return res.json({ usdPrice: 1.0 });
  }
};

export default handler;
