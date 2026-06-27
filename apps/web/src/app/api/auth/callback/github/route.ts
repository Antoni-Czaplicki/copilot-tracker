import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createUserSession, fetchGitHubUser, oauthStateCookie, sessionCookie } from '@/lib/auth';
import { appBaseUrl, MissingGithubOAuthConfigError, requireGithubOAuthConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get(oauthStateCookie())?.value;
  if (code === null || code === '' || state === null || state === '' || state !== expectedState) {
    return NextResponse.redirect(new URL('/?auth=failed', appBaseUrl()));
  }

  let githubOAuthConfig: ReturnType<typeof requireGithubOAuthConfig>;
  try {
    githubOAuthConfig = requireGithubOAuthConfig();
  } catch (error) {
    if (error instanceof MissingGithubOAuthConfigError) {
      return NextResponse.redirect(new URL('/?auth=misconfigured', appBaseUrl()));
    }

    throw error;
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      client_id: githubOAuthConfig.clientId,
      client_secret: githubOAuthConfig.clientSecret,
      code,
      redirect_uri: `${appBaseUrl()}/api/auth/callback/github`,
    }),
  });
  const tokenPayload = await tokenResponse.json() as { access_token?: string };
  if (tokenPayload.access_token === undefined || tokenPayload.access_token === '') {
    return NextResponse.redirect(new URL('/?auth=failed', appBaseUrl()));
  }

  const githubUser = await fetchGitHubUser(tokenPayload.access_token);
  if (githubUser === null) {
    return NextResponse.redirect(new URL('/?auth=failed', appBaseUrl()));
  }

  const sessionId = await createUserSession(githubUser);
  const response = NextResponse.redirect(new URL('/dashboard', appBaseUrl()));
  response.cookies.set(sessionCookie(), sessionId, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  });
  response.cookies.delete(oauthStateCookie());
  return response;
}
