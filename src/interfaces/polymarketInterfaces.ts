
export interface PolymarketTrade {
  proxyWallet: string;
  side: string;
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  name: string;
  pseudonym: string;
  bio: string;
  profileImage: string;
  profileImageOptimized: string;
  transactionHash: string;
}

export interface UserPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
}


// export interface PolymarketTrade {
//   proxyWallet: string;
//   timestamp: number;
//   conditionId: string;
//   type: string;
//   size: number;
//   usdcSize: number;
//   transactionHash: string;
//   price: number;
//   asset: string;
//   side: string;
//   outcomeIndex: number;
//   title: string;
//   slug: string;
//   icon: string;
//   eventSlug: string;
//   outcome: string;
//   name: string;
//   pseudonym: string;
//   bio: string;
//   profileImage: string;
//   profileImageOptimized: string;
// }
