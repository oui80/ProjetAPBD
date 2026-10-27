# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS build

ENV npm_config_nodedir=/usr/local
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile

COPY . .
ARG BASE_PATH=/
RUN yarn workspace @pace-lab/backend build \
    && yarn workspace @pace-lab/frontend build --base="${BASE_PATH}"

FROM build AS production-dependencies
RUN rm -rf node_modules backend/node_modules frontend/node_modules
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn \
    yarn install --frozen-lockfile --production=true --offline

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app
COPY package.json yarn.lock ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY --from=production-dependencies /app/node_modules node_modules

COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
COPY database database

RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
