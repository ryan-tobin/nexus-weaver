FROM node:20-alpine AS builder 

WORKDIR /app 

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force 

COPY . . 

RUN npm run build 

FROM nginx:alpine 

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html 

EXPOSE 80 

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD [ "nginx", "-g", "daemon off" ]