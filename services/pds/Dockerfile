FROM node:20.11-alpine3.18

RUN apk add --update dumb-init

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy the PDS service files
COPY . .

# Create data directory and set permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

VOLUME /app/data
EXPOSE 2583
ENV PDS_PORT=2583
ENV NODE_ENV=production

# Avoid zombie processes, handle signal forwarding
ENTRYPOINT ["dumb-init", "--"]

USER node
CMD ["node", "--enable-source-maps", "index.js"]

LABEL org.opencontainers.image.description="ATP Personal Data Server (PDS)"
LABEL org.opencontainers.image.licenses=MIT
