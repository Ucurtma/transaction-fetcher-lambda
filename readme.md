Transaction fetcher lambda function
==

## Dependencies
* Node (obviously 😒)
* Terraform - to deploy to production
* Yarn/npm
* An aws account to access to dynamodb and deploy
* Private keys for infura and avalanche

First create your `.env` file using the `.env.example`. If you want to run this locally run `npm start` or `yarn start`.

## Deploying to production

In order to install lambda function to the production you need to execute the `build.sh` script. 

This will, 

- Read the environment variables from your `.env` file
- Create a zip package file under `./terraform/build`
- Refresh the lambda function with the zip file.