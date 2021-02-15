const https = require('https')
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.main =  function(event, context, callback) {
  const API_KEY = process.env.ALPHA_API_KEY
  var outputSize = "compact"

  for(let key in event)
    console.info(`event[${key}]: ${event[key]}`);

  const code = event["code"];
  if(!code || !API_KEY){
    console.error("code/API key not informed!");
    callback(null, quote);
  }

  let url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize="+ outputSize +"&symbol="+ code +".SA&apikey="+ API_KEY
  var quote = {}
  
  https.get(url, (res) => {
    var body = '';
    res.on('data', function(chunk){
        body += chunk;
    });
    res.on('end', function(){
        quote = JSON.parse(body);
        console.log("Got a response: ", quote['Time Series (Daily)']['2021-02-12']);
        callback(null, quote['Time Series (Daily)'])
    });  
  }).on('error', (e) => {
    callback(Error(e))
  })
}


// 'use strict';

// const http = require('http');
// const API_KEY = "OC8AZHP6EZ0ABFIW" //TODO 
// //API_KEY = "<<<ADD API KEY HERE>>>"

// module.exports.main = async (event) => {
//   let code = event["code"];
//   let outputSize = 'compact';
//   for (let key in event){
//     console.info(`${key}: ${event[key]}`);
//   }
//   var body = '';
//   //http.get('http://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize='+outputSize+'&symbol='+code+'.SA&apikey='+API_KEY, function(res){
//     http.get('http://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize=compact&symbol=PETR4.SA&apikey=OC8AZHP6EZ0ABFIW', function(res){
      
//       res.on('data', function(chunk){
//         body += chunk;
//       });

//       res.on('end', getData())
//   }).on('error', function(e){
//         console.log("Got an error: ", e);
//         return {
//           statusCode: 500,
//           body: JSON.stringify(
//             {
//               message: 'Serverless. Error!',
//               output: "500",
//             },
//             null,
//             2
//           ),
//         };
//   });
  
//   function getData(chunk){
//     var quote = JSON.parse(body);
//     console.log("Got a response: ", quote);

//     console.info("'time series' request received for code:" + code);
//     return {
//       statusCode: 200,
//       body: JSON.stringify(
//         {
//           message: 'Go Serverless v1.0! Your function executed successfully!',
//           output: quote,
//         },
//         null,
//         2
//       ),
//     };
//   }

  

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
// };
