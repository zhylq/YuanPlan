# Matching Alpine releases keep the musl-based Node binary and PostgreSQL clients compatible.
FROM node:26-alpine3.24 AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/editor-schema/package.json packages/editor-schema/package.json
COPY packages/mcp-stdio/package.json packages/mcp-stdio/package.json
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# Database entrypoint only needs a UID switch; use Alpine's maintained helper.
FROM postgres:17-alpine3.24 AS database
RUN apk upgrade --no-cache && apk add --no-cache su-exec \
    && sed -i 's/exec gosu postgres/exec su-exec postgres/' /usr/local/bin/docker-entrypoint.sh \
    && rm /usr/local/bin/gosu

FROM database AS runtime
COPY --from=build /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
COPY --from=build --chown=postgres:postgres /app/node_modules ./node_modules
COPY --from=build --chown=postgres:postgres /app/package.json ./package.json
COPY --from=build --chown=postgres:postgres /app/LICENSE /app/THIRD_PARTY_NOTICES.md ./
COPY --from=build --chown=postgres:postgres /app/apps/server ./apps/server
COPY --from=build --chown=postgres:postgres /app/apps/web/dist ./apps/web/dist
COPY --from=build --chown=postgres:postgres /app/packages ./packages
COPY --from=build --chown=postgres:postgres /app/deploy ./deploy
RUN mkdir -p /data/uploads /backups && chown -R postgres:postgres /data /backups
ENV NODE_ENV=production PORT=18420 UPLOAD_DIR=/data/uploads WEB_DIST=apps/web/dist
USER postgres
EXPOSE 18420
ENTRYPOINT []
CMD ["node", "apps/server/dist/index.js"]
