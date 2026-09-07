import { delay } from "@/utils/delay";
import {
  exchangeStockRawData,
  getPortfolioPerformanceRawData,
  lastStockTransactionsRawData,
  marketNewsRawData,
  marketOverviewRawData,
  watchlistRawData,
} from "./data";
import type {
  ExchangeStockRawResponse,
  LastStockTransactionsRawResponse,
  MarketNewsRawResponse,
  MarketOverviewRawResponse,
  PerformanceRange,
  PortfolioPerformanceRawResponse,
  WatchlistRawResponse,
} from "./types";

export type * from "./types";

export async function getPortfolioPerformanceData(
  range: PerformanceRange = "1M",
): Promise<PortfolioPerformanceRawResponse> {
  await delay(1200);
  return getPortfolioPerformanceRawData(range);
}

export async function getWatchlistData(): Promise<WatchlistRawResponse> {
  await delay(900);
  return watchlistRawData;
}

export async function getExchangeStockData(): Promise<ExchangeStockRawResponse> {
  await delay(950);
  return exchangeStockRawData;
}

export async function getMarketOverviewData(): Promise<MarketOverviewRawResponse> {
  await delay(1000);
  return marketOverviewRawData;
}

export async function getLastStockTransactionsData(): Promise<LastStockTransactionsRawResponse> {
  await delay(950);
  return lastStockTransactionsRawData;
}

export async function getMarketNewsData(): Promise<MarketNewsRawResponse> {
  await delay(800);
  return marketNewsRawData;
}
