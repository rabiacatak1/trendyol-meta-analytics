import { BrandOfferReport } from '../types';
import { MetaCampaign, MetaInsight, MetaAd } from '../types/meta';
import { CampaignMapping, CombinedMetrics, CombinedCampaignData, ManualMapping } from '../types/combined';

// Normalize string for comparison
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9çğıöşü]/gi, '') // Remove special chars except Turkish
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

// Calculate string similarity (Levenshtein-based)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  // Check if shorter is contained in longer
  if (longer.includes(shorter)) {
    return shorter.length / longer.length * 100;
  }

  // Simple word matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  let matches = 0;

  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) {
        matches++;
        break;
      }
    }
  }

  return (matches / Math.max(words1.length, words2.length)) * 100;
}

// Match by naming convention
export function matchByNaming(
  campaign: MetaCampaign,
  trendyolReports: BrandOfferReport[]
): { ownerId: number; ownerName: string; confidence: number } | null {
  const normalizedCampaign = normalizeString(campaign.name);

  let bestMatch: { ownerId: number; ownerName: string; confidence: number } | null = null;

  // Get unique owners from reports
  const uniqueOwners = new Map<number, string>();
  trendyolReports.forEach(r => {
    uniqueOwners.set(r.owner.id, r.owner.name);
  });

  for (const [ownerId, ownerName] of uniqueOwners) {
    const normalizedOwner = normalizeString(ownerName);
    const conf = similarity(normalizedCampaign, normalizedOwner);

    if (conf > 30 && (!bestMatch || conf > bestMatch.confidence)) {
      bestMatch = { ownerId, ownerName, confidence: conf };
    }
  }

  return bestMatch;
}

// Match by link (if Meta ad URL contains Trendyol link)
// Note: This would require fetching ad creative URLs from Meta
// Meta API: /{ad-id}?fields=creative{object_story_spec{link_data{link}}}
export function matchByLink(
  _metaAds: MetaAd[],
  _trendyolReports: BrandOfferReport[]
): Map<string, { ownerId: number; ownerName: string; confidence: number }> {
  const matches = new Map<string, { ownerId: number; ownerName: string; confidence: number }>();
  // TODO: Implement link matching when ad creative URLs are available
  return matches;
}

// Calculate combined metrics
export function calculateCombinedMetrics(
  metaInsights: MetaInsight[],
  trendyolReports: BrandOfferReport[]
): CombinedMetrics {
  // Sum Meta metrics
  const metaSpend = metaInsights.reduce((sum, i) => sum + parseFloat(i.spend || '0'), 0) / 100; // Convert from cents
  const metaImpressions = metaInsights.reduce((sum, i) => sum + parseInt(i.impressions || '0'), 0);
  const metaClicks = metaInsights.reduce((sum, i) => sum + parseInt(i.clicks || '0'), 0);
  const metaReach = metaInsights.reduce((sum, i) => sum + parseInt(i.reach || '0'), 0);
  const metaCTR = metaImpressions > 0 ? (metaClicks / metaImpressions) * 100 : 0;
  const metaCPC = metaClicks > 0 ? metaSpend / metaClicks : 0;

  // Sum Trendyol metrics
  const trendyolNetIncome = trendyolReports.reduce((sum, r) => sum + r.income.netIncome, 0);
  const trendyolNetRevenue = trendyolReports.reduce((sum, r) => sum + r.revenue.netRevenue, 0);
  const trendyolOrders = trendyolReports.reduce((sum, r) => sum + r.orderItem.netOrderItemCount, 0);
  const avgCommissionRate = trendyolReports.length > 0
    ? trendyolReports.reduce((sum, r) => sum + r.advert.rateAmount, 0) / trendyolReports.length
    : 0;

  // Calculate combined metrics
  const roas = metaSpend > 0 ? trendyolNetRevenue / metaSpend : 0;
  const roi = metaSpend > 0 ? ((trendyolNetIncome - metaSpend) / metaSpend) * 100 : 0;
  const costPerOrder = trendyolOrders > 0 ? metaSpend / trendyolOrders : 0;
  const profitMargin = trendyolNetRevenue > 0 ? (trendyolNetIncome / trendyolNetRevenue) * 100 : 0;

  return {
    metaSpend,
    metaImpressions,
    metaClicks,
    metaReach,
    metaCTR,
    metaCPC,
    trendyolNetIncome,
    trendyolNetRevenue,
    trendyolOrders,
    trendyolCommissionRate: avgCommissionRate,
    roas,
    roi,
    costPerOrder,
    profitMargin
  };
}

