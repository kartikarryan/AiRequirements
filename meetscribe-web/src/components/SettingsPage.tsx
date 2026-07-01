/**
 * =============================================================================
 * MeetScribe — Integration Settings (Config-Driven, Multi-Provider)
 * =============================================================================
 *
 * Renders provider cards and setup forms dynamically from config.
 * Adding a new provider = add to integrations-config.json. Zero UI code change.
 * =============================================================================
 */

import { useState, useEffect } from 'react';
import {
  ProviderConfig,
  ConnectedProvider,
  getConnectedIntegrations,
  testProviderConnection,
  saveProviderSettings,
  disconnectProvider,
} from '../services/integrationService';

// Hardcoded provider config (future: fetch from GET /api/integrations/config)
const PROVIDERS: ProviderConfig[] = [
  {
    id: 'AzureDevOps', name: 'Azure DevOps', icon: 'AD', color: '#0078D4',
    description: 'Create work items in Azure DevOps boards', available: true,
    fields: [
      { key: 'organizationUrl', label: 'Organization URL', type: 'url', required: true, placeholder: 'https://dev.azure.com/your-org', helpText: 'Your Azure DevOps organization URL' },
      { key: 'accessToken', label: 'Personal Access Token (PAT)', type: 'password', required: true, placeholder: 'Paste your PAT here', helpText: 'Required scopes: Work Items (Read & Write), Project (Read)', helpLink: 'https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate' },
      { key: 'patExpiryDate', label: 'PAT Expiry Date', type: 'date', required: false, helpText: "We'll notify you before it expires" },
    ],
  },
  {
    id: 'Jira', name: 'Jira', icon: 'J', color: '#0052CC',
    description: 'Export issues to Jira projects', available: false,
    fields: [
      { key: 'domain', label: 'Jira Domain', type: 'url', required: true, placeholder: 'https://your-company.atlassian.net' },
      { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'your-email@company.com' },
      { key: 'apiToken', label: 'API Token', type: 'password', required: true, placeholder: 'Paste your Jira API token', helpLink: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
    ],
  },
  {
    id: 'Linear', name: 'Linear', icon: 'L', color: '#5E6AD2',
    description: 'Create issues in Linear teams', available: false,
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'lin_api_...', helpLink: 'https://linear.app/settings/api' },
    ],
  },
];

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [connectedProviders, setConnectedProviders] = useState<ConnectedProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'setup' | 'manage'>('list');
  const [activeProvider, setActiveProvider] = useState<ProviderConfig | null>(null);
  const [activeConnection, setActiveConnection] = useState<ConnectedProvider | null>(null);

  // Dynamic form state
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadConnections(); }, []);

  async function loadConnections() {
    try {
      const result = await getConnectedIntegrations();
      setConnectedProviders(result.data || []);
    } catch {} finally {
      setIsLoading(false);
    }
  }

  function getConnection(providerId: string): ConnectedProvider | undefined {
    return connectedProviders.find(c => c.provider === providerId);
  }

  function startSetup(provider: ProviderConfig) {
    setActiveProvider(provider);
    setFormValues({});
    setError('');
    setActiveView('setup');
  }

  function openManage(provider: ProviderConfig) {
    const conn = getConnection(provider.id);
    setActiveProvider(provider);
    setActiveConnection(conn || null);
    setActiveView('manage');
  }

  async function handleConnect() {
    if (!activeProvider) return;

    // Validate required fields
    const missing = activeProvider.fields
      .filter(f => f.required && !formValues[f.key]?.trim())
      .map(f => f.label);

    if (missing.length > 0) {
      setError(`Required: ${missing.join(', ')}`);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Test connection
      const result = await testProviderConnection(activeProvider.id, formValues);

      if (!result.success) {
        setError(result.message || 'Connection failed. Check your credentials.');
        setIsProcessing(false);
        return;
      }

      // Save
      await saveProviderSettings(activeProvider.id, formValues);
      await loadConnections();
      setActiveView('list');
      setFormValues({});
    } catch (err: any) {
      setError(err.userMessage || 'Failed to save. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDisconnect(providerId: string) {
    if (!confirm('Disconnect this integration? You can reconnect anytime.')) return;
    try {
      await disconnectProvider(providerId);
      await loadConnections();
      setActiveView('list');
    } catch {
      setError('Failed to disconnect.');
    }
  }

  if (isLoading) return <div className="text-center py-12 text-slate-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={activeView === 'list' ? onBack : () => setActiveView('list')} className="btn-ghost text-xs">
          &larr; {activeView === 'list' ? 'Back' : 'Integrations'}
        </button>
        <h1 className="text-lg font-semibold text-slate-900">
          {activeView === 'list' ? 'Integration Settings' : activeProvider?.name || ''}
        </h1>
      </div>

      {/* PROVIDER LIST */}
      {activeView === 'list' && (
        <div>
          <p className="text-sm text-slate-500 mb-6">
            Connect your ticket management system to export approved items as work items.
          </p>
          <div className="space-y-3">
            {PROVIDERS.map(provider => {
              const conn = getConnection(provider.id);
              return (
                <div key={provider.id} className={`card p-4 ${!provider.available && !conn ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: provider.color }}>
                      <span className="text-white font-bold text-sm">{provider.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{provider.name}</h3>
                        {conn && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full">Connected</span>}
                      </div>
                      <p className="text-xs text-slate-500">{conn ? conn.settings?.organizationUrl || conn.settings?.domain || 'Connected' : provider.description}</p>
                      {conn?.settings?.patExpiryDate && <PatExpiryBadge expiryDate={conn.settings.patExpiryDate} />}
                    </div>
                    <div className="shrink-0">
                      {conn ? (
                        <div className="flex gap-2">
                          <button onClick={() => openManage(provider)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Manage</button>
                          <button onClick={() => handleDisconnect(provider.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Disconnect</button>
                        </div>
                      ) : provider.available ? (
                        <button onClick={() => startSetup(provider)} className="btn-primary text-xs">Connect</button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Coming Soon</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DYNAMIC SETUP FORM */}
      {activeView === 'setup' && activeProvider && (
        <div className="card p-6">
          <p className="text-xs text-slate-500 mb-5">{activeProvider.description}</p>

          <div className="space-y-4">
            {activeProvider.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                  {!field.required && <span className="text-slate-400 font-normal"> (optional)</span>}
                </label>
                <input
                  type={field.type}
                  value={formValues[field.key] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="input-field"
                  disabled={isProcessing}
                />
                {(field.helpText || field.helpLink) && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {field.helpText}
                    {field.helpLink && (
                      <a href={field.helpLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                        Learn more →
                      </a>
                    )}
                  </p>
                )}
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isProcessing}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isProcessing ? 'Connecting...' : 'Connect'}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Tests connection and saves settings if successful.
            </p>
          </div>
        </div>
      )}

      {/* MANAGE VIEW */}
      {activeView === 'manage' && activeProvider && activeConnection && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
            <span className="text-sm font-medium text-green-700">Active Connection</span>
          </div>

          {activeConnection.settings?.patExpiryDate && (
            <PatExpiryNotification expiryDate={activeConnection.settings.patExpiryDate} />
          )}

          <div className="space-y-3 text-sm mb-6">
            {activeProvider.fields.filter(f => f.type !== 'password').map(field => (
              <div key={field.key} className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">{field.label}</span>
                <span className="text-slate-900 font-medium text-xs">
                  {activeConnection.settings?.[field.key] || '—'}
                </span>
              </div>
            ))}
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Token</span>
              <span className="text-slate-900 font-mono text-xs">
                {activeProvider.fields.filter(f => f.type === 'password').map(f => activeConnection.settings?.[f.key] || '****').join(', ')}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Connected since</span>
              <span className="text-slate-900 text-xs">{new Date(activeConnection.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => startSetup(activeProvider)} className="btn-secondary flex-1">Update Connection</button>
            <button onClick={() => handleDisconnect(activeProvider.id)} className="btn-danger flex-1">Disconnect</button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PAT Expiry Components
// =============================================================================

function PatExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠ Token expired</p>;
  if (daysLeft <= 7) return <p className="text-[10px] text-red-600 font-medium mt-0.5">⚠ Expires in {daysLeft} days</p>;
  if (daysLeft <= 30) return <p className="text-[10px] text-yellow-600 mt-0.5">Expires in {daysLeft} days</p>;
  return <p className="text-[10px] text-green-600 mt-0.5">Valid for {daysLeft} days</p>;
}

function PatExpiryNotification({ expiryDate }: { expiryDate: string }) {
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-5">
      <p className="text-xs text-red-700 font-medium">⚠ Token Expired</p>
      <p className="text-[11px] text-red-600 mt-0.5">Expired {Math.abs(daysLeft)} days ago. Export will not work. Please update your connection.</p>
    </div>
  );

  if (daysLeft <= 7) return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-5">
      <p className="text-xs text-red-700 font-medium">⚠ Expiring Soon</p>
      <p className="text-[11px] text-red-600 mt-0.5">Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Please regenerate your token.</p>
    </div>
  );

  if (daysLeft <= 30) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 mb-5">
      <p className="text-xs text-yellow-700 font-medium">Expires in {daysLeft} days</p>
      <p className="text-[11px] text-yellow-600 mt-0.5">Consider regenerating soon ({expiry.toLocaleDateString()}).</p>
    </div>
  );

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-5">
      <p className="text-[11px] text-green-700">✓ Token valid until {expiry.toLocaleDateString()} ({daysLeft} days)</p>
    </div>
  );
}
