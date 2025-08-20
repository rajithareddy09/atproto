FROM node:20.11-alpine3.18

RUN apk add --update dumb-init

WORKDIR /app

# Copy workspace files first
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./

# Copy all package.json files from workspace
COPY packages/*/package.json ./packages/
COPY services/*/package.json ./services/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy the entire workspace source
COPY packages ./packages
COPY services ./services
COPY lexicons ./lexicons

# Copy pre-built dist files instead of building
COPY packages/*/dist ./packages/*/dist
COPY services/*/dist ./services/*/dist

# Create data directory and set permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

VOLUME /app/data
EXPOSE 2583
ENV PDS_PORT=2583
ENV NODE_ENV=production

# Avoid zombie processes, handle signal forwarding
ENTRYPOINT ["dumb-init", "--"]

USER node
CMD ["node", "--enable-source-maps", "services/pds/index.js"]

LABEL org.opencontainers.image.description="ATP Personal Data Server (PDS)"
LABEL org.opencontainers.image.licenses=MIT
