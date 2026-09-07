import type {
  ExchangeStockRawResponse,
  LastStockTransactionsRawResponse,
  MarketNewsRawResponse,
  MarketOverviewRawResponse,
  PerformanceRange,
  PortfolioPerformanceRawResponse,
  WatchlistRawResponse,
} from "./types";

const performanceRanges: PerformanceRange[] = ["1W", "1M", "3M", "1Y", "All"];

function emptyPortfolioPerformanceRawData(range: PerformanceRange): PortfolioPerformanceRawResponse {
  return {
    chart_id: "",
    range,
    generated_at: "",
    timezone: "",
    currency: "",
    data: [],
    summary: {
      total_value: 0,
      value_delta_percent: 0,
      total_gain: 0,
      gain_delta_percent: 0,
    },
  };
}

const portfolioPerformanceByRange: Record<PerformanceRange, PortfolioPerformanceRawResponse> =
  performanceRanges.reduce(
    (acc, range) => {
      acc[range] = emptyPortfolioPerformanceRawData(range);
      return acc;
    },
    {} as Record<PerformanceRange, PortfolioPerformanceRawResponse>,
  );

export function getPortfolioPerformanceRawData(
  range: PerformanceRange,
): PortfolioPerformanceRawResponse {
  return portfolioPerformanceByRange[range];
}

export const watchlistRawData: WatchlistRawResponse = {
  resource: "watchlist",
  generated_at: "",
  data: [],
};

export const exchangeStockRawData: ExchangeStockRawResponse = {
  resource: "exchange_stock",
  generated_at: "",
  categories: {
    trading: [],
    gainers: [],
    losers: [],
  },
};

export const marketOverviewRawData: MarketOverviewRawResponse = {
  resource: "market_overview",
  generated_at: "",
  data: [],
};

export const lastStockTransactionsRawData: LastStockTransactionsRawResponse = {
  resource: "stock_transaction_list",
  generated_at: "",
  data: [],
};

export const marketNewsRawData: MarketNewsRawResponse = {
  resource: "market_news",
  generated_at: "",
  data: [],
};
