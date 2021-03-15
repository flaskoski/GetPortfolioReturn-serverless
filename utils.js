var dateFormat = require("dateformat");

module.exports= {
    
// Helper function used to validate input
    checkDefined: function(reference, referenceName) {
        if (!reference) {
            throw new Error(`Parameter ${referenceName} is not defined`);
        }
        return reference;
    },

    dateToString: function(d) {
        d.setHours(15);
        return dateFormat(d, "yyyy-mm-dd");
        // return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    },
    arraytoDate: function(d){
        return new Date(`${d[0]}-${d[1]}-${d[2]} 15:00`);
    },

    getFullDate: function(date){
        return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
    },

    getStoredAssetsReturns: function(AWS, assetCode){
        var documentClient = new AWS.DynamoDB.DocumentClient();
        var params = {}
        if(assetCode)
            params = {
                TableName: process.env.DAILY_RETURN_TABLE,
                KeyConditionExpression: '#id = :id AND #code = :code',
                ExpressionAttributeNames: {
                    '#id': 'userId',
                    '#code': 'assetCode'
                },
                ExpressionAttributeValues: {
                    ':id': 'flaskoski',
                    ':code': assetCode
                }
            };
        else
            params = {
                TableName: process.env.DAILY_RETURN_TABLE,
                KeyConditionExpression: '#id = :id',
                ExpressionAttributeNames: {
                    '#id': 'userId'
                },
                ExpressionAttributeValues: {
                ':id': 'flaskoski'
                }
            };
        let returns = []
        return new Promise( (resolve, reject) =>{
            documentClient.query(params, getNextAssetsReturnsPage)

            function getNextAssetsReturnsPage(err, data){
                if (err) reject(err);
                returns = [...returns, ...data.Items]
                if(data.Items) 
                    console.log("returns loaded:" + data.Items.length)
                    
                if(!data.LastEvaluatedKey)
                    resolve(returns)
                else {
                    params.ExclusiveStartKey = data.LastEvaluatedKey
                    documentClient.query(params, getNextAssetsReturnsPage)
                }
            }
        })
    },


    // formatDate: function(date){
    //     if(!date || date.length != 3)
    //         return "";
    //     // 
    //     const dd = (date[2]<10 ? "0"+date[2] : date[2]) 
    //     const mm = (date[1]<10 ? "0"+date[1] : date[1])
    //     const yy = date[0]
    //     return `${dd}-${mm}-${yy}`;
    // }
    
    writeFile: function(data, filename = "output"){
        data = (typeof data == "string"? data : JSON.stringify(data))
        const fs = require('fs');
        fs.writeFile(filename + '.txt', data, function (err) {
            if (err) return console.log(err);
        })
    }
}