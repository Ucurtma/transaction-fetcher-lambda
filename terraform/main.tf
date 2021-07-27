variable "dynamo_access_key"{}
variable "dynamo_secret_access_key"{}
variable "etherscan_key"{}
variable "infura_project_key"{}
variable "eth_network"{}


provider "aws" {
  region = "eu-west-2"
}

terraform {
  backend "s3" {
    bucket = "transaction-fetcher-lambda"
    key    = "terraform/dev/terraform_prod.tfstate"
    region = "eu-west-2"
  }
}

terraform {
  required_version = ">= 0.12"
}

module "transaction-fetcher-lambda" {
  source           = "spring-media/lambda/aws"
  version          = "5.1.0"
  filename         = "${path.module}/build/transaction-fetcher-lambda.zip"
  function_name    = "FetchTransactions"
  handler          = "fetchTransactions.index"
  runtime          = "nodejs14.x"
  source_code_hash = filebase64sha256("${path.module}/build/transaction-fetcher-lambda.zip")
  publish          = true
  timeout          = 60
  memory_size      = 256

  event = {
    type                = "cloudwatch-event"
    schedule_expression = "rate(2 hours)"
  }

  environment = {
    variables = {
      DYNAMO_ACCESS_KEY_ID      = var.dynamo_access_key
      DYNAMO_SECRET_ACCESS_KEY  = var.dynamo_secret_access_key
      ETHERSCAN_KEY             = var.etherscan_key
      INFURA_PROJECT_KEY        = var.infura_project_key
      ETH_NETWORK               = var.eth_network
    }
  }
}

