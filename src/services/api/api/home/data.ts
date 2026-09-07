import type {
  HomeOverviewStatsRawResponse,
  InventoryOverviewRawResponse,
  LastTransactionsRawResponse,
  TopProductsRawResponse,
  TrafficSourcesRawResponse,
} from "./types";
import type { SalesChartRawResponse } from "@/app/(with-layouts)/(dashboard)/(home)/_component/sales-chart/types";

export const homeOverviewStatsRawData: HomeOverviewStatsRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  metrics: [],
};

const emptySalesChartRawData: SalesChartRawResponse = {
  chart_id: "",
  organization_id: "",
  generated_at: "",
  timezone: "",
  granularity: "monthly",
  currency: "",
  data: [],
  summary: {
    total_sales: 0,
    total_revenue: 0,
    sales_delta_percent: 0,
    revenue_delta_percent: 0,
  },
};

export const salesChartMonthlyRawData: SalesChartRawResponse = emptySalesChartRawData;
export const salesChartYearlyRawData: SalesChartRawResponse = {
  ...emptySalesChartRawData,
  granularity: "yearly",
};

export const inventoryOverviewRawData: InventoryOverviewRawResponse = {
  inventory_dashboard_id: "",
  organization_id: "",
  warehouse: {
    id: "",
    name: "",
    code: "",
    region: "",
  },
  generated_at: "",
  timezone: "",
  stock_summary: {
    total_units: 0,
    available_units: 0,
    low_stock_units: 0,
    out_of_stock_units: 0,
    reserved_units: 0,
    backordered_units: 0,
    sku_count: 0,
    availability_rate: 0,
  },
  alert_level: "normal",
  alerts: [],
  generated_by: {
    id: "",
    name: "",
    role: "inventory_manager",
  },
  created_at: "",
  updated_at: "",
};

export const topProductsRawData: TopProductsRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  products: [],
};

export const trafficSourcesRawData: TrafficSourcesRawResponse = {
  dashboard_id: "",
  generated_at: "",
  timezone: "",
  sources: [],
};

export const lastTransactionsRawData: LastTransactionsRawResponse = {
  resource: "transaction_list",
  generated_at: "",
  data: [],
  meta: {
    total: 0,
    page: 1,
    page_size: 0,
    has_more: false,
  },
};
