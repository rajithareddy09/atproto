FROM node:20.11-alpine3.18
RUN apk add --update dumb-init
WORKDIR /app
COPY package.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
EXPOSE 3000
ENV OZONE_PORT=3000
ENV NODE_ENV=production
ENTRYPOINT ["dumb-init", "--"]
USER node
CMD ["node", "api.js"]
LABEL org.opencontainers.image.description="Ozone"
LABEL org.opencontainers.image.licenses=MIT
