import { CopilotChatRequest } from "./types";

interface ModelPrice {
  aliases: string[];
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

const modelPrices: ModelPrice[] = [
  {
    aliases: ["gpt-5 nano", "gpt-5-nano"],
    inputUsdPerMillion: 0.05,
    outputUsdPerMillion: 0.4,
  },
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
    aliases: ["claude sonnet", "claude-sonnet"],
    inputUsdPerMillion: 3,
    outputUsdPerMillion: 15,
  },
  {
    aliases: ["claude opus", "claude-opus"],
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 25,
  },
  {
    aliases: ["gemini 2.5 flash", "gemini-2.5-flash"],
    inputUsdPerMillion: 0.3,
    outputUsdPerMillion: 2.5,
  },
  {
    aliases: ["gemini 2.5 pro", "gemini-2.5-pro"],
    inputUsdPerMillion: 1.25,
    outputUsdPerMillion: 10,
  },
];

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
