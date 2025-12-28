import axios from 'axios';
import { MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, MetaInsight } from '../types/meta';

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

function cleanToken(token: string): string {
  // Remove any whitespace, newlines, or extra characters
  return token.trim().replace(/\s+/g, '');
}

async function fetchWithPagination<T>(
  url: string,
  accessToken: string,
  fields: string
): Promise<T[]> {
  const cleanedToken = cleanToken(accessToken);
  const allData: T[] = [];
  let hasMore = true;

  // Use params instead of URL string to avoid encoding issues
  let params: Record<string, string> = {
    fields,
    access_token: cleanedToken,
    limit: '100'
  };
  let nextUrl: string | null = null;

  while (hasMore) {
    try {
      let response;
      if (nextUrl) {
        // For pagination, Meta returns the full URL with token
        response = await axios.get(nextUrl);
      } else {
        response = await axios.get(url, { params });
      }

      const responseData = response.data as { data?: T[]; paging?: { next?: string } };
      const data = responseData.data || [];
      allData.push(...data);

      if (responseData.paging?.next) {
        nextUrl = responseData.paging.next;
      } else {
        hasMore = false;
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        const metaError = error.response.data.error;
        console.error('Meta API Error Details:', JSON.stringify(metaError, null, 2));
        throw new Error(`Meta API Error: ${metaError.message} (Code: ${metaError.code}, Type: ${metaError.type})`);
      }
      throw error;
    }
  }

  return allData;
}

export async function getAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
  const url = `${META_API_BASE}/me/adaccounts`;
  const fields = 'id,name,account_status,currency,amount_spent';
  return fetchWithPagination<MetaAdAccount>(url, accessToken, fields);
}

export async function getCampaigns(
  accessToken: string,
  adAccountId: string
): Promise<MetaCampaign[]> {
  const url = `${META_API_BASE}/${adAccountId}/campaigns`;
  const fields = 'id,name,status,objective,created_time,start_time,stop_time,daily_budget,lifetime_budget';
  return fetchWithPagination<MetaCampaign>(url, accessToken, fields);
}

export async function getAdSets(
  accessToken: string,
  adAccountId: string
): Promise<MetaAdSet[]> {
  const url = `${META_API_BASE}/${adAccountId}/adsets`;
  const fields = 'id,name,status,campaign_id,daily_budget,lifetime_budget';
  return fetchWithPagination<MetaAdSet>(url, accessToken, fields);
}

export async function getAds(
  accessToken: string,
  adAccountId: string
): Promise<MetaAd[]> {
  const url = `${META_API_BASE}/${adAccountId}/ads`;
  const fields = 'id,name,status,adset_id,campaign_id,created_time';
  return fetchWithPagination<MetaAd>(url, accessToken, fields);
}

export async function getInsights(
  accessToken: string,
  adAccountId: string,
  datePreset: string = 'last_30d',
  level: string = 'campaign'
): Promise<MetaInsight[]> {
  const cleanedToken = cleanToken(accessToken);
  const url = `${META_API_BASE}/${adAccountId}/insights`;
  const fields = 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,clicks,spend,reach,cpc,cpm,ctr,actions';

  try {
    const response = await axios.get(url, {
      params: {
        access_token: cleanedToken,
        fields,
        date_preset: datePreset,
        level,
        limit: 500
      }
    });

    return response.data.data || [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const metaError = error.response.data.error;
      throw new Error(`Meta API Error: ${metaError.message} (Code: ${metaError.code})`);
    }
    throw error;
  }
}

export async function getInsightsByDateRange(
  accessToken: string,
  adAccountId: string,
  startDate: string,
  endDate: string,
  level: string = 'campaign'
): Promise<MetaInsight[]> {
  const cleanedToken = cleanToken(accessToken);
  const url = `${META_API_BASE}/${adAccountId}/insights`;
  const fields = 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,clicks,spend,reach,cpc,cpm,ctr,actions';

  try {
    const response = await axios.get(url, {
      params: {
        access_token: cleanedToken,
        fields,
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        level,
        limit: 500
      }
    });

    return response.data.data || [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      const metaError = error.response.data.error;
      throw new Error(`Meta API Error: ${metaError.message} (Code: ${metaError.code})`);
    }
    throw error;
  }
}

export async function getAllMetaData(
  accessToken: string,
  startDate?: string,
  endDate?: string
) {
  // First get all ad accounts
  const adAccounts = await getAdAccounts(accessToken);

  if (adAccounts.length === 0) {
    return {
      adAccounts: [],
      campaigns: [],
      adSets: [],
      ads: [],
      insights: []
    };
  }

  // Fetch data for all ad accounts
  const allCampaigns: MetaCampaign[] = [];
  const allAdSets: MetaAdSet[] = [];
  const allAds: MetaAd[] = [];
  const allInsights: MetaInsight[] = [];

  for (const account of adAccounts) {
    try {
      const [campaigns, adSets, ads, insights] = await Promise.all([
        getCampaigns(accessToken, account.id),
        getAdSets(accessToken, account.id),
        getAds(accessToken, account.id),
        startDate && endDate
          ? getInsightsByDateRange(accessToken, account.id, startDate, endDate, 'ad')
          : getInsights(accessToken, account.id, 'last_30d', 'ad')
      ]);

      allCampaigns.push(...campaigns);
      allAdSets.push(...adSets);
      allAds.push(...ads);
      allInsights.push(...insights);
    } catch (error) {
      console.error(`Error fetching data for account ${account.id}:`, error);
    }
  }

  return {
    adAccounts,
    campaigns: allCampaigns,
    adSets: allAdSets,
    ads: allAds,
    insights: allInsights
  };
}
