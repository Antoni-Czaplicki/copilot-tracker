import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const emptyStringAsUndefined = z.literal("").transform(() => void 0);
const optionalString = z.string().min(1).optional().or(emptyStringAsUndefined);

export const env = createEnv({
  server: {
    ADMIN_GITHUB_LOGINS: optionalString,
    COPILOT_TRACKER_AUTH_MODE: z.enum(["github", "disabled"]).default("github"),
    CRON_SECRET: optionalString,
    DATABASE_URL: z.url(),
    GITHUB_API_URL: z.url().default("https://api.github.com"),
    GITHUB_CLIENT_ID: optionalString,
    GITHUB_CLIENT_SECRET: optionalString,
    GITHUB_COPILOT_BILLING_SCOPE: optionalString,
    GITHUB_COPILOT_BILLING_SCOPE_TYPE: z
      .enum(["user", "organization", "enterprise"])
      .optional()
      .or(emptyStringAsUndefined),
    GITHUB_COPILOT_BILLING_TOKEN: optionalString,
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3737"),
  },
  runtimeEnv: {
    ADMIN_GITHUB_LOGINS: process.env.ADMIN_GITHUB_LOGINS,
    COPILOT_TRACKER_AUTH_MODE: process.env.COPILOT_TRACKER_AUTH_MODE,
    CRON_SECRET: process.env.CRON_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    GITHUB_API_URL: process.env.GITHUB_API_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_COPILOT_BILLING_SCOPE: process.env.GITHUB_COPILOT_BILLING_SCOPE,
    GITHUB_COPILOT_BILLING_SCOPE_TYPE:
      process.env.GITHUB_COPILOT_BILLING_SCOPE_TYPE,
    GITHUB_COPILOT_BILLING_TOKEN: process.env.GITHUB_COPILOT_BILLING_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
