export interface Advert {
  advertId: string;
  startDate: number;
  endDate: number;
  rateAmount: number;
  advertKind: string;
  status: string;
  linkToShare: string;
  badgeId: number;
  promotion?: {
    title: string;
    kind: string;
  };
}

export interface Income {
  internalLinkDirectIncome: number;
  internalLinkIndirectIncome: number;
  externalLinkIncome: number;
  cancelledIncome: number;
  cutOffIncome: number;
  netIncome: number;
  netSellerBonus: number;
}

export interface Revenue {
  internalLinkDirectRevenue: number;
  internalLinkIndirectRevenue: number;
  externalLinkRevenue: number;
  cancelledRevenue: number;
  cutOffRevenue: number;
  netRevenue: number;
}

export interface OrderItem {
  netOrderItemCount: number;
  netInternalLinkOrderItemCount: number;
}

export interface Owner {
  id: number;
  name: string;
}

export interface BrandOfferReport {
  session: number;
  advert: Advert;
  income: Income;
  revenue: Revenue;
  orderItem: OrderItem;
  trx: {
    bulkTrxCount: number;
  };
  owner: Owner;
  currency: string;
}

export interface TrendyolApiResponse {
  brandOfferReports: BrandOfferReport[];
}

export interface ReportRequest {
  startDate: number;
  endDate: number;
  trendyolToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtPayload {
  username: string;
  iat?: number;
  exp?: number;
}
