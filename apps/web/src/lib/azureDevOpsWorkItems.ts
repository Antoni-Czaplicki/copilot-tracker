import {
  azureDevOpsOrg,
  azureDevOpsSearchUrl,
  azureDevOpsWorkItemsUrl,
} from "./config";

export interface AzureDevOpsWorkItem {
  id: number;
  title: string;
  state: string | null;
  type: string | null;
  project: string | null;
  assignedTo: string | null;
  changedAt: string | null;
  tags: string | null;
  url: string | null;
}

const workItemFields = [
  "System.Id",
  "System.Title",
  "System.State",
  "System.WorkItemType",
  "System.TeamProject",
  "System.AssignedTo",
  "System.ChangedDate",
  "System.Tags",
];
const defaultWorkItemSearchLimit = 20;
const maxWorkItemSearchLimit = 50;
const maxAzureDevOpsWorkItemId = 2_147_483_647;

export class AzureDevOpsWorkItemsError extends Error {
  public constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AzureDevOpsWorkItemsError";
  }
}

export function azureDevOpsWorkItemsClientStatus(status: number) {
  if (status === 401 || status === 403 || status === 429) {
    return status;
  }

  return 502;
}

export async function searchAzureDevOpsWorkItems({
  accessToken,
  query,
  limit = 20,
}: {
  accessToken: string;
  query: string;
  limit?: number;
}): Promise<AzureDevOpsWorkItem[]> {
  const normalizedQuery = query.trim().slice(0, 120);
  if (!normalizedQuery) {
    return [];
  }

  const safeLimit = safeSearchLimit(limit);
  const directIds = directWorkItemIdsFromQuery(normalizedQuery);
  if (isExactWorkItemIdQuery(normalizedQuery)) {
    return fetchWorkItems(accessToken, directIds.slice(0, safeLimit));
  }
  if (/^\d+$/u.test(normalizedQuery)) {
    return [];
  }

  const directItems =
    directIds.length > 0
      ? await fetchWorkItems(accessToken, directIds.slice(0, safeLimit))
      : [];
  const searchItems = await searchWorkItems(
    accessToken,
    normalizedQuery,
    safeLimit,
  );
  if (searchItems !== null && searchItems.length > 0) {
    return dedupeWorkItems([...directItems, ...searchItems]).slice(0, safeLimit);
  }

  const ids = await queryWorkItemIds(accessToken, normalizedQuery, safeLimit);
  if (ids.length === 0) {
    return directItems;
  }

  const wiqlItems = await fetchWorkItems(accessToken, ids);
  return dedupeWorkItems([...directItems, ...wiqlItems]).slice(0, safeLimit);
}

export async function fetchAzureDevOpsWorkItemsByIds({
  accessToken,
  ids,
  limit = maxWorkItemSearchLimit,
}: {
  accessToken: string;
  ids: number[];
  limit?: number;
}): Promise<AzureDevOpsWorkItem[]> {
  return fetchWorkItems(
    accessToken,
    uniqueNumbers(ids.filter((id) => isWorkItemId(id))).slice(
      0,
      safeSearchLimit(limit),
    ),
  );
}

async function searchWorkItems(
  accessToken: string,
  query: string,
  limit: number,
) {
  const response = await fetchWithRetry(
    new URL(
      "_apis/search/workitemsearchresults?api-version=7.1",
      `${azureDevOpsSearchUrl()}/`,
    ),
    {
      method: "POST",
      headers: azureDevOpsHeaders(accessToken),
      body: JSON.stringify({
        searchText: query,
        "$skip": 0,
        "$top": limit,
        filters: null,
        includeFacets: false,
      }),
    },
  );

  if (!response.ok) {
    if (
      response.status === 400 ||
      response.status === 403 ||
      response.status === 404
    ) {
      return null;
    }
    throw toAzureDevOpsError(response);
  }

  return workItemsFromSearchPayload(
    await readAzureDevOpsJson(response),
    limit,
  );
}

async function queryWorkItemIds(
  accessToken: string,
  query: string,
  limit: number,
) {
  const wiqlQueries = buildWiqlQueries(query, limit);
  for (const wiql of wiqlQueries) {
    const response = await fetchWithRetry(
      new URL("_apis/wit/wiql?api-version=7.1", `${azureDevOpsWorkItemsUrl()}/`),
      {
        method: "POST",
        headers: azureDevOpsHeaders(accessToken),
        body: JSON.stringify({ query: wiql }),
      },
    );

    if (!response.ok) {
      if (response.status === 400) {
        continue;
      }
      throw toAzureDevOpsError(response);
    }

    const ids = workItemIdsFromWiqlPayload(
      await readAzureDevOpsJson(response),
      limit,
    );
    if (ids.length > 0) {
      return ids;
    }
  }

  return [];
}

