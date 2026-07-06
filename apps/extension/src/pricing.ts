import { findModelPrice } from "@copilot-tracker/shared";

import { CopilotChatRequest } from "./types";

export function estimateRequestsCostUsd(requests: CopilotChatRequest[]) {
  return requests.reduce((total, request) => {
    const price = findModelPrice(request);
    if (!price) {
      return total;
    }

    return (
      total +
      ((request.inputTokens ?? 0) / 1_000_000) * price.inputUsdPerMillion +
      ((request.outputTokens ?? 0) / 1_000_000) * price.outputUsdPerMillion
    );
  }, 0);
}
