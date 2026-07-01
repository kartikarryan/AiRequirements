/**
 * =============================================================================
 * MeetScribe Web — Config-Driven Document View
 * =============================================================================
 *
 * Renders extraction results based on section_types config from the API.
 * Display logic is driven by the "display" field in config:
 *   - paragraph → editable text block
 *   - bullet-list → editable list of items
 *   - table → editable table with columns from config
 *   - numbered-list → editable numbered items with fields from config
 *
 * Adding a new section type or template requires ZERO frontend changes —
 * the config API drives everything.
 * =============================================================================
 */

import { useRef, useState, useEffect } from 'react';
import { ExtractionResult } from '../types/extraction';
import { getTemplatesConfig } from '../services/templateService';
import { formatDocument } from '../utils/documentFormatter';

// -----------------------------------------------------------------------------
// Config Types (from GET /api/templates/config)
// -----------------------------------------------------------------------------

interface ColumnDef {
  key: string;
  label: string;
  editable: boolean;
}

interface SectionTypeConfig {
  display: string;
  fields: string[];
  columns?: ColumnDef[];
}

interface TemplatesConfig {
  section_types: Record<string, SectionTypeConfig>;
}

// -----------------------------------------------------------------------------
// Config Helper
// -----------------------------------------------------------------------------

function getConfigForType(config: TemplatesConfig, type: string): SectionTypeConfig | null {
  return config.section_types[type] || null;
}

// -----------------------------------------------------------------------------
// Props & Main Component
// -----------------------------------------------------------------------------

interface DocumentViewProps {
  result: ExtractionResult;
  meetingName?: string;
  meetingDate?: string;
  isEdited?: boolean;
  onSave?: (updatedResult: ExtractionResult) => Promise<void>;
  onToggleOriginal?: () => void;
  showingOriginal?: boolean;
}

