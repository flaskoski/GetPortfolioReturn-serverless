const https = require('https')
var dateFormat = require("dateformat");
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
 
// Helper function used to validate input
function checkDefined(reference, referenceName) {
    if (!reference) {
        throw new Error(`Error: ${referenceName} is not defined`);
    }
    return reference;
}

var code ='';
// function main(event, context, callback) {
exports.main =  function(event, context, callback) {
    const API_KEY = process.env.ALPHA_API_KEY
    
    // for(let key in event)
    //     console.info(`event[${key}]: ${event[key]}`);
    checkDefined(event["code"], "code");
    checkDefined(event["transactions"], "transactions");
    checkDefined(event["startDate"], "startDate");
    checkDefined(event["endDate"], "endDate");
    console.log("startDate:", event["startDate"]);
    console.log("endDate:", event["endDate"]);

    code = event["code"];
    const transactions = event["transactions"];
    const startDate = new Date(event["startDate"] + " 15:00");
    const endDate = new Date(event["endDate"] + " 15:00");
    
    var outputSize = getOutputSize(startDate, endDate);
    
    let url = "https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&outputsize="+ outputSize +"&symbol="+ code +".SA&apikey="+ API_KEY
    
    console.log("GET request:", url);
    https.get(url, (res) => {
        var body = '';
        res.on('data', function(chunk){
            body += chunk;
        });
        res.on('end', function(){
            let quotes = JSON.parse(body)['Time Series (Daily)'];
            if(quotes){
                const response = {
                    statusCode: 200,
                    body: JSON.stringify(calculateDailyReturns(transactions, startDate, endDate, quotes))
                };
                callback(null, response)
            }
            else callback(Error("Could not get quotes from", code))
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
        console.log("New transaction:", t.date, t.type, t.shares_number, t.asset, "$"+t.price);
        if(t.type == "BUY"){
            totals.shares += t.shares_number;
            totals.cost += t.price * t.shares_number;
        }else{
            let soldSharesCost = t.shares_number * (totals.cost)/(totals.shares);
            totals.profit += t.price * t.shares_number - soldSharesCost;
            totals.cost -= soldSharesCost;
            totals.shares -= t.shares_number;
        }
        console.log("Avg. Cost:",totals.cost/totals.shares);
        console.log("Number of Shares:",totals.shares);
    })
    if(totals.cost > 0)
        totals.return = currentQuote / (totals.cost/totals.shares);
    // console.log("Avg cost:",totals.cost/totals.shares);
    // console.log("Return:", totals.return);
    
    return totals;
}

function calculateDailyReturns(transactions, startDate, endDate, quotes){
    //--skip weekend/holidays
    for(let day = startDate; day <= endDate; day.setDate(day.getDate() + 1))
        if(!quotes[dateToString(day).toString()])
            startDate = day;
        else break;

    let todayValue = quotes[dateToString(startDate)]["5. adjusted close"];

    //--get totals from all transactions made before and on start date
    let totals = {shares: 0, cost: 0.0, return: 1.0, profit: 0.0}
    sumTransactionsFromDay(totals, transactions, todayValue, startDate, true)
    

    var assetDailyValues = {};
    for(let day = startDate; day <= endDate; day.setDate(day.getDate() + 1)){
        //--if its weekend/holiday
        if(!quotes[dateToString(day).toString()])
            continue;

        //--get the closed quote of the day
        todayValue = quotes[dateToString(day).toString()]["5. adjusted close"];
        // console.log("-----DAY:", day, "------ daily close:", todayValue);

        //--calculate values considering transactions made on the day
        totals = sumTransactionsFromDay(totals, transactions, todayValue, day, false)
        assetDailyValues[dateToString(day)] = totals;
    }
    console.log("Total Return:", totals.return);
    console.log("Total Shares:", totals.shares);
    console.log("Total Profit:", totals.profit);
    return assetDailyValues;
}

function toDate(d){
    return new Date(`${d[0]}-${d[1]}-${d[2]} 15:00`);
}
function dateToString(d){
    d.setHours(15);
    return dateFormat(d, "yyyy-mm-dd")
}
function getOutputSize(startDate, endDate){
    if( (new Date().getTime() - startDate.getTime()) / (1000 * 3600 * 24) < 100 )
        return "compact";
    return "full";
}

//     var quote = JSON.parse(body);
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

// Use this code if you don't use the http event with the LAMBDA-PROXY integration
// return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
// };
