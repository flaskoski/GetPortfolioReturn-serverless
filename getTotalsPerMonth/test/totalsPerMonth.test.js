const getTotalsPerMonth = require('../getTotalsPerMonth');
const https = require('https');


describe('test', () => {
    const input = require('./input.json');
    const expectedOutput = require('./output.json');

    process.env.DAILY_RETURN_TABLE = "smartinvest-dailyreturn-dev"
    const AWS = require('aws-sdk');
    AWS.config.update({region: 'sa-east-1'});
    // --disable logs
    // console.log = function(){}

    //--tests
    it('asset return values series from 3 specific days', () => {       
        //--mock api calls 

        return getTotalsPerMonth.main(input).then(totals => {
            // console.info(getAssetReturn.saveValues.mock.calls)
            //[0] first call
            //[2] third parameter == time series transactions array
            expect(totals["2020"]["09"].stocks).toEqual(expectedOutput["2020"]["09"].stocks)
        })
    });

    // it('all asset return types from PETR4', () =>{
    //     getAssetReturn.saveValues.mockReturnValueOnce({userId: "flaskoski", assetCode: "PETR4"})
    //     const inputFull = require('./inputTestFull.json');
    //     const expectedOutputFull = require('./outputTestFull.json');
    //     return getAssetReturn.main(inputFull).then(mockedDynamoDBConfirmation => {
    //         //[1] second call
    //         expect(getAssetReturn.saveValues.mock.calls[1][2]).toEqual(expectedOutputFull)
    //     })
    // });
})

