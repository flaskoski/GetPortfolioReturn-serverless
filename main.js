'use strict';

const AWS = require('aws-sdk');
const utils = require('utils');

module.exports.main = function(event, context, callback){

    try{
        utils.checkDefined(event["body"], "body");
        event = JSON.parse(event["body"])
        utils.checkDefined(event["startDate"], "startDate");
        utils.checkDefined(event["endDate"], "endDate");
        console.log("startDate:", event["startDate"]);
        console.log("endDate:", event["endDate"]);
        const dates =  {
            start: new Date(event["startDate"] + " 15:00"),
            end: new Date(event["endDate"] + " 15:00")
        }
        getValues(callback, dates)
   
    }catch(exception){
        var response = {
            statusCode: 400,
            headers: {'Access-Control-Allow-Origin': '*'},
            body: JSON.stringify(exception),
        };
        callback(null, response);
    }
};

function getValues(callback, dates){
    var documentClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: process.env.DAILY_RETURN_TABLE,
        KeyConditionExpression: '#id = :id',
        ExpressionAttributeNames: {
            '#id': 'id'
        },
        ExpressionAttributeValues: {
          ':id': 'flaskoski'
        }
    };
      
      
    documentClient.query(params, function(err, data) {
        if (err) callback(Error(err));
        
        console.log(data);
        var allTotals = getTotalReturn(data.Items, dates)
        // if(typeof allTotals === "string" )
        //     callback(Error(allTotals));

        var response = {
            statusCode: 200,
            headers: {'Access-Control-Allow-Origin': '*'},
            body: JSON.stringify(
                allTotals
            ),
        };
        callback(null, response);
    });
}
function getTotalReturn(returns, dates){
    let allTotals = {}
    for(let day = dates.start; day <= dates.end; day.setDate(day.getDate() + 1)){
        let dailyTotals = {cost: 0.0, return: 0.0, profit: 0.0}
        returns.forEach(r => {
            let assetValues = r.assetValues[utils.dateToString(day)]
            if(assetValues){
                dailyTotals.cost += assetValues.cost;
                dailyTotals.profit += assetValues.profit;
                dailyTotals.return += assetValues.return * assetValues.cost;
            }
            else console.info("Values of", r.assetCode, "not available on day", utils.dateToString(day))
        })
        if(dailyTotals.cost > 0){
            dailyTotals.return /= dailyTotals.cost;
            allTotals[utils.dateToString(day)] = {...dailyTotals};
            console.info("return on", utils.dateToString(day), ":", allTotals[utils.dateToString(day)].return)
        }
    }
    return allTotals;
}
