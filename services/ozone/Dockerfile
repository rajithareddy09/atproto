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

# Install service-specific dependencies using npm
WORKDIR /app/services/ozone
RUN npm install

# Return to app root
WORKDIR /app

EXPOSE 3000
ENV OZONE_PORT=3000
ENV NODE_ENV=production

# Avoid zombie processes, handle signal forwarding
ENTRYPOINT ["dumb-init", "--"]

USER node
CMD ["node", "--enable-source-maps", "services/ozone/api.js"]

LABEL org.opencontainers.image.description="Ozone Moderation Service"
LABEL org.opencontainers.image.licenses=MIT
