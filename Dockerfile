# Build stage
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bakes these into the bundle at build time. The defaults are relative paths,
# so the browser calls the same origin and nginx proxies them to the API container.
ARG VITE_API_BASE_URL=/api
ARG VITE_SIGNALR_HUB_URL=/hubs/game
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_SIGNALR_HUB_URL=$VITE_SIGNALR_HUB_URL

RUN npm run build-only

# Runtime stage
FROM nginx:1.27-alpine AS runtime

# nginx's official image renders /etc/nginx/templates/*.template with envsubst on startup.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV API_UPSTREAM=http://backend:8080

EXPOSE 80
