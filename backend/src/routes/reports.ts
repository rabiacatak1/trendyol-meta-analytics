import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { fetchAllReports } from '../services/trendyol';
import { ReportRequest } from '../types';

const router = Router();

router.post('/', async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, trendyolToken } = req.body as ReportRequest;

  if (!startDate || !endDate || !trendyolToken) {
    res.status(400).json({
      error: 'Missing required fields: startDate, endDate, trendyolToken'
    });
    return;
  }

  try {
    const reports = await fetchAllReports(startDate, endDate, trendyolToken);

    res.json({
      success: true,
      totalCount: reports.length,
      brandOfferReports: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch reports'
    });
  }
});

export default router;
