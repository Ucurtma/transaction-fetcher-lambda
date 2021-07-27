#!/usr/bin/env bash

export $(cat .env | xargs)

printf "\033[1;33m[1/3] Creating packages for Lambda \033[0m\n"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

printf "\033[1;35m> Preparing the lambda package \033[0m\n"
mkdir ./terraform/build
zip -x "*.git*" -r ./terraform/build/transaction-fetcher-lambda.zip * -x "*terraform*" -x "*.tf" -qq

printf "\033[1;33m[2/3] Deploying on AWS\033[0m\n"
cd "terraform/"
terraform init
export TF_VAR_dynamo_access_key=${AWS_ACCESS_KEY_ID}
export TF_VAR_dynamo_secret_access_key=${AWS_SECRET_ACCESS_KEY}
export TF_VAR_eth_network=mainnet
export TF_VAR_etherscan_key=${ETHERSCAN_KEY}
export TF_VAR_infura_project_key=${INFURA_PROJECT_KEY}
terraform apply -auto-approve
                
cd ${SCRIPT_DIR}
rm -rf ./terraform/build