export function buildWiqlQueries(query: string, limit: number) {
  const safeLimit = safeSearchLimit(limit);
  const workItemId = parseWorkItemId(query);
  if (workItemId !== null || /^\d+$/u.test(query)) {
    return [];
  }

  const escaped = escapeWiqlString(query);
  return [
    `SELECT TOP ${safeLimit} [System.Id] FROM WorkItems WHERE [System.Title] CONTAINS WORDS '${escaped}' ORDER BY [System.ChangedDate] DESC`,
    `SELECT TOP ${safeLimit} [System.Id] FROM WorkItems WHERE [System.Title] CONTAINS '${escaped}' ORDER BY [System.ChangedDate] DESC`,
  ];
}

function safeSearchLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return defaultWorkItemSearchLimit;
  }

  return Math.min(
    Math.max(Math.trunc(limit), 1),
    maxWorkItemSearchLimit,
  );
}

function parseWorkItemId(query: string) {
  if (!/^\d+$/u.test(query)) {
    return null;
  }

  const id = Number(query);
  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    id > maxAzureDevOpsWorkItemId
  ) {
    return null;
  }

  return id;
}

function isExactWorkItemIdQuery(query: string) {
  return parseWorkItemId(query) !== null;
}

function directWorkItemIdsFromQuery(query: string) {
  const exactId = parseWorkItemId(query);
  if (exactId !== null) {
    return [exactId];
  }

  return uniqueNumbers(
    [...query.matchAll(/(?:\bAB#|#|\bid:)\s*(\d{1,10})\b/giu)]
      .map((match) => parseWorkItemId(match[1] ?? ""))
      .filter((id): id is number => id !== null),
  );
}

async function fetchWorkItems(accessToken: string, ids: number[]) {
  if (ids.length === 0) {
    return [];
  }

  const response = await fetchWithRetry(
    new URL(
      "_apis/wit/workitemsbatch?api-version=7.1",
      `${azureDevOpsWorkItemsUrl()}/`,
    ),
    {
      method: "POST",
      headers: azureDevOpsHeaders(accessToken),
      body: JSON.stringify({
        ids,
        fields: workItemFields,
        errorPolicy: "Omit",
      }),
    },
  );

  if (!response.ok) {
    throw toAzureDevOpsError(response);
  }

  return orderWorkItemsByIds(
    workItemsFromBatchPayload(await readAzureDevOpsJson(response)),
    ids,
  );
}

function workItemIdsFromWiqlPayload(payload: unknown, limit: number) {
  if (!isRecord(payload) || !Array.isArray(payload.workItems)) {
    return [];
  }

  return payload.workItems
    .map((item) => (isRecord(item) ? item.id : null))
    .filter((id): id is number => isWorkItemId(id))
    .slice(0, limit);
}

function workItemsFromBatchPayload(payload: unknown) {
  if (!isRecord(payload) || !Array.isArray(payload.value)) {
    return [];
  }

  return payload.value
    .map((item) => toAzureDevOpsWorkItem(item))
    .filter((item): item is AzureDevOpsWorkItem => item !== null);
}

function workItemsFromSearchPayload(payload: unknown, limit: number) {
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    return [];
  }

  return payload.results
    .map((item) => toAzureDevOpsWorkItemFromSearchResult(item))
    .filter((item): item is AzureDevOpsWorkItem => item !== null)
    .slice(0, limit);
}

function toAzureDevOpsWorkItemFromSearchResult(value: unknown) {
  if (!isRecord(value) || !isRecord(value.fields)) {
    return null;
  }

  const fields = value.fields;
  const id = readWorkItemId(readField(fields, "System.Id"));
  if (id === null) {
    return null;
  }

  const project =
    readString(readField(fields, "System.TeamProject")) ??
    (isRecord(value.project) ? readString(value.project.name) : null);

  return {
    id,
    title: readString(readField(fields, "System.Title")) ?? `Work item ${id}`,
    state: readString(readField(fields, "System.State")),
    type: readString(readField(fields, "System.WorkItemType")),
    project,
    assignedTo: readIdentity(readField(fields, "System.AssignedTo")),
    changedAt: readString(readField(fields, "System.ChangedDate")),
    tags: readString(readField(fields, "System.Tags")),
    url: project ? workItemWebUrl(project, id) : readString(value.url),
  };
}

function toAzureDevOpsWorkItem(value: unknown) {
  if (!isRecord(value) || !isWorkItemId(value.id)) {
    return null;
  }

  const fields = isRecord(value.fields) ? value.fields : {};
  const project = readString(readField(fields, "System.TeamProject"));
  return {
    id: value.id,
    title:
      readString(readField(fields, "System.Title")) ?? `Work item ${value.id}`,
    state: readString(readField(fields, "System.State")),
    type: readString(readField(fields, "System.WorkItemType")),
    project,
    assignedTo: readIdentity(readField(fields, "System.AssignedTo")),
    changedAt: readString(readField(fields, "System.ChangedDate")),
    tags: readString(readField(fields, "System.Tags")),
    url: project ? workItemWebUrl(project, value.id) : readString(value.url),
  };
}

async function readAzureDevOpsJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new AzureDevOpsWorkItemsError(
      "azure_devops_bad_response",
      502,
      "Azure DevOps returned malformed JSON.",
    );
  }
}

