import { BrandOfferReport } from '../types';
import { unixTimestampToDate } from './dateUtils';

export function exportToCSV(reports: BrandOfferReport[], filename: string = 'trendyol-rapor.csv') {
  const headers = [
    'Session',
    'Marka ID',
    'Marka Adı',
    'Reklam ID',
    'Başlangıç Tarihi',
    'Bitiş Tarihi',
    'Komisyon Oranı (%)',
    'Reklam Türü',
    'Durum',
    'Paylaşım Linki',
    'Badge ID',
    'Promosyon Başlığı',
    'Promosyon Türü',
    'Direkt Gelir',
    'Dolaylı Gelir',
    'Harici Link Geliri',
    'İptal Gelir',
    'Kesinti Gelir',
    'Net Gelir',
    'Satıcı Bonusu',
    'Direkt Ciro',
    'Dolaylı Ciro',
    'Harici Link Ciro',
    'İptal Ciro',
    'Kesinti Ciro',
    'Net Ciro',
    'Net Sipariş Sayısı',
    'Dahili Link Sipariş Sayısı',
    'Toplu İşlem Sayısı',
    'Para Birimi'
  ];

  const rows = reports.map(report => [
    report.session,
    report.owner.id,
    report.owner.name,
    report.advert.advertId,
    unixTimestampToDate(report.advert.startDate),
    unixTimestampToDate(report.advert.endDate),
    report.advert.rateAmount,
    report.advert.advertKind,
    report.advert.status,
    report.advert.linkToShare,
    report.advert.badgeId,
    report.advert.promotion?.title || '',
    report.advert.promotion?.kind || '',
    report.income.internalLinkDirectIncome.toFixed(2),
    report.income.internalLinkIndirectIncome.toFixed(2),
    report.income.externalLinkIncome.toFixed(2),
    report.income.cancelledIncome.toFixed(2),
    report.income.cutOffIncome.toFixed(2),
    report.income.netIncome.toFixed(2),
    report.income.netSellerBonus.toFixed(2),
    report.revenue.internalLinkDirectRevenue.toFixed(2),
    report.revenue.internalLinkIndirectRevenue.toFixed(2),
    report.revenue.externalLinkRevenue.toFixed(2),
    report.revenue.cancelledRevenue.toFixed(2),
    report.revenue.cutOffRevenue.toFixed(2),
    report.revenue.netRevenue.toFixed(2),
    report.orderItem.netOrderItemCount,
    report.orderItem.netInternalLinkOrderItemCount,
    report.trx.bulkTrxCount,
    report.currency
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  // UTF-8 BOM for Turkish characters
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
