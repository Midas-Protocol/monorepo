# Fuse by Midas Capital: Vaults Bot

This repository contains the TypeScript source code for the Midas Vault Claimer

## How it works

- Fetches all vaults
- Claims rewards from all of them

## Build

From the top level:

```
>>> yarn
>>> yarn workspace @midas-capital/vaults build
```

Or with docker:

```
docker build -t vaults -f docker/vaults/Dockerfile
```

## Run

Export the relevant environment variables:

```
export ETHEREUM_ADMIN_ACCOUNT="0x321..."
export ETHEREUM_ADMIN_PRIVATE_KEY="0x123..."
export WEB3_HTTP_PROVIDER_URL="https://bsc-mainnet.gateway.pokt.network/v1/lb/xxxxxxxxxx"
export TARGET_CHAIN_ID=56
```

And run outside docker:

```
>>> node build/index.js
```

Or with docker:

```
>>> docker run -it -e ETHEREUM_ADMIN_ACCOUNT=$ETHEREUM_ADMIN_ACCOUNT \
                   -e ETHEREUM_ADMIN_PRIVATE_KEY=$ETHEREUM_ADMIN_PRIVATE_KEY \
                   -e WEB3_HTTP_PROVIDER_URL=$WEB3_HTTP_PROVIDER_URL \
                   -e TARGET_CHAIN_ID=56 vaults
```

## Deploy

Automated via Terraform -- see `./monorepo/ops/` directory
