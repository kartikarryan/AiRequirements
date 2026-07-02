import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCodeForTokens, parseIdToken } from '../config/auth';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(params.get('error_description') || 'Authentication failed');
      return;
    }

    if (!code) {
      setError('No authorization code received');
      return;
    }

    exchangeCodeForTokens(code)
      .then((tokens) => {
        const expiresAt = Date.now() + tokens.expires_in * 1000;
        localStorage.setItem('meetscribe_access_token', tokens.access_token);
        localStorage.setItem('meetscribe_id_token', tokens.id_token);
        if (tokens.refresh_token) {
          localStorage.setItem('meetscribe_refresh_token', tokens.refresh_token);
        }
        localStorage.setItem('meetscribe_expires_at', expiresAt.toString());

        parseIdToken(tokens.id_token);
        navigate('/', { replace: true });
        window.location.reload();
      })
      .catch(() => {
        setError('Failed to complete sign-in. Please try again.');
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Sign-in Failed</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <a href="/" className="btn-primary inline-block">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-600">Completing sign-in...</p>
      </div>
    </div>
  );
}
