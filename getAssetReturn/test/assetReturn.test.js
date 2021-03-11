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
    getAssetReturn.requestTimeSeries = jest.fn()
    getAssetReturn.requestTimeSeries.mockReturnValueOnce(new Promise(resolve => {return resolve(timeSeriesInput)}))
    getAssetReturn.saveValues = jest.fn()
    getAssetReturn.saveValues.mockReturnValueOnce({userId: "flaskoski", assetCode: "BBAS3"})
    
    //--disable logs
    console.log = function(){}

    //--tests
    it('should return the asset return values series', () => {
        return getAssetReturn.main(input).then(mockedConfirmation => {
            expect(getAssetReturn.saveValues.mock.calls[0][1]["2020-11-04"]).toEqual(expectedOutput["2020-11-04"])
            expect(getAssetReturn.saveValues.mock.calls[0][1]["2021-01-06"]).toEqual(expectedOutput["2021-01-06"])
            expect(getAssetReturn.saveValues.mock.calls[0][1]["2021-03-05"]).toEqual(expectedOutput["2021-03-05"])
        })
    })
})

