FROM node:24.18.0-alpine3.24 AS base

WORKDIR /app

FROM base AS dev

RUN apk add --no-cache git openssh-client

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS builder

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:1.31.3-alpine3.24 AS prod

COPY --from=builder /app/dist /usr/share/nginx/html

COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./docker/config.js.template /etc/dramatoons/config.js.template
COPY --chmod=755 ./docker/40-config-js.sh /docker-entrypoint.d/40-config-js.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]