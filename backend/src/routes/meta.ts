import { Router, Response } from 'express';
import axios from 'axios';
import { AuthRequest } from '../middleware/auth';
import {
  getAdAccounts,
  getCampaigns,
  getAdSets,
  getAds,
  getInsights,
  getInsightsByDateRange,
  getAllMetaData
} from '../services/meta';

const router = Router();

// Debug endpoint to validate token
router.post('/debug', async (req: AuthRequest, res: Response) => {
  const { metaToken } = req.body;

  if (!metaToken) {
    res.status(400).json({ error: 'Meta access token is required' });
    return;
  }

  const cleanedToken = metaToken.trim().replace(/\s+/g, '');
  console.log('Token length:', cleanedToken.length);
  console.log('Token starts with:', cleanedToken.substring(0, 20));
  console.log('Token ends with:', cleanedToken.substring(cleanedToken.length - 20));

  try {
    // Test with /me endpoint first
    const response = await axios.get('https://graph.facebook.com/v21.0/me', {
      params: {
        access_token: cleanedToken,
        fields: 'id,name'
      }
    });

    res.json({
      success: true,
      message: 'Token is valid',
      user: response.data,
      tokenInfo: {
        length: cleanedToken.length,
        prefix: cleanedToken.substring(0, 10) + '...'
      }
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error('Debug error:', JSON.stringify(error.response.data, null, 2));
      res.status(400).json({
        success: false,
        error: error.response.data.error,
        tokenInfo: {
          length: cleanedToken.length,
          prefix: cleanedToken.substring(0, 10) + '...'
        }
      });
    } else {
      res.status(500).json({ error: 'Unknown error occurred' });
    }
  }
});

// Get all ad accounts
router.get('/accounts', async (req: AuthRequest, res: Response) => {
  const { metaToken } = req.query;

  if (!metaToken || typeof metaToken !== 'string') {
    res.status(400).json({ error: 'Meta access token is required' });
    return;
  }

  try {
    const accounts = await getAdAccounts(metaToken);
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Error fetching ad accounts:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch ad accounts'
    });
  }
});

// Get campaigns for an ad account
router.get('/campaigns/:accountId', async (req: AuthRequest, res: Response) => {
  const { accountId } = req.params;
  const { metaToken } = req.query;

  if (!metaToken || typeof metaToken !== 'string') {
    res.status(400).json({ error: 'Meta access token is required' });
    return;
  }

  try {
    const campaigns = await getCampaigns(metaToken, accountId);
    res.json({ success: true, data: campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch campaigns'
    });
  }
});

// Get ad sets for an ad account
router.get('/adsets/:accountId', async (req: AuthRequest, res: Response) => {
  const { accountId } = req.params;
  const { metaToken } = req.query;

  if (!metaToken || typeof metaToken !== 'string') {
    res.status(400).json({ error: 'Meta access token is required' });
    return;
  }

  try {
    const adSets = await getAdSets(metaToken, accountId);
    res.json({ success: true, data: adSets });
  } catch (error) {
    console.error('Error fetching ad sets:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch ad sets'
    });
  }
});

// Get ads for an ad account
router.get('/ads/:accountId', async (req: AuthRequest, res: Response) => {
  const { accountId } = req.params;
  const { metaToken } = req.query;

  if (!metaToken || typeof metaToken !== 'string') {
    res.status(400).json({ error: 'Meta access token is required' });
    return;
  }

  try {
    const ads = await getAds(metaToken, accountId);
    res.json({ success: true, data: ads });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch ads'
    });
  }
});

// Get insights for an ad account
router.get('/insights/:accountId', async (req: AuthRequest, res: Response) => {
  const { accountId } = req.params;
  const { metaToken, startDate, endDate, level = 'campaign' } = req.query;

  if (!metaToken || typeof metaToken !== 'string') {
    res.status(400).json({ error: 'Meta access token is required' });
    return;
  }

  try {
    let insights;
    if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      insights = await getInsightsByDateRange(
        metaToken,
        accountId,
        startDate,
        endDate,
        level as string
      );
    } else {
      insights = await getInsights(metaToken, accountId, 'last_30d', level as string);
    }
    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch insights'
    });
  }
});

// Get all data (accounts, campaigns, adsets, ads, insights)
router.post('/all', async (req: AuthRequest, res: Response) => {
  const { metaToken, startDate, endDate } = req.body;

  if (!metaToken) {
    res.status(400).json({ error: 'Meta access token is required' });
    return;
  }

  try {
    const data = await getAllMetaData(metaToken, startDate, endDate);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching all Meta data:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch Meta data'
    });
  }
});

export default router;
