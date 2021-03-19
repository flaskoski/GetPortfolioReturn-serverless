# GetPortfolioReturn-serverless

## AWS Products Used

* Lambda
* CloudFormation
* SSM Parameter Store
* IAM
* DynamoDB
* API Gateway
* Cloudwatch

## Functions

### Main 
Get the total return of the portfolio of investments based on the assets returns saved on dynamoDB by the `getAssetReturn` function for a specific user

#### Body Parameters
* username
* startDate
* endDate

#### Return

Returns an array with `{cost, profit, return}` for each day in the period between `startDate` and `endDate`.

### getassetReturn
Get the return of a specific asset considering the given `transactions` (transaction model on the [Transactions Project](https://github.com/flaskoski/Transactions))

#### Body Parameters
* username
* code: Asset's code
* startDate
* endDate
* transactions: array of transactions 

#### Return

Returns an array with `{cost, shares, profit, return}` for each day in the period between `startDate` and `endDate`.

### getTotalsPerMonth
Get the total sales, profit and taxes of your assets grouped by asset type.

#### Body Parameters
* username
* startDate
* endDate
* transactions: array of transactions 

#### Return
Returns an array with `{sales, profit, taxes}` grouped by month in the period between `startDate` and `endDate` and split by the asset types `"Stocks" | "REIT" | "BDR"`.


### getPortfolioPosition
Get the return of the portfolio 

#### Query Parameters
* username
* year

#### Return
Returns an array with portfolio situation by the end of the last working day of the year. The information include `{totalCost, shares, averagePrice, return}` for each different asset in the portfolio of `username`.

## Usage notes

### Function Authentication

Must provide `x-api-key` and `Authentication` headers 

### Dependencies

SSM parameter store variables created by the [terraform infrastructure](https://github.com/flaskoski/SmartInvest_infrastructure):

* `tf-aws_account_id`: your aws account id
* `tf-smartinvest_cognito_pool_id`: cognito user pool id
* `ALPHA_API_KEY`: alphavantage api key

## Smart Invest Serverless Infrastructure diagram

![infrastructure diagram](https://github.com/flaskoski/GetPortfolioReturn-serverless/blob/master/images/diagram.v2.png)