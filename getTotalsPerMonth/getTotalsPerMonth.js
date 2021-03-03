const https = require('https')
var dateFormat = require("dateformat");
// const lambdaLib = require('@aws-sdk/client-dynamodb');
const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();


//-- Helper function used to validate input
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
    checkDefined(event["body"], "body");
    console.info(event);
    body = JSON.parse(event["body"]);
    // body = event["body"];
    console.info(`body.code: ${body["code"]}`);
    checkDefined(body["code"], "code");
    checkDefined(body["transactions"], "transactions");
    checkDefined(body["startDate"], "startDate");
    checkDefined(body["endDate"], "endDate");
    console.log("startDate:", body["startDate"]);
    console.log("endDate:", body["endDate"]);
    console.log("Number Transactions:", body["transactions"].length)
    code = body["code"];
    const transactions = body["transactions"];
    const startDate = new Date(body["startDate"] + " 15:00");
    const endDate = new Date(body["endDate"] + " 15:00");
    
    //--get outputsize for the API request to get the daily quotes
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
                //--calculate returns and save on DB
                let item = saveValues(code, callback, 
                    calculateDailyReturns(transactions, startDate, endDate, quotes) )
                const response = {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Credentials': true,
                      },
                    body: JSON.stringify(item)
                };
                callback(null, response)
            }
            else callback(Error("Could not get quotes from", code))
        });  
    }).on('error', (e) => {
        callback(Error(e))
    })
}

//-- Calculate daily returns, cost, profit, number of shares, dividends and JCP (interest on equity capital)
function calculateDailyReturns(transactions, startDate, endDate, quotes){
    //--skip weekend/holidays
    for(let day = startDate; day <= endDate; day.setDate(day.getDate() + 1))
        if(!quotes[dateToString(day)])
            startDate = day;
        else break;

    //--get first value
    let todayValue = quotes[dateToString(startDate)]["5. adjusted close"];

    //--get totals from all transactions made before and on start date
    let totals = {shares: 0, cost: 0.0, return: 1.0, profit: 0.0, dividends: 0.0, jcp: 0.0}
    sumTransactionsFromDay(totals, transactions, todayValue, startDate, true)
    
    var assetDailyValues = {};
    for(let day = startDate ; day <= endDate; day.setDate(day.getDate() + 1)){
        //--if its weekend/holiday
        if(!quotes[dateToString(day)])
            continue;

        //--get the closed quote of the day
        todayValue = quotes[dateToString(day)]["5. adjusted close"];
        // console.log("-----DAY:", day, "------ daily close:", todayValue);

        //--calculate values considering transactions made on the day
        totals = sumTransactionsFromDay(totals, transactions, todayValue, day, false)
        assetDailyValues[dateToString(day)] = {...totals};
    }
    console.log("Total Return:", totals.return);
    console.log("Total Shares:", totals.shares);
    console.log("Total Profit:", totals.profit);
    console.log("Total Dividends:", totals.dividends);
    console.log("Total JCP:", totals.jcp);
    return assetDailyValues;
}

//--get transactions and returns on the day
function sumTransactionsFromDay(totals, transactions, currentQuote, date, beforeDate){
    let transactionsFromDay = getTransactionsFromDay(transactions, date, beforeDate)
    transactionsFromDay.forEach(t =>{
        console.log(`New transaction: ${t.date} ${t.type} ${(!isDividends(t)? t.shares_number+" " : "")}${t.asset} $${t.price}`)
        if(t.type.toUpperCase() == "BUY"){
            totals.shares += t.shares_number;
            totals.cost += t.price * t.shares_number;
        }else if(t.type.toUpperCase() == "SELL"){
            let soldSharesCost = t.shares_number * (totals.cost)/(totals.shares);
            totals.profit += t.price * t.shares_number - soldSharesCost;
            totals.cost -= soldSharesCost;
            totals.shares -= t.shares_number;
        }else{
            if(t.type.toUpperCase() == "DIVIDEND") totals.dividends += t.price
            else totals.jcp += t.price
        }
        // if(totals.shares > 0) console.log("Avg. Cost:",totals.cost/totals.shares)
        // console.log("Number of Shares:",totals.shares)
    })
    if(totals.cost > 0)
        totals.return = currentQuote / (totals.cost/totals.shares);
    else totals.return = 1;
    
    return totals;
}

//--return only transactions from the day (or until the day if beforDate is true)
function getTransactionsFromDay(transactions, date, beforeDate){
    return transactions.filter(t => t.asset == code && 
        (beforeDate? toDate(t.date).getTime() < date.getTime() : toDate(t.date).getTime() == date.getTime()) )
        .sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime() )
}

function saveValues(code, callback, values){
    //CREATE params
    //const timestamp = new Date().getTime();
    // const params = {
    //     TableName: process.env.DAILY_RETURN_TABLE,
    //     Item: {
    //         id: uuid(),
    //         assetCode: code,
    //         assetValues: values,
    //         createdAt: timestamp,
    //         updatedAt: timestamp,
    //     },
    // };

    const params = {
        TableName: process.env.DAILY_RETURN_TABLE,
        Key: {
            'id': 'flaskoski',            
            'assetCode': code
        },
        ExpressionAttributeNames: {
            '#value': 'assetValues',
        },
        ExpressionAttributeValues: {
            ':val': values,
            ':updatedAt':  new Date()
        },
        UpdateExpression: 'SET #value = :val, updatedAt = :updatedAt',
        ReturnValues: 'ALL_NEW',
      };

    // create function
    // dynamoDb.put(params, (error) => {
    dynamoDb.update(params, (error, result) => {
        // handle potential errors
        if (error) {
            console.error(error);
            callback(null, {
                statusCode: error.statusCode || 501,
                headers: { 'Content-Type': 'text/plain' ,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: 'Couldn\'t save the totals for asset '+ code,
            });
            return;
        }
        return result.Attributes;
    })
    // return params.Item;
    return params.Key;
}

function isDividends(transaction){
    return transaction.type.toUpperCase() == "DIVIDEND" || transaction.type.toUpperCase() == "JCP" 
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
