.PHONY: help install clean local-service docker-build-celery docker-build-service docker-push-service docker-push-celery test-service

.DEFAULT_GOAL := help
SHELL := /bin/bash
PATH := ${PWD}/venv/bin:${PATH}
PYTHONPATH := ${PWD}:${PYTHONPATH}

include .common.env

ifdef ENV
include .${ENV}.env
endif

export


BOLD=$(shell tput -T xterm bold)
RED=$(shell tput -T xterm setaf 1)
GREEN=$(shell tput -T xterm setaf 2)
YELLOW=$(shell tput -T xterm setaf 3)
RESET=$(shell tput -T xterm sgr0)

help:
	@awk 'BEGIN {FS = ":.*?##-.*?local.*?- "} /^[a-zA-Z_-]+:.*?##-.*?local.*?- / \
	{printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "${YELLOW}ENV=data${RESET}"
	@awk 'BEGIN {FS = ":.*?##-.*?data.*?- "} /^[a-zA-Z_-]+:.*?##-.*?data.*?- / \
	{printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "${YELLOW}ENV=sandbox${RESET}"
	@awk 'BEGIN {FS = ":.*?##-.*?sandbox.*?- "} /^[a-zA-Z_-]+:.*?##-.*?sandbox.*?- / \
	{printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)


check-%:
	@if [ "${${*}}" = "" ]; then \
		echo -e "${RED} Variable $* not set ❌${RESET}"; \
		exit 1; \
	fi

nosudo:
	@if [ $(shell whoami) = root ]; then \
		echo -e "${RED} This command should not be run as root ❌${RESET}"; \
		exit 1; \
	fi

# -------------------------------------------------------------------
# DEPLOY
# -------------------------------------------------------------------
infra-plan: 
	cd infra && \
	terraform init && \
	terraform plan

infra-deploy:
	cd infra && \
	terraform init && \
	terraform apply -auto-approve


prod-plan: 
	cd prod && \
	export TF_VAR_ethereum_admin_account=${ETHEREUM_ADMIN_ACCOUNT} && \
	export TF_VAR_ethereum_admin_private_key=${ETHEREUM_ADMIN_PRIVATE_KEY} && \
	export TF_VAR_pokt_api_key=${POKT_API_KEY} && \
	export TF_VAR_chainstack_bsc_rpc_url=${CHAINSTACK_BSC_RPC_URL} && \
	export TF_VAR_chainstack_polygon_rpc_url=${CHAINSTACK_POLYGON_RPC_URL} && \
	export TF_VAR_bots_image_tag=${IMAGE_TAG} && \
	export TF_VAR_ecs_notifier_discord_webhook_url=${ECS_NOTIFIER_DISCORD_WEBHOOK_URL} && \
	export TF_VAR_oracles_discord_webhook_url=${ORACLES_DISCORD_WEBHOOK_URL} && \
	export TF_VAR_liquidation_discord_webhook_url=${LIQUIDATION_DISCORD_WEBHOOK_URL} && \
	export TF_VAR_supabase_key=${SUPABASE_KEY} && \
	terraform init && \
	terraform plan


prod-deploy:
	cd prod && \
	export TF_VAR_ethereum_admin_account=${ETHEREUM_ADMIN_ACCOUNT} && \
	export TF_VAR_ethereum_admin_private_key=${ETHEREUM_ADMIN_PRIVATE_KEY} && \
	export TF_VAR_pokt_api_key=${POKT_API_KEY} && \
	export TF_VAR_chainstack_bsc_rpc_url=${CHAINSTACK_BSC_RPC_URL} && \
	export TF_VAR_chainstack_polygon_rpc_url=${CHAINSTACK_POLYGON_RPC_URL} && \
	export TF_VAR_bots_image_tag=${IMAGE_TAG} && \
	export TF_VAR_ecs_notifier_discord_webhook_url=${ECS_NOTIFIER_DISCORD_WEBHOOK_URL} && \
	export TF_VAR_oracles_discord_webhook_url=${ORACLES_DISCORD_WEBHOOK_URL} && \
	export TF_VAR_liquidation_discord_webhook_url=${LIQUIDATION_DISCORD_WEBHOOK_URL} && \
	export TF_VAR_supabase_key=${SUPABASE_KEY} && \
	terraform init && \
	terraform apply -auto-approve


# -------------------------------------------------------------------
# DEPLOY
# -------------------------------------------------------------------


liquidator-smoke-test:
	@docker run -t --entrypoint node \
				-e ETHEREUM_ADMIN_ACCOUNT=${ETHEREUM_ADMIN_ACCOUNT} \
				-e ETHEREUM_ADMIN_PRIVATE_KEY=${ETHEREUM_ADMIN_PRIVATE_KEY} \
				-e WEB3_HTTP_PROVIDER_URL="https://rpc.ankr.com/bsc" \
				-e NODE_ENV="development" \
				-e TARGET_CHAIN_ID=56 \
				ghcr.io/midas-protocol/liquidator:${IMAGE_TAG} packages/bots/liquidator/build/test/run.js


feed-verifier-smoke-test:
	docker run -t --entrypoint node \
				-e ETHEREUM_ADMIN_ACCOUNT=${ETHEREUM_ADMIN_ACCOUNT} \
				-e ETHEREUM_ADMIN_PRIVATE_KEY=${ETHEREUM_ADMIN_PRIVATE_KEY} \
				-e SUPABASE_KEY=${SUPABASE_KEY} \
				-e NODE_ENV="development" \
				-e WEB3_HTTP_PROVIDER_URL="https://rpc.ankr.com/bsc" \
				-e TARGET_CHAIN_ID=56 \
				-e SERVICE=feed-verifier \
				ghcr.io/midas-protocol/oracles-monitor:${IMAGE_TAG} packages/monitors/oracle/build/monitors/oracle/tests/run.js

price-verifier-smoke-test:
	@docker run -t --entrypoint node \
				-e ETHEREUM_ADMIN_ACCOUNT=${ETHEREUM_ADMIN_ACCOUNT} \
				-e ETHEREUM_ADMIN_PRIVATE_KEY=${ETHEREUM_ADMIN_PRIVATE_KEY} \
				-e SUPABASE_KEY=${SUPABASE_KEY} \
				-e NODE_ENV="development" \
				-e WEB3_HTTP_PROVIDER_URL="https://rpc.ankr.com/bsc" \
				-e TARGET_CHAIN_ID=56 \
				-e SERVICE=price-verifier \
				ghcr.io/midas-protocol/oracles-monitor:${IMAGE_TAG} packages/monitors/oracle/build/monitors/oracle/tests/run.js

price-change-verifier-smoke-test:
	@docker run -t --entrypoint node \
				-e ETHEREUM_ADMIN_ACCOUNT=${ETHEREUM_ADMIN_ACCOUNT} \
				-e ETHEREUM_ADMIN_PRIVATE_KEY=${ETHEREUM_ADMIN_PRIVATE_KEY} \
				-e SUPABASE_KEY=${SUPABASE_KEY} \
				-e NODE_ENV="development" \
				-e WEB3_HTTP_PROVIDER_URL="https://rpc.ankr.com/bsc" \
				-e TARGET_CHAIN_ID=56 \
				-e SERVICE=price-change-verifier \
				ghcr.io/midas-protocol/oracles-monitor:${IMAGE_TAG} packages/monitors/oracle/build/monitors/oracle/tests/run.js
