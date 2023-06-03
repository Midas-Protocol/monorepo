import { ChainParams } from "@midas-capital/types";

import { WBNB } from "./assets";

const specificParams: ChainParams = {
  blocksPerYear: 20n * 24n * 365n * 60n,
  cgId: "binancecoin",
  metadata: {
    chainIdHex: "0x38",
    name: "Binance Smart Chain",
    shortName: "BNB",
    img: "https://d1912tcoux65lj.cloudfront.net/network/bsc.jpg",
    blockExplorerUrls: { default: { name: "BnbScan", url: "https://bscscan.com" } },
    rpcUrls: {
      default: { http: ["https://bsc-dataseed.binance.org/"] },
      public: { http: ["https://bsc-dataseed.binance.org/"] },
    },
    nativeCurrency: {
      symbol: "BNB",
      name: "BNB",
    },
    wrappedNativeCurrency: {
      symbol: "WBNB",
      address: WBNB,
      name: "BNB",
      decimals: 18,
      color: "#627EEA",
      overlayTextColor: "#fff",
      logoURL: "https://d1912tcoux65lj.cloudfront.net/network/bsc.jpg",
    },
  },
};

export default specificParams;
