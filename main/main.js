'use strict';

const AWS = require('aws-sdk');
const utils = require('../utils');

module.exports.handler = function(event, context, callback){
    try{
        exports.main(event).then(allTotals => {
            var response = {
                statusCode: 200,
                headers: {'Access-Control-Allow-Origin': '*'},
                body: JSON.stringify(
                    allTotals
                ),
            };
            // console.log(response)
            callback(null, response);
        })
    }catch(exception){
        // var response = {
        //     statusCode: 400,
        //     headers: {'Access-Control-Allow-Origin': '*'},
        //     body: JSON.stringify(exception),
        // };
        callback(exception)
    }

}

function checkInputs(event){
    // console.log(event)
    utils.checkDefined(event["body"], "body");
    let body = JSON.parse(event["body"])
    // event = event["body"]
    utils.checkDefined(body["startDate"], "startDate");
    utils.checkDefined(body["endDate"], "endDate");
    console.log("startDate:", body["startDate"]);
    console.log("endDate:", body["endDate"]);
    return body;
}


exports.main = function(event){
    let body = checkInputs(event)
    const dates =  {
        start: new Date(body["startDate"] + " 15:00"),
        end: new Date(body["endDate"] + " 15:00")
    }
    console.log(dates)
    return exports.getValues(dates)
            .then(assetsReturns => getTotalReturn(assetsReturns, dates) )
};

exports.getValues = function(dates){
    var documentClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: process.env.DAILY_RETURN_TABLE,
        KeyConditionExpression: '#id = :id',
        ExpressionAttributeNames: {
            '#id': 'userId'
        },
        ExpressionAttributeValues: {
          ':id': 'flaskoski'
        }
    };
    return new Promise( (resolve, reject) => 
        documentClient.query(params, function(err, data) {
            if (err || typeof data.Items == undefined) 
                reject(Error("<Get asset Returns from table> "+ err));  
            
            console.log(`${data.Items.length} asset returns loaded! typeof: ${typeof data.Items}`);
            resolve(data.Items)
        })
    )
}
function getTotalReturn(returns, dates){
    let allTotals = {}
    for(let day = dates.start; day <= dates.end; day.setDate(day.getDate() + 1)){
        if(day.getDay() == 0 || day.getDay()==6) continue;
        let dailyTotals = {cost: 0.0, return: 0.0, profit: 0.0}
        // console.log(`day: ${day}`)
        let foundOne = false
        returns.forEach(r => {
            let assetValues = r.assetValues[utils.dateToString(day)]
            if(assetValues){
                dailyTotals.cost += assetValues.cost;
                dailyTotals.profit += assetValues.profit;
                dailyTotals.return += assetValues.return * assetValues.cost;
                foundOne = true
            }
            else if(foundOne) console.info("Values of", r.assetCode, "not available on day", utils.dateToString(day))
        })
        if(dailyTotals.cost > 0){
            dailyTotals.return /= dailyTotals.cost;
            allTotals[utils.dateToString(day)] = {...dailyTotals};
            // console.log("return on", utils.dateToString(day), ":", allTotals[utils.dateToString(day)].return)
        }
    }
    return allTotals;
}

