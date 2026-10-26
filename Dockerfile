FROM node:20-bookworm-slim AS build

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app
COPY package.json yarn.lock ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && yarn install --frozen-lockfile --production=true \
    && apt-get purge -y --auto-remove python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
COPY database database

EXPOSE 3000
CMD ["node", "backend/dist/server.js"]