function azureDevOpsHeaders(accessToken: string) {
  return {
    accept: "application/json",
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json",
    "user-agent": "copilot-tracker",
  };
}

function escapeWiqlString(value: string) {
  return value.replaceAll("'", "''");
}

function readIdentity(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "displayName" in value) {
    const displayName = (value as { displayName?: unknown }).displayName;
    return typeof displayName === "string" ? displayName : null;
  }

  return null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readWorkItemId(value: unknown) {
  if (isWorkItemId(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return null;
  }

  return parseWorkItemId(value);
}

function readField(fields: Record<string, unknown>, referenceName: string) {
  if (referenceName in fields) {
    return fields[referenceName];
  }

  const normalizedReferenceName = referenceName.toLowerCase();
  const matchingKey = Object.keys(fields).find(
    (key) => key.toLowerCase() === normalizedReferenceName,
  );
  return matchingKey === undefined ? undefined : fields[matchingKey];
}

function isWorkItemId(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= maxAzureDevOpsWorkItemId
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function workItemWebUrl(project: string, id: number) {
  return `https://dev.azure.com/${encodeURIComponent(azureDevOpsOrg())}/${encodeURIComponent(project)}/_workitems/edit/${id}`;
}

function dedupeWorkItems(items: AzureDevOpsWorkItem[]) {
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

function orderWorkItemsByIds(items: AzureDevOpsWorkItem[], ids: number[]) {
  const indexById = new Map(ids.map((id, index) => [id, index]));
  return [...items].sort(
    (left, right) =>
      (indexById.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (indexById.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values)];
}

async function fetchWithRetry(
  url: URL,
  init: RequestInit,
): Promise<Response> {
  let lastResponse: Response | null = null;
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, init);
      lastResponse = response;
      if (!isRetryableStatus(response.status) || attempt === 3) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === 3) {
        break;
      }
    }
    await delay(
      lastResponse ? retryDelayMs(lastResponse, attempt) : 250 * attempt,
    );
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw new AzureDevOpsWorkItemsError(
    "azure_devops_network_error",
    502,
    lastError instanceof Error
      ? lastError.message
      : "Could not reach Azure DevOps.",
  );
}

async function fetchWithTimeout(
  url: URL,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 15_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

function retryDelayMs(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1000;
  }

  return 250 * 2 ** (attempt - 1);
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toAzureDevOpsError(response: Response) {
  const status = response.status;
  if (status === 401) {
    return new AzureDevOpsWorkItemsError(
      "azure_devops_unauthorized",
      status,
      "Azure DevOps authorization failed.",
    );
  }
  if (status === 403) {
    return new AzureDevOpsWorkItemsError(
      "azure_devops_forbidden",
      status,
      "Azure DevOps work-item access is missing.",
    );
  }
  if (status === 429) {
    return new AzureDevOpsWorkItemsError(
      "azure_devops_rate_limited",
      status,
      "Azure DevOps rate limit exceeded.",
    );
  }
  if (status >= 500) {
    return new AzureDevOpsWorkItemsError(
      "azure_devops_unavailable",
      status,
      "Azure DevOps is temporarily unavailable.",
    );
  }

  return new AzureDevOpsWorkItemsError(
    "azure_devops_error",
    status,
    `Azure DevOps returned HTTP ${status}.`,
  );
}
