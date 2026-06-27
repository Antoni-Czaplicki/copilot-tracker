FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

WORKDIR /app

COPY . .

ARG DATABASE_URL=postgres://copilot_tracker:copilot_tracker@localhost:5432/copilot_tracker
ARG NEXT_PUBLIC_APP_URL=http://localhost:3737

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN pnpm --filter @copilot-tracker/shared build
RUN pnpm --filter @copilot-tracker/web build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3737
ENV HOSTNAME=0.0.0.0

COPY --from=build /app ./

EXPOSE 3737

CMD ["sh", "-c", "for i in $(seq 1 30); do pnpm --filter @copilot-tracker/web db:migrate && exec pnpm --filter @copilot-tracker/web start; echo 'Waiting for database...'; sleep 2; done; exit 1"]
