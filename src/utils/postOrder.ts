import type { relative } from 'path';
import type { PolymarketTrade, UserPosition } from '../interfaces/polymarketInterfaces';
import { ClobClient, OrderType, Side, type UserMarketOrder, type UserOrder } from '@polymarket/clob-client';
// import orderFilter from './filter';
import { fetchUserPosition } from '../utils/fetchUserOrders';
import { appendJsonToFile } from './fileUtils';
import { url } from 'inspector';

type OrderSummary = { price: string; size: string };

const RETRY_LIMIT = parseInt(process.env.RETRY_LIMIT || '3', 10);
const MY_WALLET: string = process.env.PROXY_WALLET!; // Non-null assertion since it's required for the app to run

async function replicateOrder(order: PolymarketTrade,clobClient: ClobClient) {
  try {
    const client = clobClient; //await createClobClient();

    const tokenId = order.asset;
    //const price = order.price; 
    const amount = 1;  //usdc   min:1$  or 5 share
    const share = 1; //share  min: 1$ (share*price)  or 5 share
    const size  = order.size;
    const condition = order.side;  // BUY, SELL
    
    if (condition === 'BUY') {       //Buy strategy
      console.log('Buy Strategy...');
    
      let retry = 0;
      while (retry < RETRY_LIMIT) {
          const orderBook = await client.getOrderBook(tokenId);
          if (!orderBook.asks || orderBook.asks.length === 0) {
              //[add skip info]
              console.log('No asks found, tx ignored');
              break;
          }

          let minPriceAsk = orderBook.asks[0] as OrderSummary;
          for (const ask of orderBook.asks) {
              if (parseFloat(ask.price) < parseFloat(minPriceAsk.price)) {
                  minPriceAsk = ask;
              }
          }

          console.log('Min price ask:', minPriceAsk);
          if (parseFloat(minPriceAsk.price) - 0.05 > order.price) {
              console.log('Too big different price - do not copy');
              //[add skip info]
              break;
          }
          ////Using limit order
          const askPrice = parseFloat(minPriceAsk.price);  //lowest buy price
          let orderParams:UserOrder = {
            tokenID: tokenId,
            price: askPrice,//askPrice, 
            size: size*1.02,//1.02 / askPrice,  //$1.02
            side: Side.BUY
          }
          //////////Filter/////////////
          //
          if(askPrice >= 0.98 || askPrice <= 0.02){
            console.log('Order skipped: price under/above 0.02/0.98:', askPrice);
            break;
          }
          //Using max 1$
          if(askPrice * size >= 1){
            orderParams.size = 1.06 / askPrice;
          }  

          //add targe user share amount


          console.log('Order args:', orderParams);
          const signedOrder = await clobClient.createOrder(orderParams);
          // const signedOrder = await clobClient.createMarketOrder(orderParams);
          
          console.log('signed order: ', signedOrder);
          const res = await clobClient.postOrder(signedOrder, OrderType.GTC);
          if (res.success === true) {
              console.log('Successfully posted buy order:', res);
              await appendJsonToFile('Orders.log', res, signedOrder);
              break;
          } else {
              await new Promise(resolve => setTimeout(resolve, 500));
              retry += 1;
              console.log('Error posting order: retrying...', res);
          }

          //// Using market order
          // const orderParams:UserMarketOrder = {
          //   tokenID: tokenId,
          //   // price:  parseFloat(minPriceAsk.price),
          //   amount: amount,
          //   side: Side.BUY
          // }
          // console.log('Order args:', orderParams);
          // const signedOrder = await clobClient.createAndPostMarketOrder(orderParams);
          // if (signedOrder.success === true) {
          //     retry = 0;
          //     console.log('Successfully posted order:', signedOrder);
          // } else {
          //     retry += 1;
          //     console.log('Error posting order: retrying...', signedOrder);
          // }
      }

    } else if (condition === 'SELL') {       //Sell strategy
      console.log('Sell Strategy...');

      let retry = 0;
      while (retry < RETRY_LIMIT) {
          const orderBook = await client.getOrderBook(tokenId);
          if (!orderBook.bids || orderBook.bids.length === 0) {
              //[add skip info]
              console.log('No bids found, tx ignored');
              break;
          }

          let maxPriceBid = orderBook.bids[0] as OrderSummary;
          for (const bid of orderBook.bids) {
              if (parseFloat(bid.price) > parseFloat(maxPriceBid.price)) {
                  maxPriceBid = bid;
              }
          }

          console.log('Max price bid:', maxPriceBid);
          //// We don't skip sell order
          // if (order.price - parseFloat(maxPriceBid.price) > 0.05) {
          //     console.log('Too big different price - do not copy');
          //     //[add skip info]
          //     break;
          // }

          ////Using limit order
          const bidPrice = parseFloat(maxPriceBid.price);  //highest sell price
          
          const positions:UserPosition[]  = await fetchUserPosition(MY_WALLET, order.conditionId);
          let positionsize:number = 0 ;
          for(const position of positions){
            positionsize = position.size;
          }
          
          console.log('user who sell :', MY_WALLET);
          console.log('position size', positionsize);
          
          if (positionsize === 0) {
            console.log('No position found for user, skip after retry');
            retry +=1;
            continue;
          }
          const orderParams:UserOrder = {
            tokenID: tokenId,
            price: bidPrice,
            size: positionsize,  //$1.02
            side: Side.SELL
          }

          

          console.log('Order args:', orderParams);
          const signedOrder = await clobClient.createOrder(orderParams);
          // const signedOrder = await clobClient.createMarketOrder(orderParams);

          console.log('signed order: ', signedOrder);
          const res = await clobClient.postOrder(signedOrder, OrderType.GTC);
          if (res.success === true) {
              console.log('Successfully posted sell order:', res);
              await appendJsonToFile('order.log', res);
              break;
          } else {
              await new Promise(resolve => setTimeout(resolve, 1000));
              retry += 1;
              console.log('Error posting order: retrying...', res);
          }

          //// Using market order
          // const orderParams:UserMarketOrder = {
          //   tokenID: tokenId,
          //   // price:  parseFloat(maxPriceBid.price),
          //   amount: amount,
          //   side: Side.SELL
          // }
          // console.log('Order args:', orderParams);
          // const signedOrder = await clobClient.createAndPostMarketOrder(orderParams);
          // if (signedOrder.success === true) {
          //     retry = 0;
          //     console.log('Successfully posted order:', signedOrder);
          // } else {
          //     retry += 1;
          //     console.log('Error posting order: retrying...', signedOrder);
          // }
      }
    }


    // const marketOrderParams:UserMarketOrder = {
    //   tokenID: tokenId,
    //   side: Side.BUY,
    //   amount: amount, // Exactly 2 decimal places
    //   // orderType: OrderType.FOK
    //   price: price // For market order, price might not be used
    // };
    // const orderParams:UserOrder = {
    //   tokenID: tokenId,
    //   /**
    //    * Price used to create the order
    //    */
    //   price: price,
    //   /**
    //    * Size in terms of the ConditionalToken
    //    */
    //   size: amount,
    //   /**
    //    * Side of the order
    //    */
    //   side: Side.BUY
    // }


  
  } catch (error) {
    console.error('Error replicating order:',  error);
  }
}


export default replicateOrder;
