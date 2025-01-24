// //dummyInsert();

// async function dummyInsert() {
//     try {
//         const tokenList = [
//             {
//                 "address": "FNq4HJ4jyjzmhXJoNGopm1W6HHGYFtnKHxvJ5HKMpump",
//                 "decimals": 6,
//                 "name": "Official Sol ATH",
//                 "symbol": "OSA",
//                 "created_time": 1737277244
//               },
//               {
//                 "address": "HPx2Cpvwt7WQEdLw9MNB17NReXiTTCVPfDu1fJPCpump",
//                 "decimals": 6,
//                 "name": "Trump AI Official Coin",
//                 "symbol": "TRUMPAI",
//                 "created_time": 1737277243
//               },
//               {
//                 "address": "77p8wMUgdsStt1YeiTg9G7r6GUemsV6ZLSiLcZ67pump",
//                 "decimals": 6,
//                 "name": "bhuvgy",
//                 "symbol": "bhuvgy",
//                 "created_time": 1737277242
//               }
//         ];    

//         const query =
//         `INSERT INTO tokenres.tbtoken (address, decimals, name, symbol, created_time, created_date)
//          VALUES ${tokenList
//            .map(
//              (_, index) =>
//                 `($${index * 6 + 1}, $${index * 6 + 2}, $${index * 6 + 3}, $${index * 6 + 4}, $${index * 6 + 5}, $${index * 6 + 6})`
//            )
//            .join(', ')}`;

//         // Construct the values
//         const values = tokenList.flatMap(token => [
//             token.address,
//             token.decimals,
//             token.name,
//             token.symbol,
//             token.created_time,
//             new Date(token.created_time * 1000).toISOString(),
//         ]);

//         const ab = new Date(1737277242 * 1000).toISOString();

//         await pool.query(query, values)
//         .then(res => console.log(res))
//         .catch(e => console.error(e));

//       } catch (error) {
//         console.error(error);
//       }
// }