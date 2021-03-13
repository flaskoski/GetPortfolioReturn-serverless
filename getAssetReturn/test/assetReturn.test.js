const getAssetReturn = require('../getAssetReturn');
const https = require('https');


describe('test', () => {
    const input = require('./input.json');
    const expectedOutput = require('./output.json');
    const timeSeriesInput = require('./output_api_timeSeriesQuote.json')
    //--mock env vars
    process.env.PERCENTAGE_FEE = 0.0003
    process.env.PERCENTAGE_TAX = 0.00005

    //--mock api calls
    getAssetReturn.saveValues = jest.fn()
    getAssetReturn.requestTimeSeries = jest.fn()

    // --disable logs
    console.log = function(){}

    beforeEach(() => {
        getAssetReturn.requestTimeSeries.mockReturnValueOnce(new Promise(resolve => {return resolve(timeSeriesInput)}))
    });

    //--tests
    it('asset return values series from 3 specific days', () => {       
        //--mock api calls 
        getAssetReturn.saveValues.mockReturnValueOnce({userId: "flaskoski", assetCode: "BBAS3"})

        return getAssetReturn.main(input).then(mockedDynamoDBConfirmation => {
            // console.info(getAssetReturn.saveValues.mock.calls)
            //[0] first call
            //[2] third parameter == time series transactions array
            expect(getAssetReturn.saveValues.mock.calls[0][2]["2020-11-04"]).toEqual(expectedOutput["2020-11-04"])
            expect(getAssetReturn.saveValues.mock.calls[0][2]["2021-01-06"]).toEqual(expectedOutput["2021-01-06"])
            expect(getAssetReturn.saveValues.mock.calls[0][2]["2021-03-05"]).toEqual(expectedOutput["2021-03-05"])
        })
    });

    it('all asset return types from PETR4', () =>{
        getAssetReturn.saveValues.mockReturnValueOnce({userId: "flaskoski", assetCode: "PETR4"})
        const inputFull = require('./inputTestFull.json');
        const expectedOutputFull = require('./outputTestFull.json');
        return getAssetReturn.main(inputFull).then(mockedDynamoDBConfirmation => {
            //[1] second call
            expect(getAssetReturn.saveValues.mock.calls[1][2]).toEqual(expectedOutputFull)
        })
    });
})

