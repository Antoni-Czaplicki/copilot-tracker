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
ARG NEXT_PUBLIC_APP_URL=https://copilot-tracker.example.com
ARG COPILOT_TRACKER_AUTH_MODE=azure-devops
ARG AZURE_DEVOPS_CLIENT_ID=placeholder-client-id
ARG AZURE_DEVOPS_CLIENT_SECRET=placeholder-client-secret
ARG AZURE_DEVOPS_ORG=placeholder-org
ARG AZURE_DEVOPS_TENANT_ID=organizations

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV COPILOT_TRACKER_AUTH_MODE=$COPILOT_TRACKER_AUTH_MODE
ENV AZURE_DEVOPS_CLIENT_ID=$AZURE_DEVOPS_CLIENT_ID
ENV AZURE_DEVOPS_CLIENT_SECRET=$AZURE_DEVOPS_CLIENT_SECRET
ENV AZURE_DEVOPS_ORG=$AZURE_DEVOPS_ORG
ENV AZURE_DEVOPS_TENANT_ID=$AZURE_DEVOPS_TENANT_ID

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
