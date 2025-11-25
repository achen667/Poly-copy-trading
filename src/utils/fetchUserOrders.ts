import axios from 'axios';
import type { MarketInfo, PolymarketTrade, UserPosition } from '../interfaces/polymarketInterfaces';

async function fetchUserOrders(userAddress: string, side?: string, limit: string = "15"): Promise<PolymarketTrade[]> {
  // let url = `https://data-api.polymarket.com/trades?limit=${limit}&takerOnly=true&user=${userAddress}`;
  let url = `https://data-api.polymarket.com/trades?limit=${limit}&user=${userAddress}`;
  //let url = `https://data-api.polymarket.com/activity?limit=10&user=0xD5c6A1cf17aBA7E423E0C0441ecd9af55beb6C97`
  if (side) url += `&side=${side}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

async function fetchUserPosition(userAddress:string, conditionId:string): Promise<UserPosition[]> {
  let url = `https://data-api.polymarket.com/positions?sizeThreshold=1&limit=10&user=${userAddress}&market=${conditionId}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching user positions:', error);
    throw error;
  }
}

async function fetchMarketInfo(slug: string): Promise<MarketInfo> {
  const url = `https://gamma-api.polymarket.com/markets/slug/${slug}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching market info:', error);
    throw error;
  }
}

export { fetchUserOrders, fetchUserPosition ,fetchMarketInfo};
