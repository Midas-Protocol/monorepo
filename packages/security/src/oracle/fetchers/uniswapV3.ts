import { ChainConfig } from "@midas-capital/types";
import Decimal from "decimal.js";
import {
  encodeAbiParameters,
  encodePacked,
  formatEther,
  getAddress,
  getContract,
  getContractAddress,
  keccak256,
  parseAbi,
  parseAbiParameters,
  parseEther,
} from "viem";
import type { PublicClient } from "viem";

import { c1e18, QUOTER_ABI, UNISWAP_V3_POOL_ABI } from "../scorers/uniswapV3/constants";
import { Direction, PumpAndDump, Quote, Slot0, Trade, UniswapV3AssetConfig } from "../scorers/uniswapV3/types";
import { sqrtPriceX96ToPrice } from "../scorers/uniswapV3/utils";

export class UniswapV3Fetcher {
  public quoter: any;
  public chainConfig: ChainConfig;
  public W_TOKEN: string;
  public quoterContract: string;
  public uniV3Factory: string;
  public uniV3PairInitHash: string;

  public constructor(chainConfig: ChainConfig, publicClient: PublicClient) {
    this.chainConfig = chainConfig;
    this.W_TOKEN = chainConfig.chainAddresses.W_TOKEN;
    if (chainConfig.chainAddresses && chainConfig.chainAddresses.UNISWAP_V3) {
      this.quoterContract = chainConfig.chainAddresses.UNISWAP_V3.QUOTER_V2;
      this.uniV3Factory = chainConfig.chainAddresses.UNISWAP_V3.FACTORY;
      this.uniV3PairInitHash = chainConfig.chainAddresses.UNISWAP_V3.PAIR_INIT_HASH;
    } else {
      throw new Error("UniswapV3 Config not found");
    }
    this.quoter = getContract({ address: getAddress(this.quoterContract), abi: QUOTER_ABI, publicClient });
  }

  getSlot0 = async (tokenConfig: UniswapV3AssetConfig, publicClient: PublicClient): Promise<Slot0> => {
    const { token, fee, inverted } = tokenConfig;
    if (token.address === this.W_TOKEN) {
      throw Error("Token is WNATIVE");
    }
    const poolAddress = this.#computeUniV3PoolAddress(token.address, this.W_TOKEN, fee, publicClient);
    try {
      const res = (await publicClient.readContract({
        address: getAddress(poolAddress),
        abi: parseAbi(UNISWAP_V3_POOL_ABI),
        functionName: "slot0",
      })) as Slot0;

      return {
        ...res,
        price: sqrtPriceX96ToPrice(res.sqrtPriceX96, inverted),
      };
    } catch (e) {
      throw Error(`current price Error for ${token.symbol}: ${e}`);
    }
  };
  #computeUniV3PoolAddress = async (tokenA: string, tokenB: string, fee: number, publicClient: PublicClient) => {
    const [token0, token1] = BigInt(tokenA) < BigInt(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
    const bytecode = await publicClient.getBytecode({
      address: getAddress(tokenA),
    });
    return getContractAddress({
      bytecode,
      from: getAddress(this.uniV3Factory),
      opcode: "CREATE2",
      salt: keccak256(
        encodePacked(
          ["bytes"],
          [
            encodeAbiParameters(parseAbiParameters("address, address, uint24"), [
              getAddress(token0),
              getAddress(token1),
              fee,
            ]),
          ]
        )
      ),
    });
  };
  getPumpAndDump = async (
    currPrice: bigint,
    tokenConfig: UniswapV3AssetConfig,
    ethPrice: number,
    tradeValueInUSD: number
  ): Promise<PumpAndDump> => {
    const [pump, dump] = await Promise.all([
      this.getTrade(currPrice, tokenConfig, ethPrice, tradeValueInUSD, "pump"),
      this.getTrade(currPrice, tokenConfig, ethPrice, tradeValueInUSD, "dump"),
    ]);
    return { pump, dump };
  };

  getTrade = async (
    currPrice: bigint,
    tokenConfig: UniswapV3AssetConfig,
    ethPrice: number,
    tradeValueInUSD: number,
    direction: Direction
  ): Promise<Trade> => {
    const { token, fee, inverted } = tokenConfig;
    if (token.address === this.W_TOKEN)
      return {
        value: tradeValueInUSD,
        price: BigInt(0),
        priceImpact: "0",
        amountIn: BigInt(0),
        amountOut: BigInt(0),
        after: BigInt(0),
        tokenOut: token.address,
        index: 0,
      };

    try {
      const amountIn =
        direction === "pump"
          ? parseEther(`${Number(new Decimal(tradeValueInUSD / ethPrice).toFixed(18))}`)
          : (parseEther(`${Number(new Decimal(tradeValueInUSD / ethPrice).toFixed(18))}`) * c1e18) /
            (currPrice == BigInt(0) ? BigInt(1) : currPrice);

      const quote: Quote = await this.quoter.callStatic.quoteExactInputSingle({
        tokenIn: direction === "pump" ? this.W_TOKEN : token.address,
        tokenOut: direction === "pump" ? token.address : this.W_TOKEN,
        fee,
        amountIn,
        sqrtPriceLimitX96: 0,
      });

      const after = sqrtPriceX96ToPrice(quote.sqrtPriceX96After, inverted);

      const priceImpact = formatEther(
        (((after - currPrice) * c1e18) / (currPrice == BigInt(0) ? BigInt(1) : currPrice)) * 100n
      );
      return {
        amountIn: amountIn,
        value: tradeValueInUSD,
        priceImpact,
        sqrtPriceX96After: quote.sqrtPriceX96After.toString(),
        price: currPrice,
        after,
        amountOut: quote.amountOut,
        tokenOut: direction === "pump" ? token.address : this.W_TOKEN,
        gasEstimate: quote.gasEstimate,
        index: 0,
      };
    } catch (e) {
      console.log("e dump: ", token.symbol, e);
      throw e;
    }
  };
}
