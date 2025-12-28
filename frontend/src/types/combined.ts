import { BrandOfferReport } from './index';
import { MetaCampaign, MetaInsight } from './meta';

export interface CampaignMapping {
  metaCampaignId: string;
  metaCampaignName: string;
  trendyolOwnerId?: number;
  trendyolOwnerName?: string;
  matchType: 'naming' | 'link' | 'manual' | 'none';
  matchConfidence: number; // 0-100
}

export interface CombinedMetrics {
  // Meta Ads metrics
  metaSpend: number;
  metaImpressions: number;
  metaClicks: number;
  metaReach: number;
  metaCTR: number;
  metaCPC: number;

  // Trendyol metrics
  trendyolNetIncome: number;
  trendyolNetRevenue: number;
  trendyolOrders: number;
  trendyolCommissionRate: number;

  // Combined/Calculated metrics
  roas: number; // Return on Ad Spend = Revenue / Spend
  roi: number; // Return on Investment = (Income - Spend) / Spend * 100
  costPerOrder: number;
  profitMargin: number;
}

export interface CombinedCampaignData {
  mapping: CampaignMapping;
  metaCampaign?: MetaCampaign;
  metaInsights?: MetaInsight[];
  trendyolReports?: BrandOfferReport[];
  metrics: CombinedMetrics;
}

export interface ManualMapping {
  metaCampaignId: string;
  trendyolOwnerId: number;
}
