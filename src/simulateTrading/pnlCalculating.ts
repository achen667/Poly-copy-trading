// import type { PolymarketTrade, MarketInfo } from '../interfaces/polymarketInterfaces';
// import { fetchMarketInfo } from '../utils/fetchUserOrders';

// export async function calculateTotalPNL(trades: PolymarketTrade[]): Promise<number> {
//   // Positions keyed by slug-outcomeIndex
//   const positions = new Map<string, { totalSize: number; avgPrice: number }>();

//   // Aggregate positions
//   for (const trade of trades) {
//     if (trade.side !== 'BUY') continue; // Assuming only BUY trades
//     const key = `${trade.slug}-${trade.outcomeIndex}`;
//     const existing = positions.get(key) || { totalSize: 0, avgPrice: 0 };
//     const totalCost = existing.avgPrice * existing.totalSize + trade.price * trade.size;
//     const totalSizeNew = existing.totalSize + trade.size;
//     positions.set(key, { totalSize: totalSizeNew, avgPrice: totalCost / totalSizeNew });
//   }

//   let totalPNL = 0;

//   // Get unique slugs
//   const slugs = [...new Set(trades.map(t => t.slug))];

//   // Fetch market info for each slug
//   for (const slug of slugs) {
//     try {
//       const market = await fetchMarketInfo(slug);
//       console.log(market);
//       if (!market) continue;
//       // Only calculate PNL for closed and resolved markets
//       if (!market.closed || market.umaResolutionStatus !== 'resolved') continue;
//       if (!market.outcomePrices) continue;
//       const outcomePrices: string[] = JSON.parse(market.outcomePrices);
//       // outcomePrices is current prices for active, resolved for closed
//       for (const [key, pos] of positions) {
//         const [posSlug, posIndexStr = ''] = key.split('-');
//         if (posSlug !== slug) continue;
//         const outcomeIndex = parseInt(posIndexStr, 10);
//         if (isNaN(outcomeIndex) || outcomeIndex >= outcomePrices.length) continue;
//         const outcomePrice = outcomePrices[outcomeIndex];
//         if (!outcomePrice) continue;
//         const currentPrice = parseFloat(outcomePrice);
//         if (isNaN(currentPrice)) continue;
//         const pnl = (currentPrice - pos.avgPrice) * pos.totalSize;
//         totalPNL += pnl;
//       }
//     } catch (error) {
//       console.error(`Error fetching market info for ${slug}:`, error);
//     }
//   }

//   return totalPNL;
// }
