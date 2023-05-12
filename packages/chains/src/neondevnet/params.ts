import { assetSymbols, ChainParams } from "@midas-capital/types";

const specificParams: ChainParams = {
  blocksPerYear: 5n * 24n * 365n * 60n,
  cgId: "neon",
  metadata: {
    chainIdHex: "0xE9AC0CE",
    name: "Neon Devnet",
    shortName: "Neon Devnet",
    img: "https://d1912tcoux65lj.cloudfront.net/network/neon.jpg",
    rpcUrls: {
      default: { http: ["https://proxy.devnet.neonlabs.org/solana"] },
      public: { http: ["https://proxy.devnet.neonlabs.org/solana"] },
    },
    blockExplorerUrls: {
      default: { name: "NeonScan", url: "https://neonscan.org" },
      public: { name: "NeonScan", url: "https://neonscan.org" },
    },
    nativeCurrency: {
      symbol: "NEON",
      name: "Neon Devnet",
    },
    wrappedNativeCurrency: {
      symbol: assetSymbols.WNEON,
      address: "",
      name: "Neon Devnet",
      decimals: 18,
      color: "#627EEA",
      overlayTextColor: "#fff",
      logoURL: "https://d1912tcoux65lj.cloudfront.net/network/neon.jpg",
    },
    testnet: true,
  },
};

export default specificParams;
