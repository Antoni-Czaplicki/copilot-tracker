import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyStringAsUndefined = z.literal("").transform(() => void 0);
const optionalString = z.string().min(1).optional().or(emptyStringAsUndefined);
const isProduction = process.env.NODE_ENV === "production";
const booleanStringDefaultTrue = z.preprocess((value) => {
  if (value === undefined || value === "") {
    return true;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}, z.boolean());

export const env = createEnv({
  server: {
    ADMIN_AZURE_DEVOPS_LOGINS: optionalString,
    AZURE_DEVOPS_CLIENT_ID: optionalString,
    AZURE_DEVOPS_CLIENT_SECRET: optionalString,
    AZURE_DEVOPS_ORG: optionalString,
    AZURE_DEVOPS_TENANT_ID: optionalString,
    COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY: optionalString,
    COPILOT_TRACKER_AUTH_MODE: z
      .enum(["azure-devops", "disabled"])
      .default("azure-devops")
      .refine((mode) => !isProduction || mode !== "disabled", {
        message:
          "COPILOT_TRACKER_AUTH_MODE=disabled is only allowed outside production.",
      }),
    COPILOT_TRACKER_LEADERBOARD_ENABLED: booleanStringDefaultTrue,
    CRON_SECRET: optionalString,
    DATABASE_URL: z.url(),
    GITHUB_API_URL: z.url().default("https://api.github.com"),
    GITHUB_COPILOT_BILLING_SCOPE: optionalString,
    GITHUB_COPILOT_BILLING_SCOPE_TYPE: z
      .enum(["user", "organization", "enterprise"])
      .optional()
      .or(emptyStringAsUndefined),
    GITHUB_COPILOT_BILLING_TOKEN: optionalString,
  },
  client: {
    NEXT_PUBLIC_APP_URL: z
      .url()
      .default("http://localhost:3737")
      .refine((value) => !isProduction || new URL(value).protocol === "https:", {
        message: "NEXT_PUBLIC_APP_URL must use HTTPS in production.",
      }),
  },
  runtimeEnv: {
    ADMIN_AZURE_DEVOPS_LOGINS: process.env.ADMIN_AZURE_DEVOPS_LOGINS,
    AZURE_DEVOPS_CLIENT_ID: process.env.AZURE_DEVOPS_CLIENT_ID,
    AZURE_DEVOPS_CLIENT_SECRET: process.env.AZURE_DEVOPS_CLIENT_SECRET,
    AZURE_DEVOPS_ORG: process.env.AZURE_DEVOPS_ORG,
    AZURE_DEVOPS_TENANT_ID: process.env.AZURE_DEVOPS_TENANT_ID,
    COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY:
      process.env.COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY,
    COPILOT_TRACKER_AUTH_MODE: process.env.COPILOT_TRACKER_AUTH_MODE,
    COPILOT_TRACKER_LEADERBOARD_ENABLED:
      process.env.COPILOT_TRACKER_LEADERBOARD_ENABLED,
    CRON_SECRET: process.env.CRON_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    GITHUB_API_URL: process.env.GITHUB_API_URL,
    GITHUB_COPILOT_BILLING_SCOPE: process.env.GITHUB_COPILOT_BILLING_SCOPE,
    GITHUB_COPILOT_BILLING_SCOPE_TYPE:
      process.env.GITHUB_COPILOT_BILLING_SCOPE_TYPE,
    GITHUB_COPILOT_BILLING_TOKEN: process.env.GITHUB_COPILOT_BILLING_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});

if (
  isProduction &&
  env.COPILOT_TRACKER_AUTH_MODE === "azure-devops" &&
  (env.AZURE_DEVOPS_CLIENT_ID === undefined ||
    env.AZURE_DEVOPS_CLIENT_SECRET === undefined ||
    env.AZURE_DEVOPS_ORG === undefined ||
    env.COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY === undefined)
) {
  throw new Error(
    "AZURE_DEVOPS_CLIENT_ID, AZURE_DEVOPS_CLIENT_SECRET, AZURE_DEVOPS_ORG, and COPILOT_TRACKER_TOKEN_ENCRYPTION_KEY are required in production when Azure DevOps auth is enabled.",
  );
}