// Main matching function
export function createCampaignMappings(
  metaCampaigns: MetaCampaign[],
  metaInsights: MetaInsight[],
  trendyolReports: BrandOfferReport[],
  manualMappings: ManualMapping[] = []
): CombinedCampaignData[] {
  const result: CombinedCampaignData[] = [];

  // Create a map of manual mappings
  const manualMap = new Map<string, number>();
  manualMappings.forEach(m => manualMap.set(m.metaCampaignId, m.trendyolOwnerId));

  // Group insights by campaign
  const insightsByCampaign = new Map<string, MetaInsight[]>();
  metaInsights.forEach(insight => {
    if (insight.campaign_id) {
      const existing = insightsByCampaign.get(insight.campaign_id) || [];
      existing.push(insight);
      insightsByCampaign.set(insight.campaign_id, existing);
    }
  });

  // Group Trendyol reports by owner
  const reportsByOwner = new Map<number, BrandOfferReport[]>();
  trendyolReports.forEach(report => {
    const existing = reportsByOwner.get(report.owner.id) || [];
    existing.push(report);
    reportsByOwner.set(report.owner.id, existing);
  });

  for (const campaign of metaCampaigns) {
    let mapping: CampaignMapping;
    let matchedReports: BrandOfferReport[] = [];

    // Check manual mapping first
    if (manualMap.has(campaign.id)) {
      const ownerId = manualMap.get(campaign.id)!;
      const ownerReports = reportsByOwner.get(ownerId) || [];
      const ownerName = ownerReports[0]?.owner.name || 'Unknown';

      mapping = {
        metaCampaignId: campaign.id,
        metaCampaignName: campaign.name,
        trendyolOwnerId: ownerId,
        trendyolOwnerName: ownerName,
        matchType: 'manual',
        matchConfidence: 100
      };
      matchedReports = ownerReports;
    } else {
      // Try naming match
      const namingMatch = matchByNaming(campaign, trendyolReports);

      if (namingMatch && namingMatch.confidence >= 50) {
        mapping = {
          metaCampaignId: campaign.id,
          metaCampaignName: campaign.name,
          trendyolOwnerId: namingMatch.ownerId,
          trendyolOwnerName: namingMatch.ownerName,
          matchType: 'naming',
          matchConfidence: namingMatch.confidence
        };
        matchedReports = reportsByOwner.get(namingMatch.ownerId) || [];
      } else {
        mapping = {
          metaCampaignId: campaign.id,
          metaCampaignName: campaign.name,
          matchType: 'none',
          matchConfidence: 0
        };
      }
    }

    const campaignInsights = insightsByCampaign.get(campaign.id) || [];
    const metrics = calculateCombinedMetrics(campaignInsights, matchedReports);

    result.push({
      mapping,
      metaCampaign: campaign,
      metaInsights: campaignInsights,
      trendyolReports: matchedReports,
      metrics
    });
  }

  return result;
}

// Get unique Trendyol owners for dropdown
export function getUniqueTrendyolOwners(reports: BrandOfferReport[]): Array<{ id: number; name: string }> {
  const uniqueMap = new Map<number, string>();
  reports.forEach(r => uniqueMap.set(r.owner.id, r.owner.name));

  return Array.from(uniqueMap.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
