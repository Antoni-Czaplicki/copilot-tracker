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
  searchAzureDevOpsWorkItems,
} from "@/lib/azureDevOpsWorkItems";
import { parseBearerToken } from "@/lib/authIdentity";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  if (query.length === 0) {
    return NextResponse.json({ workItems: [] });
  }

  const accessToken = await getAzureDevOpsAccessToken(request);
  if (!accessToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const workItems = await searchAzureDevOpsWorkItems({
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

async function getAzureDevOpsAccessToken(request: NextRequest) {
  const bearerToken = parseBearerToken(request.headers.get("authorization"));
  if (bearerToken) {
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
