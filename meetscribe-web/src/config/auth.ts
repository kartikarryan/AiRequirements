export const AUTH_CONFIG = {
  region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_S2eFQMrNe',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '1r0evjt566o518v8e2comdb7ok',
  domain: import.meta.env.VITE_COGNITO_DOMAIN || 'us-east-1s2efqmrne.auth.us-east-1.amazoncognito.com',
  redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  logoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI || window.location.origin,
  scopes: ['openid', 'email', 'profile'],
};

export function getLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    response_type: 'code',
    scope: AUTH_CONFIG.scopes.join(' '),
    redirect_uri: AUTH_CONFIG.redirectUri,
    identity_provider: 'Google',
  });
  return `https://${AUTH_CONFIG.domain}/oauth2/authorize?${params.toString()}`;
}

export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    logout_uri: AUTH_CONFIG.logoutUri,
  });
  return `https://${AUTH_CONFIG.domain}/logout?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const response = await fetch(`https://${AUTH_CONFIG.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: AUTH_CONFIG.clientId,
      code,
      redirect_uri: AUTH_CONFIG.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange authorization code for tokens');
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const response = await fetch(`https://${AUTH_CONFIG.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: AUTH_CONFIG.clientId,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return response.json();
}

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface CognitoUser {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

export function parseIdToken(idToken: string): CognitoUser {
  const payload = JSON.parse(atob(idToken.split('.')[1]));
  return {
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture,
    sub: payload.sub,
  };
}
