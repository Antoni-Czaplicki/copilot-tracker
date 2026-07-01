import { appBaseUrl } from "./config";

export function secureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
  };
}

export function expiredCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
  };
}

export function shouldUseSecureCookies() {
  return shouldUseSecureCookiesForAppUrl(appBaseUrl(), process.env.NODE_ENV);
}

export function shouldUseSecureCookiesForAppUrl(
  baseUrl: string,
  nodeEnv = process.env.NODE_ENV,
) {
  try {
    return new URL(baseUrl).protocol === "https:";
  } catch {
    return nodeEnv === "production";
  }
}
