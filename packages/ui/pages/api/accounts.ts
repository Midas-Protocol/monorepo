import { createClient } from '@supabase/supabase-js';
import { utils } from 'ethers';
import { NextApiRequest, NextApiResponse } from 'next';
import * as yup from 'yup';

import { config } from '@ui/config/index';
import { VALID_ADDRESS_REGEX } from '@ui/constants/index';

const querySchema = yup.object().shape({
  address: yup.string().matches(VALID_ADDRESS_REGEX, 'Not a valid Wallet address').required(),
  email: yup.string().email().required(),
});

const handler = async (request: NextApiRequest, response: NextApiResponse) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Cache-Control', 'max-age=86400, s-maxage=86400');

  querySchema.validateSync(request.body);

  const { email, address: rawAddress }: { email: string; address: string } = request.body;

  const address = utils.getAddress(rawAddress);

  const client = createClient(config.supabaseUrl, config.supabasePublicKey);

  const row = {
    address,
    email,
  };

  const { error } = await client.from(config.supabaseAccountsTableName).upsert(row);

  if (error) {
    throw `Error occurred during saving account data to database: ${error.message}`;
  }

  return response.json({ success: true });
};

export default handler;
