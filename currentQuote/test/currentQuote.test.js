const getQuote = require('../getCurrentQuote');
const input = require('./input.json')

it('Correct asset code returns its last quote values', () => {
    expect.assertions(8)
    return getQuote.main(input).then(data => {
        expect(data).toBeDefined()
        expect(data.code).toBe(input["queryStringParameters"].code)
        expect(data.high).toBeGreaterThan(0.1)
        expect(data.high).toBeLessThan(1000); 
        expect(data.low).toBeLessThanOrEqual(data.high)
        expect(data.currentPrice).toBeLessThanOrEqual(data.high) 
        expect(data.currentPrice).toBeGreaterThanOrEqual(data.low)
        expect(data.change).toBeDefined()
    }) 
});

// test('Invalid asset code returns an error', async () => {
//     input.queryStringParameters.code = 'PETRR4'
    // expect.assertions(1)
    // await expect(() => getQuote.main(input)).rejects.toThrow("Could not get quote from")// + input.queryStringParameters.code)
    // expect(() => getQuote.main(input)).toThrowError("Could not get quote from " + input.queryStringParameters.code)
    
    // expect(msg).toEqual("Could not get quote from " + code)    
    
    // catch(e => {
    //     console.log("chegou: ", e)
    //     expect(e).toBe("Could not get quote from "+input.queryStringParameters.code)
    //     done();
    // })
// });