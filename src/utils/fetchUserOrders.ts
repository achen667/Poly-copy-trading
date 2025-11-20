import axios from 'axios';
import type { PolymarketTrade, UserPosition } from '../interfaces/polymarketInterfaces';

async function fetchUserOrders(userAddress: string, side?: string, limit: string = "10"): Promise<PolymarketTrade[]> {
  // let url = `https://data-api.polymarket.com/trades?limit=${limit}&takerOnly=true&user=${userAddress}`;
  let url = `https://data-api.polymarket.com/trades?limit=${limit}&user=${userAddress}`;
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

export { fetchUserOrders, fetchUserPosition };
