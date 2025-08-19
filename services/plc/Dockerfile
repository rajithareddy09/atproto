FROM node:20.11-alpine3.18
RUN apk add --update dumb-init
WORKDIR /app
COPY package.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
EXPOSE 2582
ENV PORT=2582
ENV NODE_ENV=production
ENTRYPOINT ["dumb-init", "--"]
USER node
CMD ["node", "api.js"]
LABEL org.opencontainers.image.description="ATP Personal Lifecycle Controller (PLC)"
LABEL org.opencontainers.image.licenses=MIT
