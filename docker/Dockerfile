# Node major must match "engines" in package.json and the CI setup; pnpm matches "packageManager".
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Hoisted (flat) node_modules only for the image: Next's standalone file tracing misses files
# behind pnpm's symlinked layout. LEFTHOOK=0: git hooks are pointless inside an image build.
RUN LEFTHOOK=0 pnpm install --frozen-lockfile --node-linker=hoisted

FROM deps AS build
COPY . .
# Runtime configuration (BACKEND_URL, APP_URL) is validated when the server starts, not here.
ENV SKIP_ENV_VALIDATION=true NEXT_TELEMETRY_DISABLED=1
# Call the binary directly: `pnpm exec` would see the hoisted layout and reinstall.
RUN ./node_modules/.bin/next build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
# Standalone output: a self-contained server plus the static assets it serves.
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
