


locals {
  polygon_mainnet_rpc_0    = var.chainstack_polygon_rpc_url
  polygon_mainnet_rpc_1    = "https://polygon-rpc.com/"
  polygon_mainnet_chain_id = "137"


}

module "polygon_mainnet_oracle_price_change_verifier" {
  source              = "../modules/lambda"
  ecr_repository_name = "oracles-monitor"
  docker_image_tag    = var.oracles_monitor_image_tag
  container_family    = "price-change-verifier"
  environment         = "mainnet"
  chain_id            = local.polygon_mainnet_chain_id
  container_env_vars = merge(
    local.oracle_price_change_verifier_lambda_variables,
    { WEB3_HTTP_PROVIDER_URL = local.polygon_mainnet_rpc_1 }
  )
  schedule_expression = "rate(2 minutes)"
}

module "polygon_mainnet_oracle_feed_verifier" {
  source              = "../modules/lambda"
  ecr_repository_name = "oracles-monitor"
  docker_image_tag    = var.oracles_monitor_image_tag
  container_family    = "feed-verifier"
  environment         = "mainnet"
  chain_id            = local.polygon_mainnet_chain_id
  container_env_vars = merge(
    local.oracle_feed_verifier_lambda_variables,
    { WEB3_HTTP_PROVIDER_URL = local.polygon_mainnet_rpc_1 }
  )
  schedule_expression = "rate(1 hour)"
}

module "polygon_mainnet_oracle_price_verifier" {
  source              = "../modules/lambda"
  ecr_repository_name = "oracles-monitor"
  docker_image_tag    = var.oracles_monitor_image_tag
  container_family    = "price-verifier"
  environment         = "mainnet"
  chain_id            = local.polygon_mainnet_chain_id
  container_env_vars = merge(
    local.oracle_price_verifier_lambda_variables,
    { WEB3_HTTP_PROVIDER_URL = local.polygon_mainnet_rpc_1 }
  )
  schedule_expression = "rate(5 minutes)"
}


module "polygon_mainnet_liquidation_cron" {
  source                  = "../modules/cron"
  service_security_groups = module.network.ecs_task_sg
  execution_role_arn      = module.iam.execution_role_arn
  cluster_id              = module.ecs.ecs_cluster_id
  docker_image            = var.liquidator_bot_image
  region                  = var.region
  environment             = "mainnet"
  container_family        = "liquidation-cron"
  chain_id                = local.polygon_mainnet_chain_id
  cpu                     = 256
  memory                  = 512
  instance_count          = 1
  subnets                 = module.network.public_subnets
  provider_urls           = [local.polygon_mainnet_rpc_1]
  runtime_env_vars = concat(local.liquidation_variables, [
    { name = "TARGET_CHAIN_ID", value = local.polygon_mainnet_chain_id },
  ])
  ecs_cluster_arn     = module.ecs.ecs_cluster_arn
  schedule_expression = "rate(2 minutes)"
}