/**
 * =============================================================================
 * MeetScribe Web — Main Application
 * =============================================================================
 *
 * Navigation:
 *   Projects Grid → Project Detail (meetings) → Document Drawer
 * =============================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ExtractionResult } from './types/extraction';
import { uploadAndExtract, getMeetingsByProject, getMeetingById, deleteMeeting, saveEditedExtraction, retryExtraction, searchMeetings } from './services/meetingService';
import { getAllProjects, createProject, deleteProject, Project } from './services/projectService';
import { DocumentView } from './components/DocumentView';
import { UploadModal } from './components/UploadModal';
import { ExportModal } from './components/ExportModal';
import { ResultPopup } from './components/ResultPopup';
import { getConnectedIntegrations } from './services/integrationService';
import { useAuth } from './context/AuthContext';

interface MeetingEntry {
  id: number;
  name: string;
  description: string | null;
  templateId: string;
  projectId: number | null;
  projectName: string | null;
  audioFileName: string;
  audioFileSize: number;
  meetingDate: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export function App() {
  const params = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Derive active IDs from URL (survives refresh)
  const activeProjectId = params.projectId ? Number(params.projectId) : null;
  const selectedMeetingId = params.meetingId ? Number(params.meetingId) : null;

  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<MeetingEntry[]>([]);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [originalResult, setOriginalResult] = useState<ExtractionResult | null>(null);
  const [isEdited, setIsEdited] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [connectedProvider, setConnectedProvider] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [meetingSearchTerm, setMeetingSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [filterTemplate, setFilterTemplate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [popup, setPopup] = useState<{ type: 'success' | 'error' | 'nodata'; message: string } | null>(null);

  /** Load projects on mount (projects page needs this) */
  const loadProjects = useCallback(async () => {
    try {
      const projectsData = await getAllProjects();
      setProjects(projectsData);
    } catch {} finally {
      setIsLoading(false);
    }
  }, []);

  // Check if any integration is connected (for showing export button)
  useEffect(() => {
    getConnectedIntegrations().then(result => {
      if (result.configured && result.data?.length > 0) {
        setConnectedProvider(result.data[0].provider);
      }
    }).catch(() => {});
  }, []);

  /** Load meetings for a specific project (called when entering a project) */
  const loadMeetings = useCallback(async (projId: number) => {
    try {
      const meetingsData = await getMeetingsByProject(projId);
      setMeetings(meetingsData);
    } catch {
      setMeetings([]);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Load meetings when activeProjectId changes (URL navigation)
  useEffect(() => {
    if (activeProjectId !== null) {
      loadMeetings(activeProjectId);
    } else {
      setMeetings([]);
    }
  }, [activeProjectId, loadMeetings]);

  // Auto-open drawer if meetingId is in URL (handles page refresh)
  useEffect(() => {
    if (selectedMeetingId && !extractionResult && !isLoading) {
      getMeetingById(selectedMeetingId).then((full) => {
        if (full?.extractionResultJson) {
          const original = JSON.parse(full.extractionResultJson);
          setOriginalResult(original);
          setExtractionResult(full.editedResultJson ? JSON.parse(full.editedResultJson) : original);
          setIsEdited(!!full.editedResultJson);
          setShowDrawer(true);
        }
      }).catch(() => {});
    }
  }, [selectedMeetingId, isLoading]);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Debounced server-side search — single behavior, no confusion
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Apply filters: search results (if active) → then client-side dropdown filters
  const baseMeetings = searchResults !== null ? searchResults : meetings;
  const projectMeetings = baseMeetings.filter((m) => {
    if (filterTemplate && m.templateId !== filterTemplate) return false;
    if (filterStatus && m.status !== filterStatus) return false;
    if (filterDateFrom) {
      const meetingDate = new Date(m.meetingDate || m.createdAt).getTime();
      if (meetingDate < new Date(filterDateFrom).getTime()) return false;
    }
    if (filterDateTo) {
      const meetingDate = new Date(m.meetingDate || m.createdAt).getTime();
      if (meetingDate > new Date(filterDateTo + 'T23:59:59').getTime()) return false;
    }
    return true;
  });

  const hasActiveFilters = filterTemplate || filterStatus || filterDateFrom || filterDateTo;

  function clearFilters() {
    setFilterTemplate('');
    setFilterStatus('');
    setFilterDateFrom('');
    setFilterDateTo('');
  }

  function handleSearchChange(value: string) {
    setMeetingSearchTerm(value);

    // Clear previous timer
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    // If empty, show all meetings
    if (!value.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    // If less than 2 chars, don't search yet
    if (value.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    // Debounce: wait 300ms after user stops typing, then search
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchMeetings(value.trim(), activeProjectId!);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function clearSearch() {
    setMeetingSearchTerm('');
    setSearchResults(null);
    setIsSearching(false);
  }

  // --- Project Actions ---
  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    try {
      const project = await createProject(newProjectName.trim());
      setProjects([...projects, project]);
      setNewProjectName('');
      navigate(`/projects/${project.id}`);
    } catch {
      setPopup({ type: 'error', message: 'Failed to create project.' });
    }
  }

  const [deleteConfirm, setDeleteConfirm] = useState<{ projectId: number; name: string; meetingCount: number } | null>(null);

  function handleDeleteProject(projectId: number) {
    const project = projects.find(p => p.id === projectId);
    setDeleteConfirm({ projectId, name: project?.name || '', meetingCount: project?.meetingCount || 0 });
  }

  async function confirmDeleteProject() {
    if (!deleteConfirm) return;
    if (deleteConfirm.meetingCount > 0) {
      setPopup({ type: 'error', message: `Cannot delete "${deleteConfirm.name}". It contains ${deleteConfirm.meetingCount} meeting(s). Please delete or move all meetings first.` });
      setDeleteConfirm(null);
      return;
    }
    try {
      await deleteProject(deleteConfirm.projectId);
      setProjects(projects.filter(p => p.id !== deleteConfirm.projectId));
      if (activeProjectId === deleteConfirm.projectId) navigate('/');
      setPopup({ type: 'success', message: `Project "${deleteConfirm.name}" deleted successfully.` });
    } catch (err: any) {
      setPopup({ type: 'error', message: err.userMessage || 'Failed to delete project.' });
    }
    setDeleteConfirm(null);
  }

  // --- Meeting Actions ---
  async function handleUpload(file: File, templateId: string, meetingName: string, description: string, projectId?: number, meetingDate?: string) {
    try {
      const result = await uploadAndExtract(file, templateId, meetingName, description, projectId, meetingDate);
      setPopup({ type: result.status === "Completed" ? 'success' : 'error', message: result.message || 'Done.' });
      setShowUploadModal(false);
      if (activeProjectId !== null) await loadMeetings(activeProjectId); await loadProjects();
    } catch (err: any) {
      setShowUploadModal(false);
      setPopup({ type: 'error', message: err.userMessage || 'Something went wrong.' });
      if (activeProjectId !== null) await loadMeetings(activeProjectId); await loadProjects();
    }
  }

  async function handleMeetingClick(meeting: MeetingEntry) {
    if (meeting.status !== 'Completed') return;
    if (selectedMeetingId === meeting.id) { handleCloseDrawer(); return; }
    try {
      const full = await getMeetingById(meeting.id);
      if (full?.extractionResultJson) {
        const original = JSON.parse(full.extractionResultJson);
        setOriginalResult(original);
        setExtractionResult(full.editedResultJson ? JSON.parse(full.editedResultJson) : original);
        setIsEdited(!!full.editedResultJson);
        navigate(`/projects/${activeProjectId}/${meeting.id}`);
        setShowingOriginal(false);
        setHasUnsavedChanges(false);
        setShowDrawer(true);
      }
    } catch {
      setPopup({ type: 'error', message: 'Failed to load meeting.' });
    }
  }

  async function handleSave(updatedResult: ExtractionResult) {
    if (!selectedMeetingId) return;
    await saveEditedExtraction(selectedMeetingId, JSON.stringify(updatedResult));
    setExtractionResult(updatedResult);
    setIsEdited(true);
    setHasUnsavedChanges(false);
  }

  async function handleRetry(templateId?: string) {
    if (!selectedMeetingId) return;
    try {
      await retryExtraction(selectedMeetingId, templateId);
      const full = await getMeetingById(selectedMeetingId);
      if (full?.extractionResultJson) {
        const original = JSON.parse(full.extractionResultJson);
        setOriginalResult(original);
        setExtractionResult(original);
        setIsEdited(false);
        setShowingOriginal(false);
      }
      if (activeProjectId !== null) await loadMeetings(activeProjectId); await loadProjects();
      setShowRetryModal(false);
      setPopup({ type: 'success', message: 'Regenerated successfully.' });
    } catch (err: any) {
      setShowRetryModal(false);
      setPopup({ type: 'error', message: err.userMessage || 'Failed.' });
    }
  }

  const [deleteMeetingConfirm, setDeleteMeetingConfirm] = useState<{ id: number; name: string } | null>(null);

  function handleDeleteMeeting(id: number) {
    const meeting = meetings.find(m => m.id === id);
    setDeleteMeetingConfirm({ id, name: meeting?.name || 'this meeting' });
  }

  async function confirmDeleteMeeting() {
    if (!deleteMeetingConfirm) return;
    try {
      await deleteMeeting(deleteMeetingConfirm.id);
      if (selectedMeetingId === deleteMeetingConfirm.id) closeDrawer();
      if (activeProjectId !== null) await loadMeetings(activeProjectId);
      await loadProjects();
      setPopup({ type: 'success', message: 'Meeting deleted successfully.' });
    } catch {
      setPopup({ type: 'error', message: 'Failed to delete meeting. Please try again.' });
    }
    setDeleteMeetingConfirm(null);
  }

  function handleCloseDrawer() {
    if (hasUnsavedChanges) { setShowUnsavedWarning(true); } else { closeDrawer(); }
  }

  function closeDrawer() {
    setShowDrawer(false);
    navigate(`/projects/${activeProjectId}`);
    setExtractionResult(null);
    setOriginalResult(null);
    setIsEdited(false);
    setShowingOriginal(false);
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
  }

  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeProjectId !== null && (
              <button onClick={() => navigate('/')} className="btn-ghost text-xs">
                &larr; Projects
              </button>
            )}
            <h1 className="text-base font-semibold text-slate-900">
              {activeProject ? activeProject.name : 'MeetScribe'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {activeProjectId === null && projects.length > 0 && (
              <>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search projects..."
                  className="input-field w-48"
                />
                {!showNewProjectInput ? (
                  <button onClick={() => setShowNewProjectInput(true)} className="btn-primary whitespace-nowrap">
                    + New
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Project name..."
                      className="input-field w-44"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { handleCreateProject(); setShowNewProjectInput(false); }
                        if (e.key === 'Escape') { setShowNewProjectInput(false); setNewProjectName(''); }
                      }}
                    />
                    <button
                      onClick={() => { handleCreateProject(); setShowNewProjectInput(false); }}
                      className="btn-primary whitespace-nowrap"
                    >
                      Create
                    </button>
                  </div>
                )}
              </>
            )}
            {activeProjectId !== null && (
              <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                + Upload Audio
              </button>
            )}
            <button
              onClick={() => navigate('/settings')}
              className="btn-ghost text-xs"
              title="Integration Settings"
            >
              ⚙ Settings
            </button>

            {/* User Profile & Logout */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-2">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); logout(); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeProjectId === null ? (
          projects.length === 0 ? (
            // ONBOARDING
            <div className="max-w-xl mx-auto py-12">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                </h2>
                <p className="text-sm text-slate-500">
                  Get started in 3 simple steps to turn your meetings into actionable requirements.
                </p>
              </div>

              {/* Step 1 — Create Project */}
              <div className="card p-6 mb-4 border-l-4 border-l-blue-600">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Create a Project</h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Organize your meetings by team, sprint, or initiative.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g., Sprint Planning, Product Discovery"
                        className="input-field"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
                      />
                      <button onClick={handleCreateProject} className="btn-primary whitespace-nowrap">
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 — Upload Meeting */}
              <div className="card p-6 mb-4 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-500 text-sm font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Upload a Meeting Recording</h3>
                    <p className="text-xs text-slate-500">
                      Drop an MP3, WAV, or WebM file. AI will transcribe and extract user stories, action items, and decisions automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 — Review & Export */}
              <div className="card p-6 mb-6 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-500 text-sm font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">Review & Export</h3>
                    <p className="text-xs text-slate-500">
                      Edit the extracted requirements, then push them directly to Jira, Azure DevOps, or Linear with one click.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 px-4 py-3 bg-blue-50 rounded-lg">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-800">
                  <span className="font-medium">Tip:</span> For best results, use recordings where participants discuss features, requirements, or action items. Meetings with clear speakers work best.
                </p>
              </div>
            </div>
          ) : (
            // PROJECTS GRID
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-5">
                My Projects <span className="text-slate-400 font-normal text-sm">({projects.length})</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects
                  .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((project) => {
                    const lastActivity = project.lastActivityAt
                      ? getRelativeTime(parseUtcDate(project.lastActivityAt))
                      : null;

                    return (
                      <div
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="card-hover p-5 group"
                      >
                        <div className="flex items-start gap-3">
                          <ProjectAvatar name={project.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 truncate">{project.name}</h3>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {project.meetingCount} meeting{project.meetingCount !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              {lastActivity ? `Last: ${lastActivity}` : 'No meetings yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

              </div>
            </div>
          )
        ) : (
          // MEETINGS LIST
          meetings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-slate-500 mb-2">No meetings in this project yet</p>
              <p className="text-sm text-slate-400 mb-6">Upload your first meeting recording</p>
              <button onClick={() => setShowUploadModal(true)} className="btn-primary">
                + Upload Audio
              </button>
            </div>
          ) : (
            <>
            {/* Search — single debounced input, searches everything server-side */}
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={meetingSearchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search meetings..."
                    className="input-field w-full pl-8"
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                </div>
                {meetingSearchTerm && (
                  <button onClick={clearSearch} className="btn-ghost text-xs">Clear</button>
                )}
              </div>

              {/* Searching indicator */}
              {isSearching && (
                <p className="text-xs text-blue-600 mt-1.5 px-1">Searching...</p>
              )}

              {/* Results count */}
              {searchResults !== null && !isSearching && (
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-xs text-slate-500">
                    {searchResults.length > 0
                      ? `Found ${searchResults.length} meeting(s) matching "${meetingSearchTerm}"`
                      : `No meetings match "${meetingSearchTerm}" — showing 0 of ${meetings.length}`}
                  </span>
                  <button onClick={clearSearch} className="text-xs text-blue-600 hover:underline">
                    Show all
                  </button>
                </div>
              )}
            </div>

            {/* Filters — compact inline row */}
            <div className="mb-4 bg-white border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-medium text-slate-500 shrink-0">Filters:</span>

                <select
                  value={filterTemplate}
                  onChange={(e) => setFilterTemplate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                >
                  <option value="">All Templates</option>
                  {[...new Set(meetings.map(m => m.templateId))].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="Processing">Processing</option>
                  <option value="Error">Error</option>
                  <option value="NoData">No Data</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                  <span className="text-xs text-slate-400">—</span>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                  />
                </div>

                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                    Reset
                  </button>
                )}

                {hasActiveFilters && (
                  <span className="text-xs text-slate-400 ml-auto">
                    Showing {projectMeetings.length} of {baseMeetings.length}
                  </span>
                )}
              </div>
            </div>

            {/* Tip — only when not searching */}
            {!selectedMeetingId && !meetingSearchTerm && !hasActiveFilters && projectMeetings.some(m => m.status === 'Completed') && (
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-medium">
                  Tip: Click any completed meeting to view extracted results
                </span>
              </div>
            )}

            {projectMeetings.length > 0 && (
            <div className="card overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200">
                <div className="col-span-4 section-label">Meeting</div>
                <div className="col-span-3 section-label">Template</div>
                <div className="col-span-2 section-label">Date</div>
                <div className="col-span-1 section-label">Status</div>
                <div className="col-span-2"></div>
              </div>
              {projectMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  onClick={() => handleMeetingClick(meeting)}
                  className={`
                    grid grid-cols-12 gap-4 px-5 py-3.5 border-b border-slate-100 last:border-b-0 transition-all group
                    ${meeting.status === 'Completed' ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default'}
                    ${meeting.id === selectedMeetingId ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                  `}
                >
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-slate-900 truncate">{meeting.name}</p>
                    {meeting.description && <p className="text-xs text-slate-400 truncate">{meeting.description}</p>}
                  </div>
                  <div className="col-span-3 flex items-center">
                    <span className="text-xs text-slate-500">{meeting.templateId}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-slate-400">
                      {new Date(meeting.meetingDate || meeting.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className={
                      meeting.status === 'Completed' ? 'badge-success' :
                      meeting.status === 'Error' ? 'badge-danger' :
                      meeting.status === 'Processing' ? 'badge-info' :
                      'badge-warning'
                    }>
                      {meeting.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {meeting.status === 'Completed' && (
                      <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View Results &rarr;
                      </span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(meeting.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 rounded transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
            </>
          )
        )}
      </main>

      {/* Drawer */}
      {showDrawer && extractionResult && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 animate-fade-in" onClick={handleCloseDrawer} />
          <div className="fixed inset-y-0 right-0 z-50 w-[75vw] bg-white shadow-drawer flex flex-col animate-slide-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  {meetings.find(m => m.id === selectedMeetingId)?.name}
                </h2>
                {hasUnsavedChanges && <span className="badge-warning">Unsaved</span>}
              </div>
              <div className="flex items-center gap-2">
                {connectedProvider && (
                  <button onClick={() => setShowExportModal(true)} className="btn-primary text-xs">
                    Export to {connectedProvider === 'AzureDevOps' ? 'DevOps' : connectedProvider}
                  </button>
                )}
                <button onClick={() => {
                  if (hasUnsavedChanges || isEdited) {
                    setShowRegenerateWarning(true);
                  } else {
                    setShowRetryModal(true);
                  }
                }} className="btn-ghost text-warning">
                  Re-generate
                </button>
                <button onClick={handleCloseDrawer} className="btn-ghost">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6" onInput={() => setHasUnsavedChanges(true)}>
              <DocumentView
                result={showingOriginal ? originalResult! : extractionResult}
                meetingName={meetings.find(m => m.id === selectedMeetingId)?.name}
                meetingDate={meetings.find(m => m.id === selectedMeetingId)?.createdAt
                  ? new Date(meetings.find(m => m.id === selectedMeetingId)!.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : undefined}
                isEdited={isEdited}
                onSave={handleSave}
                onToggleOriginal={isEdited ? () => setShowingOriginal(!showingOriginal) : undefined}
                showingOriginal={showingOriginal}
              />
            </div>
          </div>
        </>
      )}

      {/* Delete Project Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative card shadow-modal w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Delete Project</h3>
            {deleteConfirm.meetingCount > 0 ? (
              <>
                <p className="text-sm text-slate-600 mb-4">
                  <span className="font-medium">"{deleteConfirm.name}"</span> contains <span className="font-medium text-red-600">{deleteConfirm.meetingCount} meeting(s)</span>.
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  Please delete all meetings before deleting this project.
                </p>
                <div className="flex justify-end">
                  <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Got it</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-600 mb-6">
                  Are you sure you want to delete <span className="font-medium">"{deleteConfirm.name}"</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
                  <button onClick={confirmDeleteProject} className="btn-danger">Delete Project</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unsaved Warning */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative card shadow-modal w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Unsaved Changes</h3>
            <p className="text-sm text-slate-500 mb-6">You have unsaved edits. Save before closing?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowUnsavedWarning(false); closeDrawer(); }} className="btn-secondary">Discard</button>
              <button
                onClick={async () => {
                  setShowUnsavedWarning(false);
                  const btn = document.querySelector('[data-save-btn]') as HTMLButtonElement;
                  if (btn) { btn.click(); await new Promise(r => setTimeout(r, 500)); }
                  closeDrawer();
                }}
                className="btn-primary"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Warning */}
      {showRegenerateWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRegenerateWarning(false)} />
          <div className="relative card shadow-modal w-full max-w-md mx-4 p-6">
            <h3 className="text-base font-semibold text-orange-900 mb-2">Regenerate Extraction?</h3>
            <p className="text-sm text-slate-600 mb-2">This will replace the current extraction with a fresh AI result.</p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-800 space-y-1">
              {hasUnsavedChanges && <p>• Your unsaved edits will be lost.</p>}
              {isEdited && <p>• All previous manual edits will be overwritten.</p>}
              <p>• Previously exported tickets in DevOps will NOT be deleted.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRegenerateWarning(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => { setShowRegenerateWarning(false); setShowRetryModal(true); }} className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
                Regenerate Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Meeting Confirmation */}
      {deleteMeetingConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteMeetingConfirm(null)} />
          <div className="relative card shadow-modal w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-2">Delete Meeting</h3>
            <p className="text-sm text-slate-600 mb-2">
              Are you sure you want to delete <span className="font-medium">"{deleteMeetingConfirm.name}"</span>?
            </p>
            <p className="text-xs text-slate-400 mb-6">
              This will permanently remove the meeting recording, transcript, and all extracted results. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteMeetingConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDeleteMeeting} className="btn-danger">Delete Meeting</button>
            </div>
          </div>
        </div>
      )}

      {/* Retry Modal */}
      {showRetryModal && <RetryModal currentTemplateId={meetings.find(m => m.id === selectedMeetingId)?.templateId || ''} onRetry={handleRetry} onClose={() => setShowRetryModal(false)} />}

      {/* Export Modal */}
      {showExportModal && extractionResult && connectedProvider && (
        <ExportModal
          result={extractionResult}
          provider={connectedProvider}
          meetingName={meetings.find(m => m.id === selectedMeetingId)?.name}
          meetingId={selectedMeetingId || undefined}
          onClose={() => setShowExportModal(false)}
          onExportComplete={() => {}}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onUpload={handleUpload} preSelectedProjectId={activeProjectId || undefined} />}

      {/* Popup */}
      {popup && <ResultPopup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
    </div>
  );
}

// =============================================================================
// Retry Modal
// =============================================================================

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-pink-500', 'bg-lime-600', 'bg-violet-500',
];

function ProjectAvatar({ name }: { name: string }) {
  const letter = name.charAt(0).toUpperCase();
  const colorIndex = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const color = AVATAR_COLORS[colorIndex];

  return (
    <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center shrink-0`}>
      <span className="text-white text-sm font-bold">{letter}</span>
    </div>
  );
}

/** Parses a date string as UTC (adds Z if missing) */
function parseUtcDate(dateStr: string): Date {
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    return new Date(dateStr + 'Z');
  }
  return new Date(dateStr);
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TEMPLATES = [
  { id: 'meeting-minutes', name: 'Meeting Minutes' },
  { id: 'requirements-doc', name: 'Requirements Document' },
  { id: 'action-items', name: 'Action Items Only' },
  { id: 'sprint-grooming', name: 'Sprint / Backlog Grooming' },
  { id: 'stakeholder-interview', name: 'Stakeholder Interview' },
  { id: 'uat-demo-feedback', name: 'UAT / Demo Feedback' },
];

function RetryModal({ currentTemplateId, onRetry, onClose }: {
  currentTemplateId: string;
  onRetry: (templateId?: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplateId);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/50" onClick={isProcessing ? undefined : onClose} />
      <div className="relative card shadow-modal w-full max-w-sm mx-4 p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Re-generate from Transcript</h3>

        <div className="mb-4">
          <label className="section-label mb-1.5 block">Template</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} disabled={isProcessing} className="select-field">
            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        <div className="bg-amber-50 border border-yellow-200 rounded-xl p-3 mb-5">
          <p className="text-xs text-warning font-medium mb-1">This will:</p>
          <ul className="text-xs text-slate-500 list-disc list-inside space-y-0.5">
            <li>Re-run AI on existing transcript</li>
            <li>Replace your current edits permanently</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          {!isProcessing && <button onClick={onClose} className="btn-secondary">Cancel</button>}
          <button
            onClick={async () => { setIsProcessing(true); await onRetry(selectedTemplate !== currentTemplateId ? selectedTemplate : undefined); setIsProcessing(false); }}
            disabled={isProcessing}
            className="btn-primary bg-warning hover:bg-amber-700"
          >
            {isProcessing ? 'Generating...' : 'Re-generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
