import axios from "axios";

export const getCgPrice = async (coingeckoId: string) => {
  let usdPrice: number;

  usdPrice = (await axios.get(`https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=${coingeckoId}`))
    .data[coingeckoId].usd as number;

  // set 1.0 for undefined token prices in coingecko
  usdPrice = usdPrice ? usdPrice : 1.0;

  return usdPrice;
};
