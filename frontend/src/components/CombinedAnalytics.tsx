import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchReports, fetchMetaAdsData } from '../services/api';
import { BrandOfferReport } from '../types';
import { MetaAdsData } from '../types/meta';
import { CombinedCampaignData, ManualMapping } from '../types/combined';
import { dateToUnixTimestamp, getDefaultDates } from '../utils/dateUtils';
import {
  createCampaignMappings,
  getUniqueTrendyolOwners,
  calculateCombinedMetrics
} from '../utils/matchingAlgorithm';

interface CombinedAnalyticsProps {
  onBack: () => void;
}

export default function CombinedAnalytics({ onBack }: CombinedAnalyticsProps) {
  const { username, logout } = useAuth();
  const defaults = getDefaultDates();

  // Tokens
  const [trendyolToken, setTrendyolToken] = useState('');
  const [metaToken, setMetaToken] = useState('');

  // Date filters
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [trendyolData, setTrendyolData] = useState<BrandOfferReport[]>([]);
  const [metaData, setMetaData] = useState<MetaAdsData | null>(null);
  const [combinedData, setCombinedData] = useState<CombinedCampaignData[]>([]);
  const [manualMappings, setManualMappings] = useState<ManualMapping[]>([]);

  // UI state
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(false);

  const handleFetchData = async () => {
    if (!trendyolToken.trim() || !metaToken.trim()) {
      setError('Please enter both Trendyol and Meta tokens');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const startTimestamp = dateToUnixTimestamp(startDate + 'T00:00:00');
      const endTimestamp = dateToUnixTimestamp(endDate + 'T23:59:59');

      // Fetch both data sources in parallel
      const [trendyolResult, metaResult] = await Promise.all([
        fetchReports(startTimestamp, endTimestamp, trendyolToken),
        fetchMetaAdsData(metaToken, startDate, endDate)
      ]);

      setTrendyolData(trendyolResult.brandOfferReports);
      setMetaData(metaResult);

      // Create mappings
      const mappings = createCampaignMappings(
        metaResult.campaigns,
        metaResult.insights,
        trendyolResult.brandOfferReports,
        manualMappings
      );
      setCombinedData(mappings);
    } catch (err) {
      setError('Failed to fetch data. Please check your tokens.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate when manual mappings change
  useEffect(() => {
    if (metaData && trendyolData.length > 0) {
      const mappings = createCampaignMappings(
        metaData.campaigns,
        metaData.insights,
        trendyolData,
        manualMappings
      );
      setCombinedData(mappings);
    }
  }, [manualMappings, metaData, trendyolData]);

  const handleManualMapping = (metaCampaignId: string, trendyolOwnerId: number | null) => {
    setManualMappings(prev => {
      const filtered = prev.filter(m => m.metaCampaignId !== metaCampaignId);
      if (trendyolOwnerId !== null) {
        return [...filtered, { metaCampaignId, trendyolOwnerId }];
      }
      return filtered;
    });
  };

  const formatCurrency = (value: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('tr-TR').format(Math.round(value));
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getMatchBadgeColor = (matchType: string, confidence: number) => {
    if (matchType === 'manual') return 'bg-blue-100 text-blue-800';
    if (matchType === 'naming' && confidence >= 70) return 'bg-green-100 text-green-800';
    if (matchType === 'naming') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const uniqueOwners = getUniqueTrendyolOwners(trendyolData);

  // Calculate totals
  const totalMetrics = combinedData.length > 0
    ? calculateCombinedMetrics(
        combinedData.flatMap(c => c.metaInsights || []),
        combinedData.flatMap(c => c.trendyolReports || [])
      )
    : null;

  const filteredData = showUnmatchedOnly
    ? combinedData.filter(c => c.mapping.matchType === 'none')
    : combinedData;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-purple-600 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-purple-700 hover:bg-purple-800 px-3 py-1 rounded-md text-sm"
            >
              Back
            </button>
            <h1 className="text-xl font-bold">Combined Analytics</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Hello, {username}</span>
            <button
              onClick={logout}
              className="bg-white text-purple-600 px-3 py-1 rounded-md text-sm hover:bg-purple-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Token inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <label className="block text-sm font-medium text-orange-600 mb-1">
              Trendyol Bearer Token
            </label>
            <textarea
              value={trendyolToken}
              onChange={(e) => setTrendyolToken(e.target.value)}
              placeholder="eyJhbGciOiJFUzI1NiIs..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs"
              rows={2}
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <label className="block text-sm font-medium text-blue-600 mb-1">
              Meta Access Token
            </label>
            <textarea
              value={metaToken}
              onChange={(e) => setMetaToken(e.target.value)}
              placeholder="EAAQcfV5eZBakBQ..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              rows={2}
            />
          </div>
        </div>

        {/* Date filter and fetch button */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleFetchData}
              disabled={loading}
              className="bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch & Analyze'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Summary cards */}
        {totalMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500">Meta Ad Spend</div>
              <div className="text-lg font-bold text-red-600">{formatCurrency(totalMetrics.metaSpend)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500">Trendyol Revenue</div>
              <div className="text-lg font-bold text-green-600">{formatCurrency(totalMetrics.trendyolNetRevenue)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500">Trendyol Income</div>
              <div className="text-lg font-bold text-blue-600">{formatCurrency(totalMetrics.trendyolNetIncome)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500">ROAS</div>
              <div className={`text-lg font-bold ${totalMetrics.roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {totalMetrics.roas.toFixed(2)}x
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500">ROI</div>
              <div className={`text-lg font-bold ${totalMetrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(totalMetrics.roi)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-xs text-gray-500">Cost per Order</div>
              <div className="text-lg font-bold text-purple-600">{formatCurrency(totalMetrics.costPerOrder)}</div>
            </div>
          </div>
        )}

        {/* Data summary */}
        {combinedData.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">
                  <strong>{combinedData.length}</strong> Meta Campaigns
                </span>
                <span className="text-gray-600">
                  <strong>{trendyolData.length}</strong> Trendyol Reports
                </span>
                <span className="text-green-600">
                  <strong>{combinedData.filter(c => c.mapping.matchType !== 'none').length}</strong> Matched
                </span>
                <span className="text-red-600">
                  <strong>{combinedData.filter(c => c.mapping.matchType === 'none').length}</strong> Unmatched
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showUnmatchedOnly}
                  onChange={(e) => setShowUnmatchedOnly(e.target.checked)}
                  className="rounded"
                />
                Show unmatched only
              </label>
            </div>
          </div>
        )}

        {/* Combined data table */}
        {combinedData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meta Campaign</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trendyol Match</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ad Spend</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impressions</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Clicks</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROAS</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.mapping.metaCampaignId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.mapping.metaCampaignName}</div>
                        <div className="text-xs text-gray-500">{item.metaCampaign?.status}</div>
                      </td>
                      <td className="px-4 py-3">
                        {item.mapping.matchType !== 'none' ? (
                          <div className="text-sm text-gray-900">{item.mapping.trendyolOwnerName}</div>
                        ) : (
                          <select
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            value=""
                            onChange={(e) => {
                              const ownerId = parseInt(e.target.value);
                              if (!isNaN(ownerId)) {
                                handleManualMapping(item.mapping.metaCampaignId, ownerId);
                              }
                            }}
                          >
                            <option value="">Select owner...</option>
                            {uniqueOwners.map(owner => (
                              <option key={owner.id} value={owner.id}>{owner.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getMatchBadgeColor(item.mapping.matchType, item.mapping.matchConfidence)}`}>
                          {item.mapping.matchType === 'none' ? 'Unmatched' : `${item.mapping.matchType} (${Math.round(item.mapping.matchConfidence)}%)`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {formatCurrency(item.metrics.metaSpend)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatNumber(item.metrics.metaImpressions)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {formatNumber(item.metrics.metaClicks)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {formatCurrency(item.metrics.trendyolNetRevenue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">
                        {formatCurrency(item.metrics.trendyolNetIncome)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={item.metrics.roas >= 1 ? 'text-green-600 font-medium' : 'text-red-600'}>
                          {item.metrics.roas.toFixed(2)}x
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={item.metrics.roi >= 0 ? 'text-green-600 font-medium' : 'text-red-600'}>
                          {formatPercent(item.metrics.roi)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {combinedData.length === 0 && !loading && (
          <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
            <p className="mb-2">Enter both tokens and click "Fetch & Analyze" to see combined metrics.</p>
            <p className="text-sm">The system will automatically match Meta campaigns with Trendyol owners by name similarity.</p>
          </div>
        )}

        {/* Naming convention guide */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">Naming Convention Guide</h3>
          <p className="text-sm text-blue-700 mb-2">
            For best automatic matching, name your Meta campaigns with Trendyol brand names:
          </p>
          <ul className="text-sm text-blue-600 list-disc list-inside">
            <li><code>MAC_Traffic_Dec2024</code> → matches "Mac"</li>
            <li><code>Karaca_Home_Promo</code> → matches "Karaca Home"</li>
            <li><code>LANCOME_Sales_Campaign</code> → matches "LANCOME"</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
