const https = require('https')
// const AWS = require('aws-sdk');
var dateFormat = require("dateformat");
// const dynamoDb = new AWS.DynamoDB.DocumentClient();
const event = {
    code: "VALE3",
    startDate: "2020-12-20",
    endDate: "2021-1-20",
    transactions:  [
        {
            "date": [
                2020,
                12,
                30
            ],
            "asset": "VALE3",
            "shares_number": 100,
            "price": 85.0,
            "type": "BUY"
        },
        {
            "date": [
                2020,
                12,
                29
            ],
            "asset": "VALE3",
            "shares_number": 100,
            "price": 60.2,
            "type": "BUY"
        },
        {
            "date": [
                2020,
                11,
                20
            ],
            "asset": "VALE3",
            "shares_number": 100,
            "price": 100.0,
            "type": "BUY"
        },
        {
            "date": [
                2020,
                10,
                10
            ],
            "asset": "VALE3",
            "shares_number": 100,
            "price": 90.0,
            "type": "BUY"
        },
        {
            "date": [
                2020,
                9,
                27
            ],
            "asset": "PETR4",
            "shares_number": 100,
            "price": 21.0,
            "type": "BUY"
        }
    ]
}
// Helper function used to validate input
function checkDefined(reference, referenceName) {
    if (!reference) {
        throw new Error(`Error: ${referenceName} is not defined`);
    }
    return reference;
}

const code = event["code"];
checkDefined(code, "code");

//exports.main =  function(event, context, callback) {
function main(event, context, callback) {
    const API_KEY = process.env.ALPHA_API_KEY
    var outputSize = "compact"
    
    for(let key in event)
    console.info(`event[${key}]: ${event[key]}`);
    
    
    const transactions = event["transactions"];
    const startDate = new Date(event["startDate"] + " 15:00");
    console.log(startDate, event["startDate"]);
    const endDate = new Date(event["endDate"] + " 15:00");
    checkDefined(transactions, "transactions");
    checkDefined(startDate, "startDate");
    checkDefined(endDate, "endDate");
    
    
    let url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize="+ outputSize +"&symbol="+ code +".SA&apikey="+ API_KEY
    var quote = {}
    
    https.get(url, (res) => {
        var body = '';
        res.on('data', function(chunk){
            body += chunk;
        });
        res.on('end', function(){
            quotes = JSON.parse(body)['Time Series (Daily)'];
            console.log("Got a response: ", quotes['2021-02-12']);
            
            calculateDailyReturns(transactions, startDate, endDate, quotes)
            
            // callback(null, quotes)
        });  
    }).on('error', (e) => {
        callback(Error(e))
    })
}

function getTransactionsFromDay(transactions, date, beforeDateToo){
    return transactions.filter(t => t.asset == code && 
        (beforeDateToo? toDate(t.date).getTime() <= date.getTime() : toDate(t.date).getTime() == date.getTime()) );
}

function sumTransactionsFromDay(totals, transactions, currentQuote, date, beforeDateToo){
    let transactionsFromDay = getTransactionsFromDay(transactions, date, beforeDateToo)
    transactionsFromDay.forEach(t =>{
        totals.shares += t.shares_number;
        totals.cost += t.price * t.shares_number;
    })
    if(totals.shares > 0){
        totals.return = currentQuote / (totals.cost/totals.shares);
        console.log("newTransactions avg cost:",totals.cost/totals.shares);
        console.log("newTransactions return:", totals.return);
    }
    return transactionsFromDay;
}

function calculateDailyReturns(transactions, startDate, endDate, quotes){
    //--skip weekend/holidays
    for(let day = startDate; day <= endDate; day.setDate(day.getDate() + 1))
        if(!quotes[dateToString(day).toString()])
            startDate = day;
        else break;

    lastDayValue = quotes[dateToString(startDate)]["5. adjusted close"];

    //--get totals from all transactions made before and on start date
    let totals = {shares: 0, cost: 0, return: 1};
    sumTransactionsFromDay(totals, transactions, lastDayValue, startDate, true)
    

    var assetDailyValues = {};
    for(let day = startDate; day <= endDate; day.setDate(day.getDate() + 1)){
        //--if its weekend/holiday
        if(!quotes[dateToString(day).toString()])
            continue;

        //--get the closed quote of the day
        todayValue = quotes[dateToString(day).toString()]["5. adjusted close"];
        // console.log("-----DAY:", day, "------ daily close:", todayValue);

        //--get transactions made on the day
        let newTransactionsTotals = {shares: 0, cost: 0, return: 1}
        let transactionsToday = sumTransactionsFromDay(newTransactionsTotals, transactions, todayValue, day, false)
        
        //--get totals considering the new day
        let todaysReturn = todayValue/lastDayValue;
        totals.return = ( (totals.return*totals.shares) * todaysReturn  
                                +  newTransactionsTotals.shares*newTransactionsTotals.return )
                /  (totals.shares + newTransactionsTotals.shares);
        totals.shares += newTransactionsTotals.shares;
        totals.cost += newTransactionsTotals.cost;

        assetDailyValues[dateToString(day)] = totals;
        // console.log("Cumulative return:", totals.return);
        // console.log("Total shares:", totals.shares);
        
        lastDayValue = todayValue;
    }
}

function toDate(d){
    return new Date(`${d[0]}-${d[1]}-${d[2]} 15:00`);
}
function dateToString(d){
    d.setHours(15);
    return dateFormat(d, "yyyy-mm-dd")
}


main(event)

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
