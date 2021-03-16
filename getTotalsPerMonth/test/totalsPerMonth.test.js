const getTotalsPerMonth = require('../getTotalsPerMonth');
const https = require('https');


describe('test', () => {
    const input = require('./input.json');
    const expectedOutput = require('./output.json');

    process.env.DAILY_RETURN_TABLE = "smartinvest-dailyreturn-dev"
    const AWS = require('aws-sdk');
    AWS.config.update({region: 'sa-east-1'});
    // --disable logs
    console.log = function(){}
    console.info = function(){}
    jest.setTimeout(10000);
    //--tests
    it('asset return values series from 3 specific days', () => {
        return getTotalsPerMonth.main(input).then(totals => {
            expect(totals["2020"]["09"].stocks).toEqual(expectedOutput["2020"]["09"].stocks)
        })
    });
})