export function DocumentView({ result, meetingName, meetingDate, isEdited, onSave, onToggleOriginal, showingOriginal }: DocumentViewProps) {
  const documentRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<TemplatesConfig | null>(null);

  useEffect(() => {
    if (!config) {
      getTemplatesConfig()
        .then(data => setConfig(data as TemplatesConfig))
        .catch(() => setConfig({ section_types: {} }));
    }
  }, [config]);

  /** Generates formatted document text from structured data */
  function getFormattedText(): string {
    return formatDocument(result, config, meetingName, meetingDate);
  }

  async function handleCopy() {
    const text = getFormattedText();
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch {
      fallbackCopy(text);
    }
  }

  function handleDownload() {
    const text = getFormattedText();
    const fileName = `${(meetingName || result.templateName).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.txt`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!onSave || !documentRef.current || !config) return;
    setIsSaving(true);
    try {
      const updatedResult = collectEditedResult(documentRef.current, result, config);
      await onSave(updatedResult);
      showToast('Changes saved');
    } catch {
      showToast('Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  if (!config) {
    return <div className="text-center py-8 text-gray-400">Loading...</div>;
  }

  const sections = result.sections || [];
  const filledSections = sections.filter(s =>
    s.data && !(Array.isArray(s.data) && s.data.length === 0)
  ).length;

  return (
    <div>
      {/* Meeting Context Header */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                Template: {result.templateName}
              </span>
              {isEdited && !showingOriginal && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Edited</span>
              )}
              {showingOriginal && (
                <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-medium rounded">Viewing AI Generated Version</span>
              )}
            </div>
            {meetingName && (
              <h2 className="text-xl font-bold text-gray-900">{meetingName}</h2>
            )}
            <p className="text-sm text-gray-500 mt-1">
              {meetingDate && <span>{meetingDate} • </span>}
              {filledSections}/{sections.length} sections extracted
            </p>
          </div>
        </div>

        {/* Confidence Score Legend */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 mt-3">
          <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Confidence Score — based on speaker's language strength</p>
          <div className="flex flex-wrap gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">85%+</span>
              Clearly stated — safe to trust
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">70-84%</span>
              Mentioned — quick review suggested
            </span>
            <span className="flex items-center gap-1">
              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">50-69%</span>
              Tentative — verify before acting
            </span>
          </div>
        </div>

        {/* User Guidance */}
        {!showingOriginal && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 mt-2">
            <p className="text-xs text-blue-700">
              Click any text to edit. Use <strong>+ Add</strong> to add items to empty sections. Click <strong>Save</strong> to keep your changes.
            </p>
          </div>
        )}
        {showingOriginal && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 mt-3">
            <p className="text-xs text-gray-600">
              This is the original AI-generated output before your edits. Read-only.
            </p>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-2 mt-3">
          {onToggleOriginal && (
            <button
              onClick={onToggleOriginal}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              title={showingOriginal ? 'Switch back to your edited version' : 'View the original AI-generated version before your edits'}
            >
              {showingOriginal ? 'View My Edits' : 'View AI Generated'}
            </button>
          )}
          {onSave && !showingOriginal && (
            <button
              data-save-btn
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50"
              title="Save changes to this meeting"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Copy all content to clipboard"
          >
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Download as text file"
          >
            Download
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div ref={documentRef}>
        {sections.map((section) => (
          <SectionRenderer key={section.key} section={section} config={config} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Generated by MeetScribe • Template: {result.templateName}
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Section Renderer — dispatches by config "display" field
// -----------------------------------------------------------------------------

interface SectionData {
  key: string;
  type: string;
  label: string;
  data: any;
}

function SectionRenderer({ section, config }: { section: SectionData; config: TemplatesConfig }) {
  const typeConfig = getConfigForType(config, section.type);
  const display = typeConfig?.display || 'bullet-list';

  const isEmpty = !section.data ||
    (Array.isArray(section.data) && section.data.length === 0) ||
    (typeof section.data === 'string' && section.data.trim() === '');

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
        {section.label}
      </h2>
      {isEmpty ? (
        <EmptySection section={section} display={display} typeConfig={typeConfig} />
      ) : (
        <FilledSection section={section} display={display} typeConfig={typeConfig} />
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Filled Section — renders data based on display type from config
// -----------------------------------------------------------------------------

function FilledSection({ section, display, typeConfig }: { section: SectionData; display: string; typeConfig: SectionTypeConfig | null }) {
  switch (display) {
    case 'paragraph':
      return <ParagraphSection data={section.data} />;
    case 'bullet-list':
      return <BulletListSection data={section.data} />;
    case 'table':
      return <TableSection data={section.data} columns={typeConfig?.columns || []} />;
    case 'numbered-list':
      return <NumberedListSection data={section.data} fields={typeConfig?.fields || []} />;
    default:
      return <BulletListSection data={section.data} />;
  }
}

// -----------------------------------------------------------------------------
// Empty Section — shows placeholder + Add button, respects display type
// -----------------------------------------------------------------------------

function EmptySection({ section, display, typeConfig }: { section: SectionData; display: string; typeConfig: SectionTypeConfig | null }) {
  const [items, setItems] = useState<any[]>([]);

  function addItem() {
    if (display === 'table') {
      const columns = typeConfig?.columns || [];
      const emptyRow: Record<string, string> = {};
      columns.forEach(col => { emptyRow[col.key] = ''; });
      setItems([...items, emptyRow]);
    } else if (display === 'numbered-list') {
      const fields = typeConfig?.fields || ['title'];
      const emptyItem: Record<string, string> = {};
      fields.forEach(f => { emptyItem[f] = ''; });
      setItems([...items, emptyItem]);
    } else {
      setItems([...items, '']);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace') {
      const target = e.currentTarget as HTMLElement;
      if (target.textContent === '') {
        e.preventDefault();
        setItems(items.filter((_, i) => i !== idx));
      }
    }
  }

  if (display === 'paragraph') {
    return (
      <p
        contentEditable
        suppressContentEditableWarning
        className="text-gray-400 italic outline-none focus:bg-blue-50 focus:rounded focus:text-gray-700 focus:not-italic px-1 -mx-1 min-h-[1.5em]"
      />
    );
  }

  if (display === 'table') {
    const columns = typeConfig?.columns || [];
    return (
      <div>
        {items.length > 0 && (
          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-2 font-medium w-8">#</th>
                {columns.map(col => (
                  <th key={col.key} className="pb-2 font-medium">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="py-2 text-gray-400">{idx + 1}</td>
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key}
                      contentEditable
                      suppressContentEditableWarning
                      onKeyDown={colIdx === 0 ? (e) => handleKeyDown(e, idx) : undefined}
                      className="py-2 outline-none focus:bg-blue-50 focus:rounded px-1"
                    >
                      {item[col.key] || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={addItem} className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1">
          <span>+</span> Add row
        </button>
      </div>
    );
  }

  if (display === 'numbered-list') {
    const fields = typeConfig?.fields || ['title'];
    const primaryField = fields[0];
    const secondaryField = fields.length > 1 ? fields[1] : null;
    return (
      <div>
        {items.length > 0 && (
          <ol className="list-decimal list-inside space-y-3 mb-2">
            {items.map((item, idx) => (
              <li key={idx} className="text-gray-700">
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="font-medium outline-none focus:bg-blue-50 focus:rounded px-1"
                >
                  {item[primaryField] || ''}
                </span>
                {secondaryField && (
                  <p
                    contentEditable
                    suppressContentEditableWarning
                    className="ml-6 text-sm text-gray-500 mt-0.5 outline-none focus:bg-blue-50 focus:rounded px-1"
                  >
                    {item[secondaryField] || ''}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
        <button onClick={addItem} className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1">
          <span>+</span> Add item
        </button>
      </div>
    );
  }

  // bullet-list (default)
  return (
    <div>
      {items.length > 0 && (
        <ul className="list-disc list-inside space-y-1 mb-2">
          {items.map((_, idx) => (
            <li
              key={idx}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="text-gray-700 outline-none focus:bg-blue-50 focus:rounded px-1"
            />
          ))}
        </ul>
      )}
      <button onClick={addItem} className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1">
        <span>+</span> Add {section.label.toLowerCase()}
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Display Components — Inline Edit (read-only default, click pencil to edit)
// -----------------------------------------------------------------------------

/** Paragraph — stays contentEditable (it's just text, simple to edit) */
function ParagraphSection({ data }: { data: string }) {
  return (
    <p
      contentEditable
      suppressContentEditableWarning
      className="text-gray-700 leading-relaxed outline-none focus:bg-blue-50 focus:rounded px-1 -mx-1"
    >
      {data}
    </p>
  );
}

/** Bullet list with inline edit per item */
function BulletListSection({ data }: { data: string[] }) {
  const [items, setItems] = useState<string[]>(Array.isArray(data) ? [...data] : []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  if (items.length === 0) return null;

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditValue(items[idx]);
  }

  function saveEdit() {
    if (editingIdx === null) return;
    const updated = [...items];
    updated[editingIdx] = editValue;
    setItems(updated);
    setEditingIdx(null);
  }

  function deleteItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
    setEditingIdx(null);
  }

  function addItem() {
    setItems([...items, '']);
    setEditingIdx(items.length);
    setEditValue('');
  }

  return (
    <div>
      <ul className="space-y-1">
        {items.map((item, idx) => (
          <li key={idx}>
            {editingIdx === idx ? (
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                  className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none"
                  autoFocus
                />
                <button onClick={saveEdit} className="text-xs text-green-600 font-medium hover:bg-green-50 px-2 py-1 rounded">Save</button>
                <button onClick={() => setEditingIdx(null)} className="text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded">Cancel</button>
                <button onClick={() => deleteItem(idx)} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group py-0.5">
                <span className="text-slate-400">•</span>
                <span className="text-gray-700 flex-1">{item}</span>
                <button
                  onClick={() => startEdit(idx)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 rounded transition-opacity"
                >
                  ✏️
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <button onClick={addItem} className="mt-2 text-xs text-primary hover:text-primary-hover font-medium opacity-60 hover:opacity-100">
        + Add item
      </button>
    </div>
  );
}

/** Table with inline edit per row */
function TableSection({ data, columns }: { data: any[]; columns: ColumnDef[] }) {
  const [items, setItems] = useState<any[]>(Array.isArray(data) ? [...data] : []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  if (items.length === 0) return null;

  function startEdit(idx: number) {
    setEditingIdx(idx);
    const vals: Record<string, string> = {};
    columns.forEach(col => { vals[col.key] = items[idx][col.key] || ''; });
    setEditValues(vals);
  }

  function saveEdit() {
    if (editingIdx === null) return;
    const updated = [...items];
    updated[editingIdx] = { ...updated[editingIdx], ...editValues };
    setItems(updated);
    setEditingIdx(null);
  }

  function deleteItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
    setEditingIdx(null);
  }

  function addItem() {
    const emptyRow: Record<string, string> = {};
    columns.forEach(col => { emptyRow[col.key] = ''; });
    setItems([...items, emptyRow]);
    setEditingIdx(items.length);
    const vals: Record<string, string> = {};
    columns.forEach(col => { vals[col.key] = ''; });
    setEditValues(vals);
  }

  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 font-medium w-8">#</th>
            {columns.map((col) => (
              <th key={col.key} className="pb-2 font-medium">{col.label}</th>
            ))}
            <th className="pb-2 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            editingIdx === idx ? (
              <tr key={idx} className="bg-blue-50">
                <td className="py-2 text-gray-400">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className="py-2 px-1">
                    <input
                      type="text"
                      value={editValues[col.key] || ''}
                      onChange={(e) => setEditValues({ ...editValues, [col.key]: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none"
                      placeholder={col.label}
                      autoFocus={col === columns[0]}
                    />
                  </td>
                ))}
                <td className="py-2">
                  <div className="flex items-center gap-1">
                    <button onClick={saveEdit} className="text-xs text-green-600 font-medium px-1">✓</button>
                    <button onClick={() => setEditingIdx(null)} className="text-xs text-slate-400 px-1">✕</button>
                    <button onClick={() => deleteItem(idx)} className="text-xs text-red-500 px-1">🗑</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={idx} className="border-b border-gray-100 group hover:bg-slate-50">
                <td className="py-2 text-gray-400 align-top">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className="py-2 px-1 text-gray-700 align-top">
                    {item[col.key] || '—'}
                  </td>
                ))}
                <td className="py-2 align-top">
                  <div className="flex items-center gap-1">
                    {/* Confidence indicator */}
                    {item.confidence && (
                      <ConfidenceBadge confidence={item.confidence} />
                    )}
                    {/* Source quote toggle */}
                    {item.source_quote && (
                      <SourceQuoteToggle quote={item.source_quote} />
                    )}
                    <button
                      onClick={() => startEdit(idx)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 rounded transition-opacity"
                    >
                    ✏️
                  </button>
                  </div>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
      <button onClick={addItem} className="mt-2 text-xs text-primary hover:text-primary-hover font-medium opacity-60 hover:opacity-100">
        + Add row
      </button>
    </div>
  );
}

/** Numbered list with inline edit per item */
function NumberedListSection({ data, fields }: { data: any[]; fields: string[] }) {
  const [items, setItems] = useState<any[]>(Array.isArray(data) ? [...data] : []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const primaryField = fields[0];
  const secondaryField = fields.length > 1 ? fields[1] : null;

  if (items.length === 0) return null;

  function startEdit(idx: number) {
    setEditingIdx(idx);
    const vals: Record<string, string> = {};
    fields.forEach(f => { vals[f] = items[idx][f] || ''; });
    setEditValues(vals);
  }

  function saveEdit() {
    if (editingIdx === null) return;
    const updated = [...items];
    updated[editingIdx] = { ...updated[editingIdx], ...editValues };
    setItems(updated);
    setEditingIdx(null);
  }

  function deleteItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
    setEditingIdx(null);
  }

  function addItem() {
    const emptyItem: Record<string, string> = {};
    fields.forEach(f => { emptyItem[f] = ''; });
    setItems([...items, emptyItem]);
    setEditingIdx(items.length);
    const vals: Record<string, string> = {};
    fields.forEach(f => { vals[f] = ''; });
    setEditValues(vals);
  }

  return (
    <div>
      <ol className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx}>
            {editingIdx === idx ? (
              <div className="bg-blue-50 rounded-lg px-3 py-2 space-y-2">
                <input
                  type="text"
                  value={editValues[primaryField] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [primaryField]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder={primaryField}
                  autoFocus
                />
                {secondaryField && (
                  <input
                    type="text"
                    value={editValues[secondaryField] || ''}
                    onChange={(e) => setEditValues({ ...editValues, [secondaryField]: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder={secondaryField}
                  />
                )}
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="text-xs text-green-600 font-medium hover:bg-green-50 px-2 py-1 rounded">Save</button>
                  <button onClick={() => setEditingIdx(null)} className="text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded">Cancel</button>
                  <button onClick={() => deleteItem(idx)} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 group py-0.5">
                <span className="text-slate-400 text-sm mt-0.5">{idx + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">{item[primaryField] || ''}</span>
                    {item.confidence && <ConfidenceBadge confidence={item.confidence} />}
                  </div>
                  {secondaryField && item[secondaryField] && (
                    <p className="text-sm text-gray-500 mt-0.5">{item[secondaryField]}</p>
                  )}
                  {item.source_quote && <SourceQuoteToggle quote={item.source_quote} />}
                </div>
                <button
                  onClick={() => startEdit(idx)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 p-1 rounded transition-opacity"
                >
                  ✏️
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
      <button onClick={addItem} className="mt-2 text-xs text-primary hover:text-primary-hover font-medium opacity-60 hover:opacity-100">
        + Add item
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Confidence Badge — visual indicator of AI certainty
// -----------------------------------------------------------------------------

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  let color = 'bg-green-100 text-green-700';
  let hint = 'Clearly stated — safe to trust';
  if (percent < 85) { color = 'bg-blue-100 text-blue-700'; hint = 'Mentioned — quick review suggested'; }
  if (percent < 70) { color = 'bg-yellow-100 text-yellow-700'; hint = 'Tentative language used — verify before acting'; }
  if (percent < 50) { color = 'bg-red-100 text-red-700'; hint = 'Uncertain — speaker was not committed'; }

  return (
    <span className="relative group inline-block">
      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded cursor-help ${color}`}>
        {percent}%
      </span>
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {hint}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></span>
      </span>
    </span>
  );
}

// -----------------------------------------------------------------------------
// Source Quote Toggle — expandable proof from transcript
// -----------------------------------------------------------------------------

function SourceQuoteToggle({ quote }: { quote: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-blue-500 hover:text-blue-700 font-medium flex items-center gap-0.5"
      >
        {expanded ? '▼' : '▶'} Source
      </button>
      {expanded && (
        <p className="text-xs text-slate-500 italic bg-slate-50 rounded px-2 py-1 mt-1 border-l-2 border-blue-300">
          "{quote}"
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// DOM → JSON Serialization (config-driven)
// -----------------------------------------------------------------------------

function collectEditedResult(container: HTMLElement, originalResult: ExtractionResult, config: TemplatesConfig): ExtractionResult {
  const sectionElements = container.querySelectorAll(':scope > section');
  const updatedSections = (originalResult.sections || []).map((section, idx) => {
    const sectionEl = sectionElements[idx];
    if (!sectionEl) return section;
    const typeConfig = getConfigForType(config, section.type);
    const display = typeConfig?.display || 'bullet-list';
    return { ...section, data: extractSectionData(sectionEl, section.data, display, typeConfig) };
  });
  return { ...originalResult, sections: updatedSections };
}

function extractSectionData(sectionEl: Element, originalData: any, display: string, typeConfig: SectionTypeConfig | null): any {
  if (display === 'paragraph') {
    const p = sectionEl.querySelector('p[contenteditable]');
    return p?.textContent || originalData || '';
  }

  if (display === 'bullet-list') {
    const items = sectionEl.querySelectorAll('li[contenteditable]');
    if (items.length === 0) return originalData;
    return Array.from(items).map(li => li.textContent || '').filter(t => t.trim() !== '');
  }

  if (display === 'table') {
    const columns = typeConfig?.columns || [];
    const rows = sectionEl.querySelectorAll('tbody tr');
    if (rows.length === 0) return originalData;
    return Array.from(rows).map((row, rowIdx) => {
      const cells = row.querySelectorAll('td');
      const obj: Record<string, any> = { ...(originalData?.[rowIdx] || {}) };
      columns.forEach((col, colIdx) => {
        const cell = cells[colIdx + 1];
        if (cell) {
          const text = cell.textContent || '';
          obj[col.key] = text === '—' ? '' : text;
        }
      });
      return obj;
    });
  }

  if (display === 'numbered-list') {
    const fields = typeConfig?.fields || ['title'];
    const primaryField = fields[0];
    const secondaryField = fields.length > 1 ? fields[1] : null;
    const listItems = sectionEl.querySelectorAll('ol > li');
    if (listItems.length === 0) return originalData;
    return Array.from(listItems).map((li, liIdx) => {
      const obj: Record<string, any> = { ...(originalData?.[liIdx] || {}) };
      const primarySpan = li.querySelector('span[contenteditable]');
      if (primarySpan) obj[primaryField] = primarySpan.textContent || '';
      if (secondaryField) {
        const secondaryP = li.querySelector('p[contenteditable]');
        if (secondaryP) obj[secondaryField] = secondaryP.textContent || '';
      }
      return obj;
    });
  }

  return originalData;
}

// -----------------------------------------------------------------------------
// Utility
// -----------------------------------------------------------------------------

function showToast(message: string) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = 'fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  showToast('Copied to clipboard');
}
