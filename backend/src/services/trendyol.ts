import axios from 'axios';
import { BrandOfferReport, TrendyolApiResponse } from '../types';

const BASE_URL = 'https://apigw.trendyol.com/discovery-ia-webgw-service/v1/brand-offer-report/metrics';

export async function fetchAllReports(
  startDate: number,
  endDate: number,
  trendyolToken: string
): Promise<BrandOfferReport[]> {
  const allReports: BrandOfferReport[] = [];
  let page = 0;
  const size = 20;
  let hasMore = true;

  while (hasMore) {
    const url = `${BASE_URL}?page=${page}&size=${size}&startDate=${startDate}&endDate=${endDate}&profitedOffers=false&sortingType=DATE_DESC`;

    try {
      const response = await axios.get<TrendyolApiResponse>(url, {
        headers: {
          'content-type': 'application/json',
          'x-agent-origin': 'client',
          'x-agent-name': 'web-report',
          'accept': '*/*',
          'authorization': `bearer ${trendyolToken}`,
          'culture': 'tr-TR',
          'origin': 'https://influencercenter.trendyol.com',
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
          'x-platform': 'IOS'
        }
      });

      const reports = response.data.brandOfferReports || [];

      if (reports.length === 0) {
        hasMore = false;
      } else {
        allReports.push(...reports);
        page++;

        // If we got less than the requested size, we've reached the end
        if (reports.length < size) {
          hasMore = false;
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Trendyol API error: ${error.response?.status} - ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  return allReports;
}
