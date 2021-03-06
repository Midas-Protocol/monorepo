FROM node:16.13-alpine as base

FROM ghcr.io/foundry-rs/foundry:nightly-4604a420c5e23d206ec949219171cb3701e54e28 as foundry


FROM node as build

COPY --from=foundry /usr/local/bin/forge /usr/local/bin/forge

RUN apt update
RUN apt install git

ENV HOME=/tmp/build \
    PATH=/tmp/build/node_modules/.bin:./node_modules/.bin:${PATH}

WORKDIR /tmp/build

ARG TEMP_DEPS_DIR

# ----- Copy only the files that affect yarn install -----
# Allows docker to use cache and skip install if dependencies are unchanged.
# Assumes that ./packages/*/package.json files have been copied to TEMP_DEPS_DIR
# with that same directory structure. build.sh does this.
COPY .yarn /tmp/build/.yarn/
COPY .yarnrc.yml /tmp/build/

COPY package.json /tmp/build/
COPY packages/sdk/package.json /tmp/build/packages/sdk/
COPY packages/monitors/oracle/package.json /tmp/build/packages/monitors/oracle/

RUN touch /tmp/build/yarn.lock

# ----- Install dependencies -----
# Install dependencies exactly as in the yarn.lock file - no updates.
RUN yarn install

# ----- Copy source and all other files that affect lint, test, build -----
COPY packages/sdk /tmp/build/packages/sdk
COPY packages/monitors/oracle /tmp/build/packages/monitors/oracle

# ----- build -----
RUN yarn build:deploy:oracles-monitor

# ----------------------------------------
# Copy files to the deployment image.
# ----------------------------------------

FROM node as runtime

# ----- Copy files required at runtime by the app -----
COPY --from=build --chown=node:node /tmp/build /home/node
COPY docker/wait-for-hh.sh /home/node/packages/monitors/oracle/wait-for-hh.sh

RUN chmod +x /home/node/packages/monitors/oracle/wait-for-hh.sh

WORKDIR /home/node/packages/monitors/oracle

CMD ["node", "build/index.js"]

