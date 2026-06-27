import { NextResponse } from 'next/server';
import { appBaseUrl, requireGithubOAuthConfig } from '@/lib/config';
import { oauthStateCookie } from '@/lib/auth';

export async function GET() {
  const { clientId } = requireGithubOAuthConfig();
  const state = crypto.randomUUID();
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${appBaseUrl()}/api/auth/callback/github`);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);

  const response = NextResponse.redirect(url);
  response.cookies.set(oauthStateCookie(), state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/',
    sameSite: 'lax',
  });
  return response;
}
