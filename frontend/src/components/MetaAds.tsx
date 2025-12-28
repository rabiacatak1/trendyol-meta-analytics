import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchMetaAdsData, debugMetaToken } from '../services/api';
import { MetaAdsData, MetaViewType } from '../types/meta';
import { getDefaultDates } from '../utils/dateUtils';
import {
  exportAccountsToCSV,
  exportCampaignsToCSV,
  exportAdSetsToCSV,
  exportAdsToCSV,
  exportInsightsToCSV
} from '../utils/metaCsvExport';

interface MetaAdsProps {
  onBack: () => void;
}

export default function MetaAds({ onBack }: MetaAdsProps) {
  const { username, logout } = useAuth();
  const defaults = getDefaultDates();

  const [metaToken, setMetaToken] = useState('');
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<MetaAdsData | null>(null);
  const [activeView, setActiveView] = useState<MetaViewType>('insights');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  const handleDebugToken = async () => {
    if (!metaToken.trim()) {
      setError('Please enter your Meta Access Token');
      return;
    }

    setError('');
    setDebugInfo('Testing token...');

    try {
      const result = await debugMetaToken(metaToken);
      setDebugInfo(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: unknown } };
      if (axiosError.response?.data) {
        setDebugInfo(JSON.stringify(axiosError.response.data, null, 2));
      } else {
        setDebugInfo('Error: ' + String(err));
      }
    }
  };

  const handleFetchData = async () => {
    if (!metaToken.trim()) {
      setError('Please enter your Meta Access Token');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await fetchMetaAdsData(metaToken, startDate, endDate);
      setData(result);
    } catch (err) {
      setError('Failed to fetch Meta Ads data. Please check your token.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;

    switch (activeView) {
      case 'accounts':
        exportAccountsToCSV(data.adAccounts);
        break;
      case 'campaigns':
        exportCampaignsToCSV(data.campaigns);
        break;
      case 'adsets':
        exportAdSetsToCSV(data.adSets);
        break;
      case 'ads':
        exportAdsToCSV(data.ads);
        break;
      case 'insights':
        exportInsightsToCSV(data.insights);
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETED':
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatNumber = (value: string) => {
    return new Intl.NumberFormat('en-US').format(parseInt(value) || 0);
  };

  const filterByStatus = <T extends { status?: string }>(items: T[]): T[] => {
    if (statusFilter === 'all') return items;
    return items.filter(item => item.status?.toUpperCase() === statusFilter.toUpperCase());
  };

  const filterBySearch = <T extends { name?: string }>(items: T[]): T[] => {
    if (!searchQuery.trim()) return items;
    return items.filter(item =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderTabs = () => (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
      {[
        { key: 'insights', label: 'Insights', count: data?.insights.length },
        { key: 'campaigns', label: 'Campaigns', count: data?.campaigns.length },
        { key: 'adsets', label: 'Ad Sets', count: data?.adSets.length },
        { key: 'ads', label: 'Ads', count: data?.ads.length },
        { key: 'accounts', label: 'Accounts', count: data?.adAccounts.length }
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveView(tab.key as MetaViewType)}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeView === tab.key
              ? 'bg-white text-blue-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {tab.label} {tab.count !== undefined && `(${tab.count})`}
        </button>
      ))}
    </div>
  );

  const renderFilters = () => (
    <div className="flex gap-4 mb-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {activeView !== 'accounts' && activeView !== 'insights' && (
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="DELETED">Deleted</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      )}
      <button
        onClick={handleExport}
        disabled={!data}
        className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        Export CSV
      </button>
    </div>
  );

  const renderInsightsTable = () => {
    const insights = data?.insights || [];
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Set</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impressions</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spend</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reach</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CPC</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {insights.map((insight, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{insight.campaign_name || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{insight.adset_name || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{insight.ad_name || '-'}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">{formatNumber(insight.impressions)}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">{formatNumber(insight.clicks)}</td>
              <td className="px-4 py-3 text-sm text-right text-blue-600">{insight.ctr || '0'}%</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{formatCurrency(insight.spend)}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">{formatNumber(insight.reach)}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">{insight.cpc ? formatCurrency(insight.cpc) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCampaignsTable = () => {
    const campaigns = filterBySearch(filterByStatus(data?.campaigns || []));
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Objective</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Budget</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lifetime Budget</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {campaigns.map(campaign => (
            <tr key={campaign.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                <div className="text-xs text-gray-500">{campaign.id}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{campaign.objective}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(campaign.created_time).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">
                {campaign.daily_budget ? formatCurrency(campaign.daily_budget) : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">
                {campaign.lifetime_budget ? formatCurrency(campaign.lifetime_budget) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderAdSetsTable = () => {
    const adSets = filterBySearch(filterByStatus(data?.adSets || []));
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign ID</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Daily Budget</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Lifetime Budget</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {adSets.map(adSet => (
            <tr key={adSet.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900">{adSet.name}</div>
                <div className="text-xs text-gray-500">{adSet.id}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adSet.status)}`}>
                  {adSet.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{adSet.campaign_id}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">
                {adSet.daily_budget ? formatCurrency(adSet.daily_budget) : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">
                {adSet.lifetime_budget ? formatCurrency(adSet.lifetime_budget) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderAdsTable = () => {
    const ads = filterBySearch(filterByStatus(data?.ads || []));
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AdSet ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {ads.map(ad => (
            <tr key={ad.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="text-sm font-medium text-gray-900">{ad.name}</div>
                <div className="text-xs text-gray-500">{ad.id}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ad.status)}`}>
                  {ad.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{ad.adset_id}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{ad.campaign_id}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(ad.created_time).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderAccountsTable = () => {
    const accounts = data?.adAccounts || [];
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount Spent</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {accounts.map(account => (
            <tr key={account.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-mono text-gray-900">{account.id}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{account.name}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  account.account_status === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {account.account_status === 1 ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{account.currency}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                {formatCurrency(account.amount_spent)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderTable = () => {
    switch (activeView) {
      case 'accounts':
        return renderAccountsTable();
      case 'campaigns':
        return renderCampaignsTable();
      case 'adsets':
        return renderAdSetsTable();
      case 'ads':
        return renderAdsTable();
      case 'insights':
        return renderInsightsTable();
    }
  };

  const totalSpend = data?.insights.reduce((sum, i) => sum + parseFloat(i.spend || '0'), 0) || 0;
  const totalImpressions = data?.insights.reduce((sum, i) => sum + parseInt(i.impressions || '0'), 0) || 0;
  const totalClicks = data?.insights.reduce((sum, i) => sum + parseInt(i.clicks || '0'), 0) || 0;
  const totalReach = data?.insights.reduce((sum, i) => sum + parseInt(i.reach || '0'), 0) || 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md text-sm"
            >
              Back
            </button>
            <h1 className="text-xl font-bold">Meta Ads Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Hello, {username}</span>
            <button
              onClick={logout}
              className="bg-white text-blue-600 px-3 py-1 rounded-md text-sm hover:bg-blue-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label htmlFor="metaToken" className="block text-sm font-medium text-gray-700 mb-1">
            Meta Access Token
          </label>
          <textarea
            id="metaToken"
            value={metaToken}
            onChange={(e) => setMetaToken(e.target.value)}
            placeholder="EAAQcfV5eZBakBQ..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
            rows={2}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleDebugToken}
              className="bg-gray-500 text-white py-1 px-3 rounded-md text-sm hover:bg-gray-600"
            >
              Test Token
            </button>
            {debugInfo && (
              <pre className="flex-1 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                {debugInfo}
              </pre>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleFetchData}
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch Ads Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500">Total Spend</div>
                <div className="text-2xl font-bold text-green-600">
                  ${(totalSpend / 100).toFixed(2)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500">Total Impressions</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(totalImpressions.toString())}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500">Total Clicks</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(totalClicks.toString())}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500">Total Reach</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(totalReach.toString())}
                </div>
              </div>
            </div>

            {renderTabs()}
            {renderFilters()}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                {renderTable()}
              </div>
            </div>
          </>
        )}

        {!data && !loading && (
          <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            Enter your Meta Access Token and click "Fetch Ads Data" to view your ads performance.
          </div>
        )}
      </main>
    </div>
  );
}
