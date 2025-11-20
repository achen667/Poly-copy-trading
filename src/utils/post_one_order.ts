// import replicateOrder from '../utils/postOrder';
// import createClobClient from '../utils/createClobClient';
// import fetchUserOrders from '../utils/fetchUserOrders';
// import { ClobClient, OrderType, Side, type UserMarketOrder, type UserOrder } from '@polymarket/clob-client';

// const TARGET_USER = "0x5b68a8afea1dc6c81a0c0732b080bbe7b53bbec6"
 
 
// async function postOneOrder() {

//     const client = await createClobClient();
    
    
//     console.log(new Date().toISOString());
    
    
//     const orderParams:UserOrder = {
//         tokenID: "59948720944868168454409742025537774908837758559179210512150624185040906477117",
//         price: 0.01,//askPrice, 
//         size: 6,//1.02 / askPrice,  //$1.02
//         side: Side.BUY
//     }

//     console.log('Order args:', orderParams);
//     const signedOrder = await client.createOrder(orderParams);
//     // const signedOrder = await clobClient.createMarketOrder(orderParams);
    
//     console.log('signed order: ', signedOrder);
//     const res = await client.postOrder(signedOrder, OrderType.GTC);
//     if (res.success === true) {
//         console.log('Successfully posted buy order:', res);
//     }
//     // await new Promise(resolve => setTimeout(resolve, 1000));
     
// }

// postOneOrder();
