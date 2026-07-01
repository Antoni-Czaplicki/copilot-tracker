import { isCronAuthorized } from "./cronAuth";

export function canRunBillingSync({
  allowAdmin,
  authorizationHeader,
  configuredSecret,
  isAdminUser,
}: {
  allowAdmin: boolean;
  authorizationHeader: string | null;
  configuredSecret: string | null;
  isAdminUser: boolean;
}) {
  return (
    isCronAuthorized(configuredSecret, authorizationHeader) ||
    (allowAdmin && isAdminUser)
  );
}
