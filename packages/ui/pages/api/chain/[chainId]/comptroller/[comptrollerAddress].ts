import type { NextApiRequest, NextApiResponse } from 'next';
import * as yup from 'yup';

import { ALL_POOLS_INFO, SUPPORTED_NETWORKS_REGEX, VALID_ADDRESS_REGEX } from '@ui/constants/index';

export type GetComptrollerResponse = {
  markets: {
    [marketAddress: string]: {
      name?: string;
    };
  };
};

const querySchema = yup.object().shape({
  chainId: yup.string().matches(SUPPORTED_NETWORKS_REGEX, 'Not a supported Network').required(),
  comptrollerAddress: yup
    .string()
    .matches(VALID_ADDRESS_REGEX, 'Not a valid comptroller address')
    .required(),
});
type Query = yup.InferType<typeof querySchema>;

const handler = async (
  request: NextApiRequest,
  response: NextApiResponse<GetComptrollerResponse>
) => {
  let validatedQuery: Query | null = null;
  try {
    querySchema.validateSync(request.query);
    validatedQuery = request.query as Query;
  } catch (error) {
    return response.status(400);
  }
  const { chainId, comptrollerAddress } = validatedQuery;

  return response.json({
    ...ALL_POOLS_INFO[chainId][comptrollerAddress],
  });
};

export default handler;
