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

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_STAGING_AUTH
ENV VITE_STAGING_AUTH=$VITE_STAGING_AUTH

RUN npm run build

FROM nginx:1.31.3-alpine3.24 AS prod

COPY --from=builder /app/dist /usr/share/nginx/html

COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]