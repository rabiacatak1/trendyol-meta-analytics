import { useState } from 'react';
import { BrandOfferReport } from '../types';
import { unixTimestampToDate } from '../utils/dateUtils';

interface ReportTableProps {
  reports: BrandOfferReport[];
}

export default function ReportTable({ reports }: ReportTableProps) {
  const [eksikSiparisler, setEksikSiparisler] = useState<Record<string, string>>({});
  const [seciliKampanyalar, setSeciliKampanyalar] = useState<Set<string>>(new Set());

  if (reports.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-500">
        Gösterilecek rapor bulunamadı. Tarih seçip "Rapor Getir" butonuna tıklayın.
      </div>
    );
  }

  // Önce seçili olanlar, sonra tarihe göre sırala
  const sortedReports = [...reports].sort((a, b) => {
    const aSecili = seciliKampanyalar.has(a.advert.advertId);
    const bSecili = seciliKampanyalar.has(b.advert.advertId);

    // Seçili olanlar en üstte
    if (aSecili && !bSecili) return -1;
    if (!aSecili && bSecili) return 1;

    // Aynı gruptaysalar tarihe göre sırala
    return b.advert.startDate - a.advert.startDate;
  });

  const handleRowClick = (advertId: string) => {
    setSeciliKampanyalar(prev => {
      const newSet = new Set(prev);
      if (newSet.has(advertId)) {
        newSet.delete(advertId);
      } else {
        newSet.add(advertId);
      }
      return newSet;
    });
  };

  const handleEksikSiparisChange = (advertId: string, value: string) => {
    setEksikSiparisler(prev => ({
      ...prev,
      [advertId]: value
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return 'bg-green-100 text-green-800';
      case 'STOPPING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marka</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sipariş</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eksik Siparişler</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Gelir</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oran (%)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Ciro</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlangıç</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bitiş</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reklam Türü</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedReports.map((report, index) => (
              <tr
                key={`${report.advert.advertId}-${index}`}
                onClick={() => handleRowClick(report.advert.advertId)}
                className={`cursor-pointer ${seciliKampanyalar.has(report.advert.advertId)
                  ? 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500'
                  : 'hover:bg-gray-50'}`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{report.session}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{report.owner.name}</div>
                  <div className="text-xs text-gray-500">ID: {report.owner.id}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {report.orderItem.netOrderItemCount}
                </td>
                <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={eksikSiparisler[report.advert.advertId] || ''}
                    onChange={(e) => handleEksikSiparisChange(report.advert.advertId, e.target.value)}
                    placeholder="Not ekle..."
                    className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-green-600">
                  {formatCurrency(report.income.netIncome)} {report.currency}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.advert.status)}`}>
                    {report.advert.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{report.advert.rateAmount}%</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-orange-600">
                  {formatCurrency(report.income.netSellerBonus)} {report.currency}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {formatCurrency(report.revenue.netRevenue)} {report.currency}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={report.advert.linkToShare}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate block max-w-[120px]"
                    title={report.advert.linkToShare}
                  >
                    Link
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {unixTimestampToDate(report.advert.startDate)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {unixTimestampToDate(report.advert.endDate)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{report.advert.advertKind}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
