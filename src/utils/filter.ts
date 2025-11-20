// import type { PolymarketTrade } from '../interfaces/polymarketTrade';
// import { ClobClient, OrderType, Side, type UserMarketOrder, type UserOrder } from '@polymarket/clob-client';

// function orderFilter(order: PolymarketTrade):UserOrder {
//     const size = order.size;
//     const price = order.price;
//     let myOrder:UserOrder= {
//         tokenID:order.asset,
//         price:order.price,
//         size:order.size,
//         side: order.side == Side.BUY ? Side.BUY : Side.SELL
//     };
//     // price > 0.98  &  price < 0.02   skip order
//     if(price <= 0.02 || price >= 0.98){
//         myOrder.size = 0;
//     }

//     // amount  <= $1   
//     if(size * price > 1){
//         myOrder.size = 1.02 / price;
//     }


//     return myOrder;
       
// }

// export default orderFilter;