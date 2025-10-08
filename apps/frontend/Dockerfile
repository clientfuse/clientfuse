# Stage 1: Build the Angular app
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY nx.json ./
RUN npm ci
COPY . .
COPY /apps/frontend/nginx.conf .
RUN npx nx build frontend --prod

# Stage 2: Serve the app with nginx
FROM nginx:alpine
COPY --from=build /app/dist/apps/frontend /usr/share/nginx/html
COPY --from=build /app/apps/frontend/nginx.conf /etc/nginx
EXPOSE 8000
