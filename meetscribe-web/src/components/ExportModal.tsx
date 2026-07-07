import { useState, useEffect } from 'react';
import { ExtractionResult } from '../types/extraction';
import { getProviderProjects, getProviderIterations } from '../services/integrationService';
import { api } from '../services/apiClient';

const EXPORTABLE_SECTIONS: Record<string, string> = {
  action_items: 'Task',
  requirements: 'User Story',
  user_stories: 'User Story',
  bugs_reported: 'Bug',
  change_requests: 'User Story',
  blockers: 'Bug',
  risks: 'Task',
};

interface ExportItem {
  sectionLabel: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  stepsToReproduce: string;
  priority: string;
  workItemType: string;
  assignee: string;
  sourceQuote: string | null;
  selected: boolean;
  editing: boolean;
  status: 'pending' | 'creating' | 'success' | 'failed';
  result: { ticketId: number; ticketUrl: string; project: string; iteration: string | null; workItemType: string } | null;
}

interface ExportModalProps {
  result: ExtractionResult;
  provider: string;
  meetingName?: string;
  meetingId?: number;
  onClose: () => void;
  onExportComplete: (ticketIds: string[]) => void;
}

export function ExportModal({ result, provider, meetingName, meetingId, onClose }: ExportModalProps) {
  const [items, setItems] = useState<ExportItem[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [iterations, setIterations] = useState<string[]>([]);
  const [workItemTypes, setWorkItemTypes] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedIteration, setSelectedIteration] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState<string[] | null>(null);

  useEffect(() => {
    buildExportItems();
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const projs = await getProviderProjects(provider);
      setProjects(projs);

      // Load previously exported tickets for this meeting
      if (meetingId) {
        const response = await api.get(`/api/integrations/${provider}/exported/${meetingId}`);
        if (response.ok) {
          const body = await response.json();
          const exported: { title: string; externalTicketId: number; externalTicketUrl: string; project: string; iterationPath: string | null; workItemType: string }[] = body?.data || [];
          if (exported.length > 0) {
            // Pre-fill project and sprint from last export
            const lastExported = exported[0];
            if (lastExported.project && projs.includes(lastExported.project)) {
              setSelectedProject(lastExported.project);
            }
            if (lastExported.iterationPath) {
              setSelectedIteration(lastExported.iterationPath);
            }

            setItems(prev => prev.map(item => {
              const match = exported.find(e => e.title === item.title);
              if (match) {
                return {
                  ...item,
                  selected: false,
                  status: 'success' as const,
                  result: {
                    ticketId: match.externalTicketId,
                    ticketUrl: match.externalTicketUrl,
                    project: match.project,
                    iteration: match.iterationPath || null,
                    workItemType: match.workItemType,
                  },
                };
              }
              return item;
            }));
          }
        }
      }
    } catch {} finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (selectedProject) {
      getProviderIterations(provider, selectedProject).then(setIterations);
      api.get(`/api/integrations/${provider}/workitemtypes?project=${encodeURIComponent(selectedProject)}`)
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            setError('Your PAT token lacks permission to access this project. Update your connection in Settings.');
            return null;
          }
          return res.ok ? res.json() : null;
        })
        .then(body => {
          if (body?.data) {
            const types: string[] = body.data;
            setWorkItemTypes(types);

            setItems(prev => prev.map(item => {
              if (item.status !== 'pending') return item;
              if (types.includes(item.workItemType)) return item;
              let mapped = item.workItemType;
              if (mapped === 'User Story') mapped = types.find(t => t === 'Product Backlog Item') || types.find(t => t === 'Issue') || types[0] || mapped;
              else if (mapped === 'Bug') mapped = types.find(t => t === 'Bug') || types[0] || mapped;
              else if (mapped === 'Task') mapped = types.find(t => t === 'Task') || types[0] || mapped;
              else mapped = types[0] || mapped;
              return { ...item, workItemType: mapped };
            }));
          }
        })
        .catch(() => setError('Failed to load work item types. Check your connection.'));
    }
  }, [selectedProject]);

  function buildExportItems() {
    const exportItems: ExportItem[] = [];
    for (const section of (result.sections || [])) {
      if (!EXPORTABLE_SECTIONS[section.type]) continue;
      if (!section.data || !Array.isArray(section.data)) continue;

      for (const item of section.data) {
        const title = item.title ||
          (item.role ? `As a ${item.role}, I want to ${item.action}` : '') ||
          item.description || item.question || item.item || 'Untitled';

        exportItems.push({
          sectionLabel: section.label,
          title: item.title || title,
          description: item.description || item.feedback || item.action || '',
          acceptanceCriteria: item.acceptance_criteria || '',
          stepsToReproduce: item.steps_to_reproduce || '',
          priority: item.priority || '',
          workItemType: EXPORTABLE_SECTIONS[section.type],
          assignee: item.assignee || '',
          sourceQuote: item.source_quote || null,
          selected: true,
          editing: false,
          status: 'pending',
          result: null,
        });
      }
    }
    setItems(exportItems);
  }

  function toggleItem(index: number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, selected: !item.selected } : item));
  }

  function toggleEdit(index: number) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, editing: !item.editing } : item));
  }

  function updateItem(index: number, field: keyof ExportItem, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  async function handleExport(force = false) {
    if (!selectedProject) { setError('Please select a project.'); return; }
    const toExport = items.filter(i => i.selected && i.status === 'pending');
    if (toExport.length === 0) { setError('No items selected for export.'); return; }

    setIsExporting(true);
    setError('');

    // Mark all selected as creating
    setItems(prev => prev.map(it => it.selected && it.status === 'pending' ? { ...it, status: 'creating' as const } : it));

    // Build batch request — descriptions assembled on frontend
    const batchItems = toExport.map(item => {
      let description = item.description;
      if (item.acceptanceCriteria) {
        description += `\n\nAcceptance Criteria:\n${item.acceptanceCriteria.split(';').map(c => `• ${c.trim()}`).join('\n')}`;
      }
      if (item.stepsToReproduce) {
        description += `\n\nSteps to Reproduce:\n${item.stepsToReproduce}`;
      }
      if (item.sourceQuote) {
        description += `\n\n---\nSource: "${item.sourceQuote}"`;
      }
      if (meetingName) {
        description += `\nExtracted from: ${meetingName} (MeetScribe)`;
      }
      return {
        title: item.title,
        description,
        workItemType: item.workItemType,
        priority: mapPriority(item.priority),
        assignedTo: item.assignee || undefined,
        tags: 'MeetScribe',
      };
    });

    try {
      const response = await api.post(`/api/integrations/${provider}/export/batch`, {
        project: selectedProject,
        iterationPath: selectedIteration || undefined,
        meetingId: meetingId || undefined,
        force,
        items: batchItems,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        const errMsg = errBody?.message || errBody?.data?.message;
        if (response.status === 401) {
          setError('Access denied. Your PAT token may have expired or lacks "Work Items (Read & Write)" permission. Update your connection in Settings.');
        } else if (response.status === 403) {
          setError('Permission denied. Your PAT does not have access to push work items to this project. Check your token scopes in Azure DevOps.');
        } else {
          setError(errMsg || 'Export failed. Please check your connection and try again.');
        }
        setItems(prev => prev.map(it => it.status === 'creating' ? { ...it, status: 'failed' as const } : it));
        setIsExporting(false);
        return;
      }

      const responseBody = await response.json();
      const data = responseBody?.data || responseBody;

      // Duplicates found — show overlay popup
      if (data.status === 'duplicates_found') {
        setDuplicateWarning(data.duplicates);
        setItems(prev => prev.map(it => it.status === 'creating' ? { ...it, status: 'pending' as const } : it));
        setIsExporting(false);
        return;
      }

      // Tickets created — update each card by title match
      if (data.status === 'created' && data.results) {
        setItems(prev => prev.map(it => {
          if (it.status !== 'creating') return it;
          const match = data.results.find((r: any) => r.title === it.title);
          if (match?.success) {
            return {
              ...it,
              status: 'success' as const,
              result: { ticketId: match.ticketId, ticketUrl: match.ticketUrl, project: selectedProject, iteration: selectedIteration || null, workItemType: it.workItemType },
            };
          }
          return { ...it, status: 'failed' as const };
        }));
      }
    } catch {
      setError('Export failed. Check your connection.');
      setItems(prev => prev.map(it => it.status === 'creating' ? { ...it, status: 'failed' as const } : it));
    } finally {
      setIsExporting(false);
    }
  }

  function proceedWithExport() {
    setDuplicateWarning(null);
    handleExport(true);
  }


  const totalCount = items.length;
  const selectedCount = items.filter(i => i.selected && i.status === 'pending').length;
  const exportedCount = items.filter(i => i.status === 'success').length;
  const failedCount = items.filter(i => i.status === 'failed').length;
  const selectedFailedCount = items.filter(i => i.selected && i.status === 'failed').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative card shadow-modal p-8 text-center text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/40" onClick={isExporting ? undefined : onClose} />

      <div className="relative card shadow-modal w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Export to {provider === 'AzureDevOps' ? 'Azure DevOps' : provider}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {exportedCount > 0 || failedCount > 0
                ? `${exportedCount} of ${totalCount} created${failedCount > 0 ? ` · ${failedCount} failed` : ''}${pendingCount > 0 ? ` · ${pendingCount} remaining` : ''}`
                : `${selectedCount} of ${totalCount} ticket${selectedCount !== 1 ? 's' : ''} selected`}
            </p>
          </div>
          {!isExporting && <button onClick={onClose} className="btn-ghost">✕</button>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Project & Iteration — from DevOps API */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                DevOps Project <span className="text-red-400">*</span>
              </label>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="select-field" disabled={isExporting}>
                <option value="">Select project...</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Iteration / Sprint</label>
              <select value={selectedIteration} onChange={(e) => setSelectedIteration(e.target.value)} className="select-field" disabled={isExporting || !selectedProject}>
                <option value="">Select iteration...</option>
                {iterations.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Ticket Cards */}
          <div className="space-y-4 mb-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`border rounded-xl overflow-hidden transition-all ${
                  item.status === 'success' ? 'border-green-200 bg-green-50/30' :
                  item.status === 'failed' ? 'border-red-200' :
                  item.selected ? 'border-slate-200' : 'border-slate-100 opacity-40'
                }`}
              >
                {/* Card Header */}
                <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${
                  item.status === 'success' ? 'bg-green-50 border-green-100' :
                  item.status === 'failed' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
                }`}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(idx)}
                    className="shrink-0"
                    disabled={isExporting || item.status === 'success'}
                  />
                  <span className="text-[10px] text-slate-400 flex-1">{item.sectionLabel}</span>

                  {item.status === 'pending' && (
                    <>
                      <select
                        value={item.workItemType}
                        onChange={(e) => updateItem(idx, 'workItemType', e.target.value)}
                        className="text-[10px] border border-slate-200 rounded px-2 py-0.5 bg-white"
                        disabled={isExporting}
                      >
                        {workItemTypes.length > 0 ? (
                          workItemTypes.map(t => <option key={t} value={t}>{t}</option>)
                        ) : (
                          <>
                            <option value="Task">Task</option>
                            <option value="User Story">User Story</option>
                            <option value="Bug">Bug</option>
                            <option value="Feature">Feature</option>
                          </>
                        )}
                      </select>
                      <select
                        value={item.priority}
                        onChange={(e) => updateItem(idx, 'priority', e.target.value)}
                        className="text-[10px] border border-slate-200 rounded px-2 py-0.5 bg-white"
                        disabled={isExporting}
                      >
                        <option value="">No Priority</option>
                        <option value="P1">P1 - Critical</option>
                        <option value="P2">P2 - High</option>
                        <option value="P3">P3 - Medium</option>
                        <option value="P4">P4 - Low</option>
                      </select>
                      <button
                        onClick={() => toggleEdit(idx)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
                        disabled={isExporting}
                      >
                        {item.editing ? 'Done' : 'Edit'}
                      </button>
                    </>
                  )}

                  {item.status === 'success' && (
                    <span className="text-[10px] bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">✓ Created</span>
                  )}
                  {item.status === 'failed' && (
                    <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full">✗ Failed</span>
                  )}
                  {item.status === 'creating' && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full animate-pulse">⏳ Creating...</span>
                  )}
                  {item.status === 'pending' && (exportedCount > 0 || failedCount > 0) && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">⏳ Pending</span>
                  )}
                </div>

                {/* Card Body */}
                <div className="px-4 py-3">
                  {/* Title */}
                  {item.editing ? (
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(idx, 'title', e.target.value)}
                      className="w-full text-sm font-semibold text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 mb-2 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-900 mb-2">{item.title}</p>
                  )}

                  {/* Description */}
                  {item.editing ? (
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-3 py-2 mb-3 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                      rows={2}
                      placeholder="Description..."
                    />
                  ) : (
                    item.description && <p className="text-xs text-slate-600 mb-3">{item.description}</p>
                  )}

                  {/* Acceptance Criteria */}
                  {(item.acceptanceCriteria || item.editing) && (
                    <div className="mb-3">
                      <p className="text-[10px] text-green-700 font-medium uppercase mb-1">Acceptance Criteria</p>
                      {item.editing ? (
                        <textarea
                          value={item.acceptanceCriteria}
                          onChange={(e) => updateItem(idx, 'acceptanceCriteria', e.target.value)}
                          className="w-full text-xs border border-green-200 bg-green-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-200 outline-none resize-none"
                          rows={3}
                          placeholder="Separate criteria with semicolons (;)"
                        />
                      ) : (
                        <div className="text-xs text-slate-700 bg-green-50 border border-green-100 rounded-lg p-2.5">
                          {item.acceptanceCriteria.split(';').filter(c => c.trim()).map((criteria, i) => (
                            <p key={i} className="flex items-start gap-1.5 mb-0.5 last:mb-0">
                              <span className="text-green-600 shrink-0">•</span>
                              <span>{criteria.trim()}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Steps to Reproduce (bugs) */}
                  {(item.stepsToReproduce || (item.editing && item.workItemType === 'Bug')) && (
                    <div className="mb-3">
                      <p className="text-[10px] text-red-700 font-medium uppercase mb-1">Steps to Reproduce</p>
                      {item.editing ? (
                        <textarea
                          value={item.stepsToReproduce}
                          onChange={(e) => updateItem(idx, 'stepsToReproduce', e.target.value)}
                          className="w-full text-xs border border-red-200 bg-red-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-200 outline-none resize-none"
                          rows={2}
                          placeholder="Steps to reproduce..."
                        />
                      ) : (
                        <p className="text-xs text-slate-700 bg-red-50 border border-red-100 rounded-lg p-2.5">
                          {item.stepsToReproduce}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Assignee (always editable) */}
                  {item.status === 'pending' && (
                    <div className="mb-3">
                      <p className="text-[10px] text-slate-500 font-medium uppercase mb-1">Assignee</p>
                      <input
                        type="text"
                        value={item.assignee}
                        onChange={(e) => updateItem(idx, 'assignee', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-200 outline-none"
                        placeholder="Email address (leave empty for unassigned)"
                        disabled={isExporting}
                      />
                    </div>
                  )}

                  {/* Source Quote (read-only) */}
                  {item.sourceQuote && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 italic">
                        Source: "{item.sourceQuote}"
                      </p>
                    </div>
                  )}

                  {/* Export Result — shown after export */}
                  {item.status === 'success' && item.result && (
                    <div className="mt-3 border border-green-200 bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-green-800 font-semibold">
                          Ticket #{item.result.ticketId}
                        </span>
                        <a
                          href={item.result.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          Open in DevOps
                        </a>
                      </div>
                      <div className="mt-1.5 flex gap-4 text-[10px] text-green-700">
                        <span><span className="font-medium">Project:</span> {item.result.project}</span>
                        {item.result.iteration && <span><span className="font-medium">Sprint:</span> {item.result.iteration}</span>}
                        <span><span className="font-medium">Type:</span> {item.result.workItemType}</span>
                      </div>
                    </div>
                  )}

                  {item.status === 'failed' && (
                    <div className="mt-3 border border-red-200 bg-red-50 rounded-lg p-2.5">
                      <span className="text-[10px] text-red-700 font-medium">Failed to create ticket. Check connection and retry.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No exportable items found. Only action items, requirements, bugs, and change requests can be exported.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

        </div>

        {/* Export Summary */}
        {(exportedCount > 0 || failedCount > 0) && (
          <div className="px-6 py-2 border-t border-slate-100 bg-slate-50 flex items-center gap-4 text-[10px] shrink-0">
            <span className="text-slate-500">Total: <strong>{totalCount}</strong></span>
            {exportedCount > 0 && <span className="text-green-700">Created: <strong>{exportedCount}</strong></span>}
            {failedCount > 0 && <span className="text-red-700">Failed: <strong>{failedCount}</strong></span>}
            {pendingCount > 0 && <span className="text-slate-500">Remaining: <strong>{pendingCount}</strong></span>}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {exportedCount === 0 && selectedCount > 0 && selectedProject && (
              <span>{selectedCount} ticket{selectedCount !== 1 ? 's' : ''} → <strong>{selectedProject}</strong>{selectedIteration ? ` / ${selectedIteration}` : ''}</span>
            )}
          </div>
          <div className="flex gap-2">
            {!isExporting && (
              <button onClick={onClose} className="btn-secondary">
                {exportedCount > 0 || failedCount > 0 ? 'Close' : 'Cancel'}
              </button>
            )}
            {selectedFailedCount > 0 && !isExporting && (
              <button
                onClick={() => {
                  setItems(prev => prev.map(it => it.status === 'failed' && it.selected ? { ...it, status: 'pending' as const } : it));
                  setError('');
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg"
              >
                Retry Failed ({selectedFailedCount})
              </button>
            )}
            {selectedCount > 0 && (
              <button
                onClick={() => handleExport()}
                disabled={isExporting || selectedCount === 0 || !selectedProject}
                className="btn-primary disabled:opacity-50"
              >
                {isExporting ? 'Creating...' :
                  exportedCount > 0 || failedCount > 0 ? `Create Remaining ${selectedCount} Ticket${selectedCount !== 1 ? 's' : ''}` :
                  `Create ${selectedCount} Ticket${selectedCount !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      {/* Duplicate Warning — Overlay Popup (centered on top of modal) */}
      {duplicateWarning && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 rounded-2xl" onClick={() => setDuplicateWarning(null)} />
          <div className="relative bg-white border border-orange-200 shadow-lg rounded-xl p-5 mx-8 max-w-md">
            <p className="text-sm font-semibold text-orange-900 mb-2">
              Duplicate tickets detected
            </p>
            <p className="text-xs text-orange-700 mb-3">
              {duplicateWarning.length} ticket(s) already exist with similar titles:
            </p>
            <div className="space-y-1.5 mb-4 max-h-32 overflow-y-auto">
              {duplicateWarning.map((name, i) => (
                <p key={i} className="text-xs text-orange-800 flex items-start gap-1.5">
                  <span className="text-orange-500 shrink-0">•</span>
                  <span>{name}</span>
                </p>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithExport}
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg"
              >
                Create Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function mapPriority(priority: string | null): number | undefined {
  if (!priority) return undefined;
  switch (priority.toUpperCase()) {
    case 'P1': return 1;
    case 'P2': return 2;
    case 'P3': return 3;
    case 'P4': return 4;
    default: return undefined;
  }
}
