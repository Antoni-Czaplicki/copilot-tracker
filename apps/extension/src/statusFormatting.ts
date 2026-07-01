import type { SessionTokenStats } from "./sessionTokenStats";

const defaultMaxStatusTaskLength = 28;

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

export function formatEstimatedSessionCost(stats: SessionTokenStats) {
  const formatted = formatCurrency(stats.estimatedUsd);
  return stats.incompleteTokenRequestCount > 0
    ? `${formatted}+ lower bound`
    : formatted;
}

export function compactStatusText(
  value: string,
  maxLength = defaultMaxStatusTaskLength,
) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}
