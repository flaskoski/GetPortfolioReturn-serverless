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
    let totals = { stocks:{ sales: 0.0,profit: 0.0}, 
                   reit: {sales: 0.0, profit: 0.0}}
    totalsPerMonth = {}
    lastMonthProfit = {}
    //--profits
    monthLastDays.forEach((lastDay, i) =>{
        if(!totalsPerMonth[lastDay.split("-")[0]])
            totalsPerMonth[lastDay.split("-")[0]] = {}
        totalsPerMonth[lastDay.split("-")[0]][lastDay.split("-")[1]] = { stocks:{ sales: 0.0,profit: 0.0}, reit: {sales: 0.0, profit: 0.0}}
        returns.forEach(r => {
            if(!r.assetValues[lastDay]) console.info(`Asset ${r.assetCode} does not have totals for day ${lastDay}.`)
            else{
                if(lastMonthProfit[r.assetCode] != undefined){
                    totalsPerMonth[lastDay.split("-")[0]][lastDay.split("-")[1]][r.assetType.toLowerCase()].profit += r.assetValues[lastDay].profit - lastMonthProfit[r.assetCode];
                    if(lastMonthProfit[r.assetCode] != r.assetValues[lastDay].profit){
                        console.log(`${r.assetType.toLowerCase()}-${r.assetCode}`); console.log(r.assetValues[lastDay].profit - lastMonthProfit[r.assetCode])
                    }
                }
                else{ 
                    totalsPerMonth[lastDay.split("-")[0]][lastDay.split("-")[1]][r.assetType.toLowerCase()].profit = r.assetValues[lastDay].profit
                    if(r.assetValues[lastDay].profit > 0 ){ 
                        console.log(`${r.assetType.toLowerCase()}-${r.assetCode}`); console.log(r.assetValues[lastDay].profit)
                    }
                }   
                lastMonthProfit[r.assetCode] = r.assetValues[lastDay].profit
            }
        })
        console.log(`${lastDay.split("-")[0]}-${lastDay.split("-")[1]}: Stocks: ${JSON.stringify(totalsPerMonth[lastDay.split("-")[0]][lastDay.split("-")[1]]["stocks"])}, REIT: ${JSON.stringify(totalsPerMonth[lastDay.split("-")[0]][lastDay.split("-")[1]]["reit"])}`)
    })
    //--sales
    transactions.filter(t => t.type.toUpperCase() == "SELL" && 
            t.date.getTime() >= dates.start && t.date.getTime() <= dates.end ).forEach(t =>{
        let assetType = returns.find(a => a.assetCode == t.asset).assetType.toLowerCase(); 
        totalsPerMonth[t.date.getFullYear()][`${t.date.getMonth()+1 < 10? "0": ""}${t.date.getMonth()+1}`][assetType].sales += t.price * t.shares_number;
        console.log(`${t.asset} - R$${t.price * t.shares_number}. Total[${t.date.getFullYear()}][${t.date.getMonth()+1}].${assetType}=${totalsPerMonth[t.date.getFullYear()][`${t.date.getMonth()+1 < 10? "0": ""}${t.date.getMonth()+1}`][assetType].sales}`)
    })

    return totalsPerMonth;

    

    // let totals = {shares: 0, cost: 0.0, return: 1.0, profit: 0.0, dividends: 0.0, jcp: 0.0}

    //sum profits of each type assets within a month
    //sum costs of SELL actions of stocks type within a month

    for(let day = dates.start ; day <= dates.end; day.setDate(day.getDate() + 1)){
        sumTransactionsFromDay(totals, transactions, day, false)
    }
    // transactions.forEach(transaction => {

    // })
    //     if(!quotes[dateToString(day)])
    //         startDate = day;
    //     else break;

    // //--get first value
    // let todayValue = quotes[dateToString(startDate)]["5. adjusted close"];

    // //--get totals from all transactions made before and on start date
    // let totals = {shares: 0, cost: 0.0, return: 1.0, profit: 0.0, dividends: 0.0, jcp: 0.0}
    
    
    // var assetDailyValues = {};
    // for(let day = startDate ; day <= endDate; day.setDate(day.getDate() + 1)){
    //     //--if its weekend/holiday
    //     if(!quotes[dateToString(day)])
    //         continue;

    //     //--get the closed quote of the day
    //     todayValue = quotes[dateToString(day)]["5. adjusted close"];
    //     // console.log("-----DAY:", day, "------ daily close:", todayValue);

    //     //--calculate values considering transactions made on the day
    //     totals = sumTransactionsFromDay(totals, transactions, todayValue, day, false)
    //     assetDailyValues[dateToString(day)] = {...totals};
    // }
    // console.log("Total Return:", totals.return);
    // console.log("Total Shares:", totals.shares);
    // console.log("Total Profit:", totals.profit);
    // console.log("Total Dividends:", totals.dividends);
    // console.log("Total JCP:", totals.jcp);
    // return assetDailyValues;
    
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

//--get transactions and returns on the day
function sumTransactionsFromDay(totals, transactions, date, beforeDate){
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
    return transactions.filter(t => (beforeDate? t.date.getTime() < date.getTime() : t.date.getTime() == date.getTime()) )
}


function isDividends(transaction){
    return transaction.type.toUpperCase() == "DIVIDEND" || transaction.type.toUpperCase() == "JCP" 
}

function toDate(d){
    return new Date(`${d[0]}-${d[1]}-${d[2]} 15:00`);
}