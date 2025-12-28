import { MetaAdAccount, MetaCampaign, MetaAdSet, MetaAd, MetaInsight } from '../types/meta';

function downloadCSV(content: string, filename: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAccountsToCSV(accounts: MetaAdAccount[]) {
  const headers = ['ID', 'Name', 'Status', 'Currency', 'Amount Spent'];
  const rows = accounts.map(a => [
    a.id,
    a.name,
    a.account_status,
    a.currency,
    a.amount_spent
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  downloadCSV(csvContent, `meta-accounts-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportCampaignsToCSV(campaigns: MetaCampaign[]) {
  const headers = ['ID', 'Name', 'Status', 'Objective', 'Created Time', 'Start Time', 'Stop Time', 'Daily Budget', 'Lifetime Budget'];
  const rows = campaigns.map(c => [
    c.id,
    c.name,
    c.status,
    c.objective,
    c.created_time,
    c.start_time || '',
    c.stop_time || '',
    c.daily_budget || '',
    c.lifetime_budget || ''
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  downloadCSV(csvContent, `meta-campaigns-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportAdSetsToCSV(adSets: MetaAdSet[]) {
  const headers = ['ID', 'Name', 'Status', 'Campaign ID', 'Daily Budget', 'Lifetime Budget'];
  const rows = adSets.map(a => [
    a.id,
    a.name,
    a.status,
    a.campaign_id,
    a.daily_budget || '',
    a.lifetime_budget || ''
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  downloadCSV(csvContent, `meta-adsets-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportAdsToCSV(ads: MetaAd[]) {
  const headers = ['ID', 'Name', 'Status', 'AdSet ID', 'Campaign ID', 'Created Time'];
  const rows = ads.map(a => [
    a.id,
    a.name,
    a.status,
    a.adset_id,
    a.campaign_id,
    a.created_time
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  downloadCSV(csvContent, `meta-ads-${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportInsightsToCSV(insights: MetaInsight[]) {
  const headers = [
    'Campaign ID', 'Campaign Name', 'AdSet ID', 'AdSet Name', 'Ad ID', 'Ad Name',
    'Impressions', 'Clicks', 'Spend', 'Reach', 'CPC', 'CPM', 'CTR',
    'Date Start', 'Date Stop'
  ];

  const rows = insights.map(i => [
    i.campaign_id || '',
    i.campaign_name || '',
    i.adset_id || '',
    i.adset_name || '',
    i.ad_id || '',
    i.ad_name || '',
    i.impressions,
    i.clicks,
    i.spend,
    i.reach,
    i.cpc || '',
    i.cpm || '',
    i.ctr || '',
    i.date_start,
    i.date_stop
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  downloadCSV(csvContent, `meta-insights-${new Date().toISOString().split('T')[0]}.csv`);
}
