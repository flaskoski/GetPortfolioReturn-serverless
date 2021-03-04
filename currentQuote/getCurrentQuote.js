const https = require('https')
const utils = require('../utils');

exports.main =  function(event, context, callback) {
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
            if(quote){
                //--calculate returns and save on DB
                console.log(quote)
                quote = {
                    "code": code,
                    "open": quote["02. open"],
                    "high": quote["03. high"],
                    "low": quote["04. low"],
                    "currentPrice": quote["05. price"], 
                    "volume": quote["06. volume"],
                    "latest trading day":quote["07. latest trading day"],
                    "previousClose":quote["08. previous close"],
                    "change": quote["09. change"],
                    "changePercent": quote[ "10. change percent"],
                }
                const response = {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                      },
                    body: JSON.stringify(quote)
                };
                callback(null, response)
            }
            else callback(Error("Could not get quote from", code))
        });  
    }).on('error', (e) => {
        callback(Error(e))
    })
}