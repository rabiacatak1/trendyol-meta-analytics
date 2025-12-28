import { BrandOfferReport } from '../types';
import { exportToCSV } from '../utils/csvExport';

interface ExportButtonProps {
  reports: BrandOfferReport[];
  disabled: boolean;
}

export default function ExportButton({ reports, disabled }: ExportButtonProps) {
  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    exportToCSV(reports, `trendyol-rapor-${date}.csv`);
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled}
      className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      CSV İndir ({reports.length} kayıt)
    </button>
  );
}
