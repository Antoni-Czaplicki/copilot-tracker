import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/store';
import { appBaseUrl } from '@/lib/config';
import { sessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(sessionCookie())?.value;
  if (sessionId) {
    await deleteSession(sessionId);
  }

  const response = NextResponse.redirect(new URL('/', appBaseUrl()));
  response.cookies.delete(sessionCookie());
  return response;
}
