export type PerformanceRange = "1W" | "1M" | "3M" | "1Y" | "All";

export interface PortfolioPerformancePoint {
  id: string;
  label: string;
  timestamp: string;
  portfolio_value: {
    value: number;
    currency_code: string;
  };
  benchmark_value: {
    value: number;
    currency_code: string;
  };
}

export interface PortfolioPerformanceRawResponse {
  chart_id: string;
  range: PerformanceRange;
  generated_at: string;
  timezone: string;
  currency: string;
  data: PortfolioPerformancePoint[];
  summary: {
    total_value: number;
    value_delta_percent: number;
    total_gain: number;
    gain_delta_percent: number;
  };
}

export interface WatchlistRawItem {
  id: string;
  symbol: string;
  company_name: string;
  price: {
    value: number;
    currency_code: string;
  };
  change_percent: number;
  trend: "up" | "down";
  created_at: string;
}

export interface WatchlistRawResponse {
  resource: "watchlist";
  generated_at: string;
  data: WatchlistRawItem[];
}

export type ExchangeStockCategory = "trading" | "gainers" | "losers";

export interface ExchangeStockRawItem {
  id: string;
  symbol: string;
  company_name: string;
  price: {
    value: number;
    currency_code: string;
  };
  change_percent: number;
  volume: number;
  trend: "up" | "down";
}

export interface ExchangeStockRawResponse {
  resource: "exchange_stock";
  generated_at: string;
  categories: Record<ExchangeStockCategory, ExchangeStockRawItem[]>;
}

export interface MarketOverviewRawItem {
  id: string;
  symbol: string;
  company_name: string;
  quantity: number;
  price: {
    value: number;
    currency_code: string;
  };
  volume: number;
  change_24h_percent: number;
  market_cap: {
    value: number;
    currency_code: string;
  };
}

export interface MarketOverviewRawResponse {
  resource: "market_overview";
  generated_at: string;
  data: MarketOverviewRawItem[];
}

export type StockTransactionType = "buy" | "sell";

export interface StockTransactionRawItem {
  id: string;
  type: StockTransactionType;
  symbol: string;
  company_name: string;
  quantity: number;
  price: {
    value: number;
    currency_code: string;
  };
  total: {
    value: number;
    currency_code: string;
  };
  executed_at: string;
}

export interface LastStockTransactionsRawResponse {
  resource: "stock_transaction_list";
  generated_at: string;
  data: StockTransactionRawItem[];
}

export interface MarketNewsRawItem {
  id: string;
  headline: string;
  source: string;
  published_at: string;
  url: string;
}

export interface MarketNewsRawResponse {
  resource: "market_news";
  generated_at: string;
  data: MarketNewsRawItem[];
}
