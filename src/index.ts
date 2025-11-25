// Polymarket Copy Trading Bot

import 'dotenv/config';
import createClobClient from './utils/createClobClient';
import { fetchUserOrders } from './utils/fetchUserOrders';
import replicateOrder from './utils/postOrder';
import type { PolymarketTrade } from './interfaces/polymarketInterfaces';
import { readJsonFile, writeJsonFile } from './utils/fileUtils';

// import { ClobClient, OrderType, Side, type UserMarketOrder, type UserOrder } from '@polymarket/clob-client';
/*
const PolymarketTradeSchema = new Schema({
  proxyWallet: String,
  side: String,
  asset: String,
  conditionId: String,
  size: Number,
  price: Number,
  timestamp: Number,
  title: String,
  slug: String,
  icon: String,
  eventSlug: String,
  outcome: String,
  outcomeIndex: Number,
  name: String,
  pseudonym: String,
  bio: String,
  profileImage: String,
  profileImageOptimized: String,
  transactionHash: { type: String, unique: true }, // Ensure uniqueness
});

const PolymarketTradeModel = mongoose.model('PolymarketTrade', PolymarketTradeSchema);
*/




// Connect to MongoDB (commented out for local storage)
/*
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polymarket-trades');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
*/

async function main() {
  console.log('Starting Polymarket Copy Trading Bot (continuous monitoring)...');
  const client = await createClobClient();

  // Track processed hashes to avoid duplicates
  let processedHashes = new Set<string>();

  // Load existing processed hashes from file if it exists
  const hashArray = await readJsonFile('processed_hashes.json');
  if (hashArray) {
    processedHashes = new Set(hashArray);
    console.log(`Loaded ${processedHashes.size} previously processed transaction hashes`);
  } else {
    console.log('No previous processed hashes file found, starting fresh');
  }

  const targetUser = process.env.TARGET_USER || '0x0000000000000000000000000000000000000000';
  const pollInterval = parseInt(process.env.POLL_INTERVAL || '1000'); 

  console.log(`Monitoring user: ${targetUser}`);
  console.log(`Poll interval: ${pollInterval}ms`);

  while (true) {
    try {
      console.log(new Date().toISOString(), '- Checking for new orders...');

      const orders = await fetchUserOrders(targetUser);
      //console.log(`Fetched ${orders.length} orders`);

      // Filter for new orders that haven't been processed
      const newOrders = orders.filter(order => !processedHashes.has(order.transactionHash));

      if (newOrders.length > 0) {
        console.log(`Found ${newOrders.length} new orders to evaluate`);

        // Save orders to local file (optional)
        let existingOrders: PolymarketTrade[] = await readJsonFile('orders.json') || [];

        existingOrders.push(...newOrders);
        await writeJsonFile('orders.json', existingOrders);

        // Process each new order
        for (const newOrder of newOrders) {
          // Check if order is within 30 seconds
          const currentTime = Date.now();
          const thirtySecondsAgo = currentTime/1000 - 30;

          if (newOrder.timestamp > thirtySecondsAgo) {
            console.log(`Replicating recent order (${newOrder.timestamp} > ${thirtySecondsAgo}): ${newOrder.transactionHash}`);
            console.log(`Target Order - Side: ${newOrder.side}, Asset: ${newOrder.asset}, Price: ${newOrder.price}, Size: ${newOrder.size}`);
            await replicateOrder(newOrder,client);
          } else {
            console.log(`Order is too old (>30s): ${newOrder.timestamp} <= ${thirtySecondsAgo}`);
          }

          // Mark as processed
          processedHashes.add(newOrder.transactionHash);
        }

        // Save updated processed hashes
        await writeJsonFile('processed_hashes.json', Array.from(processedHashes));

      } else {
        //console.log('No new orders found');
      }

    } catch (error) {
      console.error('Error in main loop:', error);
    }

    // Wait before next poll
    //console.log(`Waiting ${pollInterval}ms before next check...`);
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

main();
