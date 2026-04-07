FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run and local `docker run -p 8080:8080` expect the process to listen on 8080
ENV PORT=8080

COPY --from=builder /app /app

EXPOSE 8080

CMD ["npm", "run", "start"]
