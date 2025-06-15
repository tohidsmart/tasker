FROM node:22-slim AS base

FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=prod

COPY ./server.js ./


FROM base AS runner
WORKDIR /app


COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=deps --chown=node:node /app/server.js ./

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000
USER node

CMD ["node", "server.js"]