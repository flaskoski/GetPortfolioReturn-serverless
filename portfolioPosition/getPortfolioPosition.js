const utils = require('../utils');
const AWS = require('aws-sdk');

var PERCENTAGE_FEE = null
exports.main = function(event){
    PERCENTAGE_FEE = process.env.PERCENTAGE_FEE

    utils.checkDefined(event["queryStringParameters"]["year"], "queryparameter.code");
    utils.checkDefined(event["queryStringParameters"]["username"], "queryparameter.username");
    let year = event["queryStringParameters"]["year"]
    const username = event["queryStringParameters"]["username"]
    console.log("\'Portfolio Position\' request received for year: " + year)
    if(!parseInt(year) || parseInt(year) > new Date().getFullYear() || parseInt(year) < 2000 )
        throw new Error("Invalid year!")
    //Load assets returns and call getPortfolioPosition
    return utils.getStoredAssetsReturns(AWS, username).then(returns => {
        return getPortfolioPosition(year, returns)
    })  
}

exports.handler = function(event, context, callback) {
    exports.main(event).then(data =>{
        const response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(data)
        };
        callback(null, response)
    }).catch(e => callback(e) )
}

function getPortfolioPosition(year, returns){
    let lastDayOfYear = `${year}-12-30`
    let portfolio = {} 
    returns.forEach(r => {
        if(r.assetValues[lastDayOfYear] && r.assetValues[lastDayOfYear].shares > 0){
            console.log(PERCENTAGE_FEE)
            portfolio[r.assetCode] = {
                shares: r.assetValues[lastDayOfYear].shares,
                cost: r.assetValues[lastDayOfYear].cost + r.assetValues[lastDayOfYear].cost*PERCENTAGE_FEE  ,
                averagePrice: (r.assetValues[lastDayOfYear].cost + r.assetValues[lastDayOfYear].cost*PERCENTAGE_FEE ) / r.assetValues[lastDayOfYear].shares,
                return: r.assetValues[lastDayOfYear].return
            }
        }
    })
    return portfolio;
}