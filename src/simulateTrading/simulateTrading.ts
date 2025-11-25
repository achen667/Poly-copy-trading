/* We are going to do a simulating here ,using current data
The config include :
    target wallet
    simulating duration(for example: from now to next 2 minutes)

First
    Fetch order
    Calc and Record position
*/
import 'dotenv/config';
import createClobClient from '../utils/createClobClient';
import { fetchUserOrders,fetchMarketInfo } from '../utils/fetchUserOrders';
// import replicateOrder from './utils/postOrder';
import type { PolymarketTrade } from '../interfaces/polymarketInterfaces';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { Console } from 'console';
// import { calculateTotalPNL } from './pnlCalculating';

async function simulateTrading(address:string) {
    console.log('Start Simulating..');
    // const client = await createClobClient();

    const targetUser = address;
    const prefix = targetUser.slice(0, 6).toLowerCase(); // First 8 hex characters after 0x as prefix
    const pollInterval = 5000;
    const ordersFile = `simulate_orders_${prefix}.json`;
    const positionsFile = `simulate_positions_${prefix}.json`;
    const processedFile = `simulate_processed_hashes_${prefix}.json`;

    console.log(`Monitoring user: ${targetUser} (prefix: ${prefix})`);
    console.log(`Poll interval: ${pollInterval}ms`);

    // Track processed hashes to avoid duplicates
    let processedHashes = new Set<string>();

    // Load existing processed hashes from file if it exists
    const hashArray = await readJsonFile(processedFile);
    if (hashArray) {
        processedHashes = new Set(hashArray);
        console.log(`Loaded ${processedHashes.size} previously processed transaction hashes`);
    } else {
        console.log('No previous processed hashes file found, starting fresh');
    }

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
        let existingOrders: PolymarketTrade[] = await readJsonFile(ordersFile) || [];

        existingOrders.push(...newOrders);
        await writeJsonFile(ordersFile, existingOrders);

        // Process each new order
        for (const newOrder of newOrders) {
          // Check if order is within 30 seconds
          const currentTime = Date.now();
          const thirtySecondsAgo = currentTime/1000 - 30;

          if (newOrder.timestamp > thirtySecondsAgo) {
            console.log(`Replicating recent order (${newOrder.timestamp} > ${thirtySecondsAgo}): ${newOrder.transactionHash}`);
            console.log(`Target Order - Side: ${newOrder.side}, Asset: ${newOrder.asset}, Price: ${newOrder.price}, Size: ${newOrder.size}`);
            await recordPosition(newOrder, positionsFile);

          } else {
            console.log(`Order is too old (>30s): ${newOrder.timestamp} <= ${thirtySecondsAgo}`);
          }

          // Mark as processed
          processedHashes.add(newOrder.transactionHash);
        }

        // Save updated processed hashes
        await writeJsonFile(processedFile, Array.from(processedHashes));

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


async function recordPosition(order:PolymarketTrade, fileName: string){
    /*record struct:
    {
        slug:
        asset:
        size:
        cost:
        finalValue:  //we calculate this when market close.
        PnL:
    }


    */
    const slug = order.slug;
    const asset = order.asset;
    const size = order.size;
    const price = order.price;
    const outcomeIndex = order.outcomeIndex;  //number:  0 or 1

    const cost = size * price;
    const finalValue = 0;
    // const Pnl = 0;

    // Load existing positions
    const recordFile = fileName;
    let positions: {slug: string, asset: string, size_buy: number, amount_buy: number, size_sell: number, amount_sell: number,
        currentSize:number, currentAmount:number, outcomeIndex:number, finalValue: number, }[] = (await readJsonFile(recordFile)) || [];

    // Find existing position for this slug-asset
    let existingPosition = positions.find(p => p.slug === slug && p.asset === asset);

    if (existingPosition) {
        // Update the size and cost
        if(order.side === "BUY"){
          existingPosition.size_buy += size;
          existingPosition.amount_buy += cost;
        }
        else{
          existingPosition.size_sell += size;
          existingPosition.amount_sell += cost;
        }
        // Update current size and amount
        existingPosition.currentSize = existingPosition.size_buy - existingPosition.size_sell;
        existingPosition.currentAmount = existingPosition.amount_buy - existingPosition.amount_sell;
    } else {
        // Append new position
        const newPosition = {
            slug,
            asset,
            size_buy: order.side === 'BUY' ? size : 0,
            amount_buy: order.side === 'BUY' ? cost : 0,
            size_sell: order.side === 'SELL' ? size : 0,
            amount_sell: order.side === 'SELL' ? cost : 0,
            currentSize: order.side === 'BUY' ? size : -size,
            currentAmount: order.side === 'BUY' ? cost : -cost,
            outcomeIndex,
            finalValue,
            // Pnl
        };
        positions.push(newPosition);
    }

    // Write back to file
    await writeJsonFile(recordFile, positions);

    const currentCost = existingPosition ? existingPosition.amount_buy : cost;
    console.log(`Recorded position: ${slug} - ${asset}, cost: ${currentCost}`);
}

async function calculatePnL(address: string) {
    try {
        const prefix = address.slice(0, 6).toLowerCase();
        const positionsFile = `simulate_positions_${prefix}.json`;
        console.log(`Calculating PNL from simulate_positions_${prefix}.json...`);
        console.log(`Address: ${address}`);
        const positions = await readJsonFile(positionsFile);
        if (!positions || positions.length === 0) {
            console.log(`No positions found in simulate_positions_${prefix}.json`);
            return;
        }

        let totalPNL = 0;
        let totalUnfinishedPNL = 0;
        const slugsProcessed = new Set<string>();

        for (const position of positions) {
            const { slug } = position;
            if (slugsProcessed.has(slug)) continue; // Already processed for this slug
            slugsProcessed.add(slug);

            try {
                const market = await fetchMarketInfo(slug);
                if (!market || !market.closed || market.umaResolutionStatus !== 'resolved') {
                    console.log(`Market ${slug} not resolved yet`);
                    continue;
                }

                const outcomePrices: string[] = JSON.parse(market.outcomePrices);
                const resolvedIndex = outcomePrices.findIndex(price => parseFloat(price) === 1);
                if (resolvedIndex === -1) {
                    console.log(`No resolved outcome for ${slug}`);
                    continue;
                }

                console.log(`Market ${slug} resolved to outcome ${resolvedIndex}`);
            } catch (error) {
                console.error(`Error fetching market info for ${slug}:`, error);
                continue;
            }
        }

        // Ensure currentSize and currentAmount are set (for backward compatibility)
        positions.forEach((p: any) => {
            p.currentSize = 'currentSize' in p ? p.currentSize : (p.size_buy - p.size_sell);
            p.currentAmount = 'currentAmount' in p ? p.currentAmount : (p.amount_buy - p.amount_sell);
        });

        // Now update positions based on resolved indexes or current prices for active markets
        for (const position of positions) {
            let pnlForPosition = 0;
            let unfinishedPnlForPosition = 0 ;
            try {
                const market = await fetchMarketInfo(position.slug);
                if (!market) continue;

                const outcomePrices: string[] = JSON.parse(market.outcomePrices);
                if (market.closed && market.umaResolutionStatus === 'resolved') {
                    // Resolved: finalize with actual outcome
                    const resolvedIndex = outcomePrices.findIndex(price => parseFloat(price) === 1);
                    if (resolvedIndex === position.outcomeIndex && resolvedIndex !== -1) {
                        position.finalValue = position.currentSize; // Payout = size_buy * 1
                    } else {
                        position.finalValue = 0; // Lost
                    }
                    pnlForPosition = position.finalValue - position.currentAmount;
                    unfinishedPnlForPosition =0;
                    totalPNL += pnlForPosition;
                    
                } else {
                    // Unresolved: use current market price for unrealized PNL
                    if (position.outcomeIndex >= 0 && position.outcomeIndex < outcomePrices.length) {
                        const outcomePriceStr = outcomePrices[position.outcomeIndex] || '0';
                        const currentPrice = parseFloat(outcomePriceStr);
                        if (!isNaN(currentPrice)) {
                            position.finalValue = position.size_buy * currentPrice; // Current value
                        } else {
                            position.finalValue = 0;
                        }
                    } else {
                        position.finalValue = 0;
                    }
                    unfinishedPnlForPosition = position.finalValue - position.currentAmount;
                    pnlForPosition = 0;
                    totalUnfinishedPNL += unfinishedPnlForPosition;
                }
                // const pnlForPosition = position.finalValue - position.currentAmount;
                // totalPNL += pnlForPosition;
                position.PnL = pnlForPosition;
                position.unfinishedPnL = unfinishedPnlForPosition;
                console.log(`Position ${position.slug}-${position.asset}: cost ${position.amount_buy}, value ${position.finalValue}, pnl ${pnlForPosition}, unfinishedPnL ${unfinishedPnlForPosition}`);
            } catch (error) {
                console.error(`Error updating position for ${position.slug}:`, error);
            }
        }

        // Save updated positions back to file
        await writeJsonFile(positionsFile, positions);

        console.log(`Total PNL: ${totalPNL}`);
        console.log(`Total unfinished PNL: ${totalUnfinishedPNL}`);
    } catch (error) {
        console.error('Error calculating PNL:', error);
    }
}

// // calculatePnL('0x1234567890123456789012345678901234567890'); // Example call
// calculatePnL('0xe00740bce98a594e26861838885ab310ec3b548c'); // Example call
simulateTrading('0xe00740bce98a594e26861838885ab310ec3b548c'); // Example call

// simulateTrading('0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d'); //only buy not sell
// calculatePnL('0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d');

//99/100 :
//0xd1c769317bd15de7768a70d0214cf0bbcc531d2b
//0x751a2b86cab503496efd325c8344e10159349ea1
