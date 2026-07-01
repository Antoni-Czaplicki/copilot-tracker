import { parseBearerToken } from "./authIdentity";

export function isCronAuthorized(
  configuredSecret: string | null,
  authorizationHeader: string | null,
) {
  if (!configuredSecret) {
    return false;
  }

  return parseBearerToken(authorizationHeader) === configuredSecret;
}
