FROM registry.access.redhat.com/ubi9/nodejs-18:latest as builder
USER root
RUN npm install -g corepack && corepack prepare pnpm@latest --activate
WORKDIR /src
COPY . .
RUN pnpm install
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm build

FROM registry.access.redhat.com/ubi9/nodejs-18:latest as runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080
WORKDIR /app
COPY --from=builder /src/public ./public
COPY --from=builder /src/.next/standalone ./
COPY --from=builder /src/.next/static ./.next/static
CMD ["node", "/app/server.js"]
EXPOSE 8080
