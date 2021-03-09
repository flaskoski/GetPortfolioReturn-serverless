const https = require('https')
const utils = require('../utils');


exports.main = function(event){
    return new Promise(resolve => {
        const API_KEY = process.env.ALPHA_API_KEY

        utils.checkDefined(event["queryStringParameters"]["code"], "queryparameter.code");
        let code = event["queryStringParameters"]["code"]
        console.log("\'Current quote\' request received for code: " + code)

        let apiFunction = "GLOBAL_QUOTE"
        let url = 'https://www.alphavantage.co/query?function='+apiFunction+'&symbol='+code+'.SA&apikey='+API_KEY
        
        https.get(url, (res) => {
            var body = '';
            res.on('data', function(chunk){
                body += chunk;
            });
            res.on('end', function(){
                let quote = JSON.parse(body)["Global Quote"];
                if(quote && quote["05. price"]){
                    //--calculate returns and save on DB
                    console.log(quote)
                    quote = {
                        "code": code,
                        "open": parseFloat(quote["02. open"]),
                        "high": parseFloat(quote["03. high"]),
                        "low": parseFloat(quote["04. low"]),
                        "currentPrice": parseFloat(quote["05. price"]), 
                        "volume": parseFloat(quote["06. volume"]),
                        "latest trading day": quote["07. latest trading day"],
                        "previousClose": parseFloat(quote["08. previous close"]),
                        "change": parseFloat(quote["09. change"]),
                        "changePercent": quote[ "10. change percent"],
                    }
                    resolve(quote)
                }
                else throw Error("Could not get quote from", code)
            });  
        }).on('error', (e) => {
            throw Error(e)
        })
    })
}

exports.handler = function(event, context, callback) {
    try{
        exports.main(event).then(data =>{
            const response = {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify(data)
            };
            callback(null, response)
        })
    }
    catch(e){
        callback(e)
    }
}