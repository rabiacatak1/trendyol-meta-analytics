import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchReports } from '../services/api';
import { BrandOfferReport } from '../types';
import { dateToUnixTimestamp } from '../utils/dateUtils';
import DateFilter from './DateFilter';
import ReportTable from './ReportTable';
import ExportButton from './ExportButton';

interface DashboardProps {
  onBack: () => void;
}

export default function Dashboard({ onBack }: DashboardProps) {
  const { username, logout } = useAuth();
  const [reports, setReports] = useState<BrandOfferReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trendyolToken, setTrendyolToken] = useState('');

  const handleFetchReports = async (startDate: string, endDate: string) => {
    if (!trendyolToken.trim()) {
      setError('Lütfen Trendyol Bearer Token giriniz');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const startTimestamp = dateToUnixTimestamp(startDate + 'T00:00:00');
      const endTimestamp = dateToUnixTimestamp(endDate + 'T23:59:59');

      const data = await fetchReports(startTimestamp, endTimestamp, trendyolToken);
      setReports(data.brandOfferReports);
    } catch (err) {
      setError('Raporlar alınırken bir hata oluştu. Token geçerliliğini kontrol edin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = reports.reduce((sum, r) => sum + r.income.netIncome, 0);
  const totalRevenue = reports.reduce((sum, r) => sum + r.revenue.netRevenue, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.orderItem.netOrderItemCount, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-orange-500 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded-md text-sm"
            >
              Back
            </button>
            <h1 className="text-xl font-bold">Trendyol Influencer Metrics</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">Merhaba, {username}</span>
            <button
              onClick={logout}
              className="bg-white text-orange-500 px-3 py-1 rounded-md text-sm hover:bg-orange-100"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <label htmlFor="trendyolToken" className="block text-sm font-medium text-gray-700 mb-1">
            Trendyol Bearer Token
          </label>
          <textarea
            id="trendyolToken"
            value={trendyolToken}
            onChange={(e) => setTrendyolToken(e.target.value)}
            placeholder="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-xs"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1">
            Trendyol Influencer Center'dan aldığınız bearer token'ı yapıştırın
          </p>
        </div>

        <DateFilter onFetchReports={handleFetchReports} loading={loading} />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {reports.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500">Toplam Kayıt</div>
                <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500">Toplam Net Gelir</div>
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalIncome)} TRY
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500">Toplam Net Ciro</div>
                <div className="text-2xl font-bold text-blue-600">
                  {new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(totalRevenue)} TRY
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="text-sm text-gray-500">Toplam Sipariş</div>
                <div className="text-2xl font-bold text-purple-600">{totalOrders}</div>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <ExportButton reports={reports} disabled={reports.length === 0} />
            </div>
          </>
        )}

        <ReportTable reports={reports} />
      </main>
    </div>
  );
}
