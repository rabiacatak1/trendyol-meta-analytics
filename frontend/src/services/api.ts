import axios from 'axios';
import { ReportsResponse } from '../types';
import { MetaAdsData } from '../types/meta';

const API_URL = import.meta.env.PROD
  ? 'https://trendyol-meta-analytics-production.up.railway.app/api'
  : '/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(username: string, password: string) {
  const response = await api.post<{ token: string; username: string }>('/auth/login', {
    username,
    password
  });
  return response.data;
}

export async function fetchReports(
  startDate: number,
  endDate: number,
  trendyolToken: string
): Promise<ReportsResponse> {
  const response = await api.post<ReportsResponse>('/reports', {
    startDate,
    endDate,
    trendyolToken
  });
  return response.data;
}

export async function fetchMetaAdsData(
  metaToken: string,
  startDate?: string,
  endDate?: string
): Promise<MetaAdsData> {
  const response = await api.post<MetaAdsData & { success: boolean }>('/meta/all', {
    metaToken,
    startDate,
    endDate
  });
  return response.data;
}

export async function debugMetaToken(metaToken: string) {
  const response = await api.post('/meta/debug', { metaToken });
  return response.data;
}
