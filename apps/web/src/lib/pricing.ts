import { findModelPrice, type CopilotChatRequest } from "@copilot-tracker/shared";

export interface EstimatedCost {
  estimatedUsd: number;
  estimatedAiCredits: number;
  pricedRequestCount: number;
  unpricedRequestCount: number;
}

export function estimateRequestsCost(
  requests: CopilotChatRequest[],
): EstimatedCost {
  let estimatedUsd = 0;
  let pricedRequestCount = 0;
  let unpricedRequestCount = 0;

  for (const request of requests) {
    const price = findModelPrice(request);
    if (!price) {
      unpricedRequestCount += 1;
      continue;
    }

    pricedRequestCount += 1;
    estimatedUsd +=
      ((request.inputTokens ?? 0) / 1_000_000) * price.inputUsdPerMillion;
    estimatedUsd +=
      ((request.outputTokens ?? 0) / 1_000_000) * price.outputUsdPerMillion;
  }

  return {
    estimatedUsd,
    estimatedAiCredits: estimatedUsd / 0.01,
    pricedRequestCount,
    unpricedRequestCount,
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}
