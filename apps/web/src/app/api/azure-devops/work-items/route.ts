import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  authenticateIngestRequest,
  currentUser,
  readAzureDevOpsSessionAccessToken,
  sessionCookie,
} from "@/lib/auth";
import {
  AzureDevOpsWorkItemsError,
  azureDevOpsWorkItemsClientStatus,
  fetchAzureDevOpsWorkItemsByIds,
  searchAzureDevOpsWorkItems,
} from "@/lib/azureDevOpsWorkItems";
import { parseBearerToken } from "@/lib/authIdentity";
import { readUserBySessionId } from "@/lib/store";

const maxWorkItemIdsPerRequest = 50;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  const ids = parseWorkItemIds(request.nextUrl.searchParams.get("ids"));
  if (query.length === 0 && ids.length === 0) {
    return NextResponse.json({ workItems: [] });
  }

  const accessToken = await getAzureDevOpsAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const workItems =
      ids.length > 0
        ? await fetchAzureDevOpsWorkItemsByIds({ accessToken, ids })
        : await searchAzureDevOpsWorkItems({
            accessToken,
            query,
          });

    return NextResponse.json({ workItems });
  } catch (error) {
    if (error instanceof AzureDevOpsWorkItemsError) {
      return NextResponse.json(
        { error: error.code },
        { status: azureDevOpsWorkItemsClientStatus(error.status) },
      );
    }

    throw error;
  }
}

function parseWorkItemIds(value: string | null) {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(",")
        .map((id) => Number(id.trim()))
        .filter(
          (id) =>
            Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647,
        ),
    ),
  ].slice(0, maxWorkItemIdsPerRequest);
}

async function getAzureDevOpsAccessToken(request: NextRequest) {
  const bearerToken = parseBearerToken(request.headers.get("authorization"));
  if (bearerToken) {
    const trackerSessionUser = await readUserBySessionId(bearerToken);
    if (trackerSessionUser) {
      return readAzureDevOpsSessionAccessToken(bearerToken);
    }

    const user = await authenticateIngestRequest(request);
    return user ? bearerToken : null;
  }

  const user = await currentUser();
  if (!user) {
    return null;
  }

  const sessionId = request.cookies.get(sessionCookie())?.value;
  if (!sessionId) {
    return null;
  }

  return readAzureDevOpsSessionAccessToken(sessionId);
}
