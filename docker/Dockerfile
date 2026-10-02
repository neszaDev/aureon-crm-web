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
# The server only needs `node`: drop the package managers the base image bundles (npm ships
# its own dependencies, which the image scan in CI would otherwise flag) and add the user.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-* \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg \
  && addgroup -S app && adduser -S app -G app
# Standalone output: a self-contained server plus the static assets it serves.
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
