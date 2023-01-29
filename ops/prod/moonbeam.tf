
locals {
  moonbeam_mainnet_rpc_0    = "https://moonbeam.public.blastapi.io"
  moonbeam_mainnet_rpc_1    = "https://rpc.ankr.com/moonbeam"
  moonbeam_mainnet_chain_id = "1284"
}


module "moonbeam_mainnet_oracle_price_change_verifier" {
  source              = "../modules/lambda"
  ecr_repository_name = "oracles-monitor"
  docker_image_tag    = var.bots_image_tag
  container_family    = "price-change-verifier"
  environment         = "mainnet"
  chain_id            = local.moonbeam_mainnet_chain_id
  container_env_vars = merge(
    local.oracle_price_change_verifier_lambda_variables,
    { WEB3_HTTP_PROVIDER_URL = local.moonbeam_mainnet_rpc_0 }
  )
  schedule_expression = "rate(2 minutes)"
}


module "moonbeam_mainnet_oracle_feed_verifier" {
  source              = "../modules/lambda"
  ecr_repository_name = "oracles-monitor"
  docker_image_tag    = var.bots_image_tag
  container_family    = "feed-verifier"
  environment         = "mainnet"
  chain_id            = local.moonbeam_mainnet_chain_id
  container_env_vars = merge(
    local.oracle_feed_verifier_lambda_variables,
    { WEB3_HTTP_PROVIDER_URL = local.moonbeam_mainnet_rpc_1 }
  )
  schedule_expression = "rate(3 hours)"
}

module "moonbeam_mainnet_oracle_price_verifier" {
  source              = "../modules/lambda"
  ecr_repository_name = "oracles-monitor"
  docker_image_tag    = var.bots_image_tag
  container_family    = "price-verifier"
  environment         = "mainnet"
  chain_id            = local.moonbeam_mainnet_chain_id
  container_env_vars = merge(
    local.oracle_price_verifier_lambda_variables,
    { WEB3_HTTP_PROVIDER_URL = local.moonbeam_mainnet_rpc_1 }
  )
  schedule_expression = "rate(5 minutes)"
}

module "moonbeam_mainnet_liquidation_cron" {
  source                  = "../modules/cron"
  service_security_groups = module.network.ecs_task_sg
  execution_role_arn      = module.iam.execution_role_arn
  cluster_id              = module.ecs.ecs_cluster_id
  docker_image            = "ghcr.io/midas-protocol/liquidator:${var.bots_image_tag}"
  region                  = var.region
  environment             = "mainnet"
  container_family        = "liquidation-cron"
  chain_id                = local.moonbeam_mainnet_chain_id
  cpu                     = 256
  memory                  = 512
  instance_count          = 1
  subnets                 = module.network.public_subnets
  provider_urls           = [local.moonbeam_mainnet_rpc_1]
  runtime_env_vars = concat(local.liquidation_variables, [
    { name = "TARGET_CHAIN_ID", value = local.moonbeam_mainnet_chain_id },
  ])
  ecs_cluster_arn     = module.ecs.ecs_cluster_arn
  schedule_expression = "rate(2 minutes)"
}
