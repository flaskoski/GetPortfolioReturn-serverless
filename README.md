# GetPortfolioReturn-serverless

## AWS Products Used

* Lambda
* CloudFormation
* SSM Parameter Store
* IAM
* DynamoDB
* API Gateway

## Functions

### Main 

Get the total return of the portfolio of investments found in the DynamoDB table for a specific user

#### Parameters
* startDate
* endDate

#### Return

Returns an array with `{cost, profit, return}` for each day in the period between `startDate` and `endDate`.

### getassetReturn

Get the return of a specific asset considering the given `transactions`

#### Parameters

* code: Asset's code
* startDate
* endDate
* transactions: array of transactions 

#### Return

Returns an array with `{cost, shares, profit, return}` for each day in the period between `startDate` and `endDate`.