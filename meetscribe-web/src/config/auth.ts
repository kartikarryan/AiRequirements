export const AUTH_CONFIG = {
  region: import.meta.env.VITE_COGNITO_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_S2eFQMrNe',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '1r0evjt566o518v8e2comdb7ok',
  domain: import.meta.env.VITE_COGNITO_DOMAIN || 'us-east-1s2efqmrne.auth.us-east-1.amazoncognito.com',
  redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  logoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI || window.location.origin,
  scopes: ['openid', 'email', 'profile'],
};

// PKCE helpers
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function getLoginUrl(): Promise<string> {
  try {
    const codeVerifier = generateRandomString(64);
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);

    const challengeBuffer = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(challengeBuffer);

    const params = new URLSearchParams({
      client_id: AUTH_CONFIG.clientId,
      response_type: 'code',
      scope: AUTH_CONFIG.scopes.join(' '),
      redirect_uri: AUTH_CONFIG.redirectUri,
      identity_provider: 'Google',
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });
    return `https://${AUTH_CONFIG.domain}/oauth2/authorize?${params.toString()}`;
  } catch {
    // Fallback without PKCE if crypto.subtle unavailable
    sessionStorage.removeItem('pkce_code_verifier');
    const params = new URLSearchParams({
      client_id: AUTH_CONFIG.clientId,
      response_type: 'code',
      scope: AUTH_CONFIG.scopes.join(' '),
      redirect_uri: AUTH_CONFIG.redirectUri,
      identity_provider: 'Google',
    });
    return `https://${AUTH_CONFIG.domain}/oauth2/authorize?${params.toString()}`;
  }
}

export function getLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: AUTH_CONFIG.clientId,
    logout_uri: AUTH_CONFIG.logoutUri,
  });
  return `https://${AUTH_CONFIG.domain}/logout?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<TokenResponse> {
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');

  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: AUTH_CONFIG.clientId,
    code,
    redirect_uri: AUTH_CONFIG.redirectUri,
  };

  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }

  const response = await fetch(`https://${AUTH_CONFIG.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Token exchange error:', response.status, errorBody);
    throw new Error(`Token exchange failed: ${errorBody}`);
  }

  sessionStorage.removeItem('pkce_code_verifier');
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
