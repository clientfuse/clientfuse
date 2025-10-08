# Stage 1: Build the NestJs app
FROM node:20-alpine as builder
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}
WORKDIR /usr/app
COPY package.json package-lock.json ./
COPY nx.json ./
RUN npm ci
COPY . .
RUN npx nx build api

# Stage 2: Serve the app with Node.js
FROM node:20-alpine as runtime
WORKDIR /usr/app
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}
COPY --from=builder /usr/app/dist/apps/api ./dist
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
EXPOSE 3000
CMD ["node", "dist/main.js"]
