import type { StoredGithubCopilotBillingUsage } from "./store";

interface GitHubAiCreditUsageRowsInput {
  body: unknown;
  fallbackDate: string;
  fetchedAt: string;
  scopeType: "user" | "organization" | "enterprise";
  scope: string;
}

export function githubCopilotBillingRowsFromResponse({
  body,
  fallbackDate,
  fetchedAt,
  scopeType,
  scope,
}: GitHubAiCreditUsageRowsInput) {
  const usageDateValue = usageDate(body, fallbackDate);
  const usageItems = usageItemsFromResponse(body);
  const rows = usageItems.map(
    (item, index): StoredGithubCopilotBillingUsage => {
      const model = stringValue(item.model);
      const sku = stringValue(item.sku);
      const unitType = stringValue(item.unitType);
      return {
        id: [
          scopeType,
          scope,
          usageDateValue,
          model ?? "unknown-model",
          sku ?? "unknown-sku",
          unitType ?? "unknown-unit",
          index,
        ].join(":"),
        scopeType,
        scope,
        date: usageDateValue,
        product: stringValue(item.product),
        sku,
        quantity: stringValue(item.netQuantity ?? item.grossQuantity),
        unitType,
        grossAmount: stringValue(item.grossAmount),
        discountAmount: stringValue(item.discountAmount),
        netAmount: stringValue(item.netAmount),
        raw: item,
        fetchedAt,
      };
    },
  );

  return { rows, usageDateValue };
}

function usageDate(body: unknown, fallback: string) {
  if (!isRecord(body) || !isRecord(body.timePeriod)) {
    return fallback;
  }

  const year = integerInRange(body.timePeriod.year, 1, 9999);
  const monthNumber = integerInRange(body.timePeriod.month, 1, 12);
  const dayNumber = integerInRange(body.timePeriod.day, 1, 31);
  if (year === null || monthNumber === null || dayNumber === null) {
    return fallback;
  }

  const month = String(monthNumber).padStart(2, "0");
  const day = String(dayNumber).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function usageItemsFromResponse(body: unknown) {
  if (!isRecord(body) || !Array.isArray(body.usageItems)) {
    return [];
  }

  return body.usageItems.filter(isRecord);
}

function stringValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function integerInRange(value: unknown, min: number, max: number) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    return null;
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
