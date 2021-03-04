const https = require('https')
// const lambdaLib = require('@aws-sdk/client-dynamodb');
const AWS = require('aws-sdk');
const utils = require('../utils');

exports.main =  function(event, context, callback) {
    const API_KEY = process.env.ALPHA_API_KEY
    // for(let key in event)
    //     console.info(`event[${key}]: ${event[key]}`);
    utils.checkDefined(event["body"], "body");
    // console.info(event["body"]);
    body = JSON.parse(event["body"]);
    // let body = event["body"];
    utils.checkDefined(body["transactions"], "transactions");
    utils.checkDefined(body["startDate"], "startDate");
    utils.checkDefined(body["endDate"], "endDate");
    // console.log("startDate:", body["startDate"]);
    // console.log("endDate:", body["endDate"]);
    console.log("Number of Transactions:", body["transactions"].length)
    const transactions = body["transactions"];
    const dates={
        start: new Date(body["startDate"] + " 15:00"),
        end: new Date(body["endDate"] + " 15:00")}
    console.log("dates:"); console.log(dates);

    //Load asset returns and call calculate function
    utils.getStoredAssetsReturns(AWS, getReturnsCallback)

    function getReturnsCallback(err, data) {
        if (err) callback(Error(err));

        console.log(data.Items.length)
        let totals = []
        try{totals = calculateTotalsPerMonth(data.Items, transactions, dates)}
        catch(e){callback(e)}

        var response = {
            statusCode: 200,
            headers: {'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true},
            body: JSON.stringify(
                totals
            ),
        };
        callback(null, response);
    }

}


//-- Calculate daily returns, cost, profit, number of shares, dividends and JCP (interest on equity capital)
function calculateTotalsPerMonth(returns, transactions, dates){
    console.log(`number of returns: ${returns.length} `)
    if(!returns.length) throw Error("No assets returns found!")
    console.log(`number of transactions: ${transactions.length} `)
    if(!transactions.length) throw Error("No transactions found!")
    console.log(dates)
    //--sort transactins by 
    transactions.map(t => { t.date = utils.arraytoDate(t.date); return t})
    transactions.sort((a, b) => a.date.getTime()-b.date.getTime() )
    console.log(transactions)

    let monthLastDays = getLastDaysOfMonth(returns, dates)
    
    totalsPerMonth = {}
    lastMonthValues = {}
    //--profits
    monthLastDays.forEach((lastDay, i) =>{
        let year = lastDay.split("-")[0];
        let month= lastDay.split("-")[1];
        if(!totalsPerMonth[year])
            totalsPerMonth[year] = {}
        totalsPerMonth[year][month] = { stocks:{ sales: 0.0,profit: 0.0, fees: 0.0}, reit: {sales: 0.0, profit: 0.0, fees: 0.0}}
        returns.forEach(r => {
            if(!r.assetValues[lastDay]) console.info(`Asset ${r.assetCode} does not have totals for day ${lastDay}.`)
            else{
                let assetType = r.assetType.toLowerCase();
                //if its the first cycle (lastMonth value not defined yet) 
                if(lastMonthValues[r.assetCode] != undefined){
                    totalsPerMonth[year][month][assetType].profit += r.assetValues[lastDay].profit - lastMonthValues[r.assetCode].profit;
                    totalsPerMonth[year][month][assetType].fees += r.assetValues[lastDay].fees - lastMonthValues[r.assetCode].fees; 
                    
                    if(lastMonthValues[r.assetCode].profit !=  r.assetValues[lastDay].profit){
                        console.log(`${assetType}-${r.assetCode} Profit:${r.assetValues[lastDay].profit - lastMonthValues[r.assetCode].profit}, Fees: ${r.assetValues[lastDay].fees}`)
                    }
                }
                else{ 
                    totalsPerMonth[year][month][assetType].profit = r.assetValues[lastDay].profit
                    totalsPerMonth[year][month][assetType].fees = r.assetValues[lastDay].fees
                    if(r.assetValues[lastDay].profit > 0 ){ 
                        console.log(`${assetType}-${r.assetCode} Profit:${r.assetValues[lastDay].profit}, Fees: ${r.assetValues[lastDay].fees}`)
                    }
                }   
                lastMonthValues[r.assetCode] = {profit: r.assetValues[lastDay].profit, fees: r.assetValues[lastDay].fees }
            }
        })
        console.log(`${year}-${month}: Stocks: ${JSON.stringify(totalsPerMonth[year][month]["stocks"])}, REIT: ${JSON.stringify(totalsPerMonth[year][month]["reit"])}`)
    })
    //--sales
    transactions.filter(t => t.type.toUpperCase() == "SELL" && 
            t.date.getTime() >= dates.start && t.date.getTime() <= dates.end ).forEach(t =>{
        let assetType = returns.find(a => a.assetCode == t.asset).assetType.toLowerCase(); 
        
        totalsPerMonth[t.date.getFullYear()][`${t.date.getMonth()+1 < 10? "0": ""}${t.date.getMonth()+1}`][assetType].sales += t.price * t.shares_number;
        console.log(`${t.asset} - R$${t.price * t.shares_number}. Total[${t.date.getFullYear()}][${t.date.getMonth()+1}].${assetType}=${totalsPerMonth[t.date.getFullYear()][`${t.date.getMonth()+1 < 10? "0": ""}${t.date.getMonth()+1}`][assetType].sales}`)
    })

    return totalsPerMonth;
}

function getLastDaysOfMonth(returns, dates){
    let monthLastDays = []
    let date = new Date(`${dates.start.getFullYear()}-${dates.start.getMonth()+1}-01 15:00`)
    for(date; date.getTime() <= dates.end.getTime(); date.setMonth(date.getMonth()+1)){
        let lastDay = null
        // console.log(`${date.getMonth()+1}-${date.getFullYear()}`)
        for(day= new Date(date); day.getMonth() == date.getMonth(); day.setDate(day.getDate()+1) )
            if(returns[0].assetValues[utils.dateToString(day)] && day.getTime() <= dates.end.getTime())
                lastDay = utils.dateToString(day)
        if(lastDay)
            monthLastDays.push(lastDay)
    }
    console.log(monthLastDays)
    return monthLastDays;
}