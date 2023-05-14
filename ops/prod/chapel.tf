
locals {
  bsc_tesent_rpc_0     = "https://data-seed-prebsc-1-s1.binance.org:8545/"
  bsc_testnet_chain_id = "97"
}

module "bsc_testnet_vaults_claimer" {
  source              = "../modules/lambda"
  ecr_repository_name = "vaults-claimer"
  docker_image_tag    = var.bots_image_tag
  container_family    = "vaults-claimer"
  environment         = "mainnet"
  chain_id            = local.bsc_testnet_chain_id
  container_env_vars = merge(
    local.vaults_claimer_variables,
    { WEB3_HTTP_PROVIDER_URL = local.bsc_tesent_rpc_0 }
  )
  schedule_expression = "rate(24 hours)"
  timeout             = 450
  memory_size         = 128
}
