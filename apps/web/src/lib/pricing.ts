import { CopilotChatRequest } from "@copilot-tracker/shared";

interface ModelPrice {
  aliases: string[];
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

const modelPrices: ModelPrice[] = [
  {
    aliases: ["gpt-5 mini", "gpt-5-mini"],
    inputUsdPerMillion: 0.25,
    outputUsdPerMillion: 2,
  },
  {
    aliases: ["gpt-5.3-codex", "gpt-5.3 codex"],
    inputUsdPerMillion: 1.75,
    outputUsdPerMillion: 14,
  },
  {
    aliases: ["gpt-5.4 mini", "gpt-5.4-mini"],
    inputUsdPerMillion: 0.75,
    outputUsdPerMillion: 4.5,
  },
  {
    aliases: ["gpt-5.4 nano", "gpt-5.4-nano"],
    inputUsdPerMillion: 0.2,
    outputUsdPerMillion: 1.25,
  },
  {
    aliases: ["gpt-5.4", "gpt 5.4"],
    inputUsdPerMillion: 2.5,
    outputUsdPerMillion: 15,
  },
  {
    aliases: ["gpt-5.5", "gpt 5.5"],
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 30,
  },
  {
    aliases: ["claude haiku 4.5", "claude-haiku-4.5"],
    inputUsdPerMillion: 1,
    outputUsdPerMillion: 5,
  },
  {
    aliases: ["claude sonnet 4", "claude-sonnet-4"],
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
  },
  {
    aliases: ["claude sonnet 4.5", "claude-sonnet-4.5"],
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
  },
  {
    aliases: ["claude sonnet 4.6", "claude-sonnet-4.6"],
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
  },
  {
    aliases: ["claude opus 4.5", "claude-opus-4.5"],
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 25,
  },
  {
    aliases: ["claude opus 4.6", "claude-opus-4.6"],
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 25,
  },
  {
    aliases: ["claude opus 4.7", "claude-opus-4.7"],
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 25,
  },
  {
    aliases: ["claude opus 4.8", "claude-opus-4.8"],
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 25,
  },
  {
    aliases: ["gemini 2.5 pro", "gemini-2.5-pro"],
    inputUsdPerMillion: 1.25,
    outputUsdPerMillion: 10,
  },
  {
    aliases: ["gemini 3 flash", "gemini-3-flash"],
    inputUsdPerMillion: 0.5,
    outputUsdPerMillion: 3,
  },
  {
    aliases: ["gemini 3.1 pro", "gemini-3.1-pro"],
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 12,
  },
  {
    aliases: ["gemini 3.5 flash", "gemini-3.5-flash"],
    inputUsdPerMillion: 1.5,
    outputUsdPerMillion: 9,
  },
  {
    aliases: ["raptor mini", "raptor-mini"],
    inputUsdPerMillion: 0.25,
    outputUsdPerMillion: 2,
  },
  {
    aliases: ["mai-code-1-flash", "mai code 1 flash"],
    inputUsdPerMillion: 0.75,
    outputUsdPerMillion: 4.5,
  },
];

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

function findModelPrice(request: CopilotChatRequest): ModelPrice | null {
  const model = [request.modelId, request.resolvedModel, request.modelName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    modelPrices.find((price) =>
      price.aliases.some((alias) => model.includes(alias)),
    ) ?? null
  );
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}
