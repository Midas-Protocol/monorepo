import type { VaultApy } from '@midas-capital/types';
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import * as yup from 'yup';

import { config } from '@ui/config/index';
import { SUPPORTED_NETWORKS_REGEX } from '@ui/constants/index';
import type { VaultsResponse } from '@ui/hooks/useAllVaultsApyInfo';

const querySchema = yup.object().shape({
  chainId: yup.string().matches(SUPPORTED_NETWORKS_REGEX, 'Not a supported Network').required(),
});
type Query = yup.InferType<typeof querySchema>;

const handler = async (request: NextApiRequest, response: NextApiResponse<VaultsResponse>) => {
  let validatedQuery: Query | null = null;
  try {
    querySchema.validateSync(request.query);
    validatedQuery = request.query as Query;
  } catch (error) {
    return response.status(400);
  }
  const { chainId } = validatedQuery;
  const client = createClient(config.supabaseUrl, config.supabasePublicKey);

  const databaseResponse = await client
    .from(config.supabaseVaultApyTableName)
    .select<'vault_address,info', { info: VaultApy; vault_address: string }>('vault_address,info')
    .eq('chain_id', parseInt(chainId as string, 10));

  if (databaseResponse.error) {
    return response.status(500);
  }

  if (databaseResponse.data && databaseResponse.data.length > 0) {
    return response.json(
      databaseResponse.data.reduce((acc: VaultsResponse, cur) => {
        acc[cur.vault_address] = cur.info;

        return acc;
      }, {})
    );
  } else {
    return response.json({});
  }
};

export default handler;
