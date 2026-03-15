'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';

// ─── Markdown Renderer ───────────────────────────────────────────────────────
// Handles: ###/## headings, **bold**, `code`, [link](url),
//          bullet lists, numbered lists, tables, blank-line paragraphs,
//          standalone **bold** lines (treated as sub-headings)

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let bulletItems: string[] = [];
  let numberedItems: Array<{ n: string; text: string }> = [];
  let tableLines: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    blocks.push(
      <ul key={key++} className="list-disc pl-4 space-y-1 my-0.5">
        {bulletItems.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 leading-[1.7]">
            <InlineMarkdown text={item} />
          </li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  const flushNumbered = () => {
    if (numberedItems.length === 0) return;
    blocks.push(
      <ol key={key++} className="list-decimal pl-5 space-y-1 my-0.5">
        {numberedItems.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 leading-[1.7]">
            <InlineMarkdown text={item.text} />
          </li>
        ))}
      </ol>
    );
    numberedItems = [];
  };

  const flushTable = () => {
    if (tableLines.length < 2) {
      // Not enough lines for a real table — render as paragraphs
      tableLines.forEach(l => blocks.push(
        <p key={key++} className="text-sm text-gray-600 leading-[1.7]"><InlineMarkdown text={l} /></p>
      ));
      tableLines = [];
      return;
    }
    const parseRow = (row: string) =>
      row.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);

    const headerCells = parseRow(tableLines[0]);
    // tableLines[1] is the separator row (---|---), skip it
    const dataRows = tableLines.slice(2).map(parseRow);

    blocks.push(
      <div key={key++} className="overflow-x-auto my-2">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              {headerCells.map((cell, ci) => (
                <th key={ci} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">
                  <InlineMarkdown text={cell} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} className="border-b border-gray-100 last:border-b-0">
                {row.map((cell, ci) => (
                  <td key={ci} className="py-2 pr-4 text-gray-600 align-top">
                    <InlineMarkdown text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableLines = [];
  };

  const flushAll = () => { flushBullets(); flushNumbered(); flushTable(); };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table row
    if (/^\|/.test(line)) {
      flushBullets(); flushNumbered();
      tableLines.push(line);
      continue;
    }

    // Bullet list
    if (/^[-*] /.test(line)) {
      flushNumbered(); flushTable();
      bulletItems.push(line.replace(/^[-*] /, ''));
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushBullets(); flushTable();
      numberedItems.push({ n: numMatch[1], text: numMatch[2] });
      continue;
    }

    // Flush pending lists/tables before other block types
    flushAll();

    // Skip blank lines
    if (line.trim() === '') continue;

    // ### sub-heading
    if (/^###\s/.test(line)) {
      blocks.push(
        <h4 key={key++} className="text-sm font-semibold text-gray-800 mt-5 mb-1">
          <InlineMarkdown text={line.replace(/^###\s+/, '')} />
        </h4>
      );
      continue;
    }

    // ## section label
    if (/^##\s/.test(line)) {
      blocks.push(
        <h3 key={key++} className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-5 mb-1">
          <InlineMarkdown text={line.replace(/^##\s+/, '')} />
        </h3>
      );
      continue;
    }

    // Standalone **bold line** — treat as a sub-heading (GPT-4o uses this pattern)
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      blocks.push(
        <p key={key++} className="text-sm font-semibold text-gray-800 mt-4 mb-0.5">
          {line.trim().replace(/^\*\*|\*\*$/g, '')}
        </p>
      );
      continue;
    }

    // Regular paragraph
    blocks.push(
      <p key={key++} className="text-sm text-gray-600 leading-[1.75]">
        <InlineMarkdown text={line} />
      </p>
    );
  }

  flushAll();

  return <div className="space-y-2.5">{blocks}</div>;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((https?:\/\/[^\s)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[2]) {
      parts.push(<strong key={match.index} className="font-semibold text-gray-900">{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<code key={match.index} className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono text-gray-800">{match[3]}</code>);
    } else if (match[4] && match[5]) {
      parts.push(
        <a key={match.index} href={match[5]} target="_blank" rel="noopener noreferrer"
           className="text-[#F0602C] underline underline-offset-2 hover:opacity-75">
          {match[4]}
        </a>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type VentureInput = {
  id: number;
  type: string;
  label: string;
  content: string;
  inputDate: string | null;
  createdAt: string;
};

type VentureSection = {
  id: number;
  key: string;
  content: string;
  generatedAt: string | null;
  editedAt: string | null;
  inputCount: number;
};

type VentureQuestion = {
  id: number;
  question: string;
  answer: string | null;
  answered: boolean;
  order: number;
  priority: string; // 'critical' | 'high' | 'medium'
};

type VentureAction = {
  id: number;
  text: string;
  done: boolean;
};

type Researcher = {
  id: number;
  fullName: string;
  affiliation: string;
  tier: string;
};

type TechOffer = {
  id: number;
  technology: string;
  techId: string;
  institution: string;
  description: string | null;
};

type VentureCase = {
  id: number;
  title: string;
  status: string;
  researcher: Researcher | null;
  techOffer: TechOffer | null;
  inputs: VentureInput[];
  sections: VentureSection[];
  questions: VentureQuestion[];
  actions: VentureAction[];
  createdAt: string;
  updatedAt: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const SECTION_KEYS = ['summary', 'market_context', 'use_case', 'vs_existing', 'unit_economics', 'market_sizing'];

const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  market_context: 'Market Context',
  use_case: 'Use Cases',
  vs_existing: 'vs. Existing',
  unit_economics: 'Unit Economics',
  market_sizing: 'Market Sizing',
};

const SECTION_METHODOLOGY: Record<string, { why: string; howToRead: string; redFlag: string }> = {
  summary: {
    why: "The summary isn't meant to describe the technology, it's meant to surface the central tension. Every venture has one thing that, if we can't resolve it, nothing else matters. We want to name that directly. If we can't articulate the tension in a sentence, the venture isn't well-understood yet.",
    howToRead: "Read this asking: what's the single most interesting thing here, and what's the one thing that could kill it? If you finish the summary and can't answer both, it needs a rewrite.",
    redFlag: "If the summary leads with what the technology does rather than why it's interesting - it's describing science, not a venture.",
  },
  market_context: {
    why: "A large market that isn't changing isn't an opportunity, it's an incumbent's fortress. Before we size it, we need to understand why it's broken and what's different right now. The 'why now' is the most important signal - what changed in the last 2-3 years that makes this viable when it wasn't before?",
    howToRead: "The urgency driver is the key paragraph. If the answer is 'nothing changed, the problem just exists' - that's a red flag. Regulatory inflection points, cost curve shifts, and new enabling technologies are the strongest 'why now' signals.",
    redFlag: "Vague tailwinds like 'sustainability is growing' are not why-now signals. Look for something specific: a regulation deadline, a supply shock, a cost threshold crossed.",
  },
  use_case: {
    why: "Most deep tech can theoretically serve 10 markets. That's a death sentence for a venture - we'll spread thin, win nothing, and confuse every potential partner. This section forces us to rank and give a genuine verdict on each use case. The beachhead should have a specific buyer, a quantifiable pain, and at least one real signal of demand.",
    howToRead: "Focus on the top-ranked use case. Ask: is the buyer specific enough that we could name 5 companies to call right now? Is there a real demand signal beyond 'the market is large'? Is the fit genuinely differentiated, or would any alternative solution do the same job?",
    redFlag: "If every use case is ranked 'Primary' or none have a real demand signal - the analysis hasn't been validated with actual customer conversations yet.",
  },
  vs_existing: {
    why: "The honest comparison is what separates a venture-backable technology from interesting science. The question isn't 'is this better?' - it's 'is this better enough, on the dimensions buyers actually care about, to justify switching?' Switching friction is almost always underestimated: procurement cycles, re-qualification, and existing supplier relationships all slow adoption more than we expect.",
    howToRead: "Look at the 'where this tech loses' column as carefully as the wins. If the technology only wins on sustainability but loses on cost, speed, and reliability - most procurement teams won't move. The switching friction tells us how long the sales cycle will realistically be.",
    redFlag: "A comparison that only lists advantages hasn't been stress-tested. Ask: why hasn't a well-resourced competitor already solved this?",
  },
  unit_economics: {
    why: "This is the earliest stress test of the business model - whether the revenue and cost makes sense from a unit perspective. CapEx-heavy models need to show or convince the buyer that the returns or payback period makes sense economically. If we can't sketch a viable path from the data we have, that's a signal for us to gather more before going further.",
    howToRead: "Find the key equation and stress-test one variable at a time. What happens to margin if CapEx is 2x higher? If price is 20% lower than expected? If production yield is half the projection? The venture is only as strong as its weakest assumption.",
    redFlag: "Unit economics that only work at 'full scale' without a clear path to get there are a red flag. Early viability should be visible even at small initial volumes, or there needs to be a credible grant or subsidy bridge.",
  },
  market_sizing: {
    why: "TAM is for context. SAM is for focus. SOM is the only number that really matters at pre-seed and seed - and it has to be built bottoms-up from what a funded team can actually execute in 3-5 years. Top-down SOM ('we'll capture 1% of a $10B market') isn't analysis, it's a placeholder that hides all the real questions about go-to-market, sales cycles, and operational capacity.",
    howToRead: "The SOM math is what to scrutinize. N customers x revenue per customer = SOM. Ask: is N realistic given B2B sales cycles and the need for reference customers? Is the revenue per customer grounded in what buyers have actually said they'd pay?",
    redFlag: "Any SOM derived as a percentage of SAM or TAM hasn't been thought through. Also watch for SOM numbers that require closing more customers per year than is realistic for an early-stage B2B team.",
  },
};

const INPUT_TYPES = [
  { value: 'call_notes', label: 'Call Notes' },
  { value: 'deck', label: 'Deck / Slides' },
  { value: 'paper', label: 'Research Paper' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function inputIcon(type: string) {
  if (type === 'deck' || type === 'paper') {
    return (
      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function sectionDot(section: VentureSection | undefined) {
  if (!section || !section.content) {
    return <span className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />;
  }
  if (section.editedAt) {
    return <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />;
  }
  if (section.generatedAt) {
    return <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#F0602C' }} />;
  }
  return <span className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />;
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'bg-orange-50 text-[#F0602C]',
    draft: 'bg-gray-100 text-gray-500',
    archived: 'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[status] || classes.draft}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Add Input Modal ──────────────────────────────────────────────────────────

const FILE_UPLOAD_TYPES = ['deck', 'paper'];

function AddInputModal({
  ventureId,
  onClose,
  onSaved,
  onSavedAndAnalyze,
}: {
  ventureId: number;
  onClose: () => void;
  onSaved: (input: VentureInput) => void;
  onSavedAndAnalyze: (input: VentureInput) => void;
}) {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayISO = today.toISOString().split('T')[0]; // "2026-03-15"

  const [type, setType] = useState('call_notes');
  const [label, setLabel] = useState(`Call — ${dateStr}`);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [inputDate, setInputDate] = useState(todayISO);
  const [visionMode, setVisionMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFileType = FILE_UPLOAD_TYPES.includes(type);

  const updateLabel = (newType: string) => {
    const typeLabel = INPUT_TYPES.find(t => t.value === newType)?.label || 'Note';
    setLabel(`${typeLabel} — ${dateStr}`);
    setType(newType);
    setContent('');
    setUploadedFile(null);
    setExtractError('');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentVisionMode = visionMode; // capture at time of call
    setExtractError('');
    setExtracting(true);
    setUploadedFile(file.name);
    setLabel(file.name.replace(/\.[^/.]+$/, '') + ` — ${dateStr}`);

    try {
      const fd = new FormData();
      fd.append('file', file);
      if (currentVisionMode) fd.append('mode', 'vision');
      const res = await fetch('/api/extract-text', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        setContent(data.text);
      } else {
        setExtractError(data.error || 'Extraction failed — try pasting manually.');
        // keep uploadedFile set so user sees the filename + error together
      }
    } catch (err) {
      setExtractError(`Upload failed: ${err instanceof Error ? err.message : 'network error'}. Try pasting manually.`);
    } finally {
      setExtracting(false);
      // reset file input so same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const save = async (andAnalyze = false) => {
    if (!label.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/inputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, label, content, inputDate }),
      });
      const data = await res.json();
      if (data.success) {
        if (andAnalyze) onSavedAndAnalyze(data.data);
        else onSaved(data.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const canSave = label.trim() && content.trim() && !extracting;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 w-full max-w-xl shadow-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">Add Input</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
            <select
              value={type}
              onChange={e => updateLabel(e.target.value)}
              className="w-full h-9 text-sm border border-gray-300 rounded px-3 focus:outline-none focus:border-[#F0602C] bg-white"
            >
              {INPUT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* File upload zone — deck & paper only */}
          {isFileType && (
            <div>
              {/* AI Vision toggle — shown FIRST so user sets mode before uploading */}
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded border border-gray-200 mb-3">
                <div>
                  <span className="text-xs font-medium text-gray-700">AI Vision extraction</span>
                  <span className="text-xs text-gray-400 ml-1.5">— reads diagrams, charts &amp; visual layout</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setVisionMode(v => !v);
                    setContent('');
                    setUploadedFile(null);
                    setExtractError('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${visionMode ? 'bg-[#F0602C]' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${visionMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.ppt,.docx,.doc"
                onChange={handleFileChange}
                className="hidden"
              />
              {!uploadedFile && !extracting ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-lg py-6 flex flex-col items-center gap-2 hover:border-[#F0602C] hover:bg-orange-50/30 transition group"
                >
                  <svg className="w-7 h-7 text-gray-300 group-hover:text-[#F0602C] transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-gray-500 group-hover:text-gray-700">Click to upload</span>
                  <span className="text-xs text-gray-400">PDF, PPTX, DOCX supported</span>
                </button>
              ) : extracting ? (
                <div className="w-full border border-gray-200 rounded-lg py-5 flex items-center justify-center gap-2.5">
                  <svg className="w-4 h-4 animate-spin text-[#F0602C]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-gray-500">
                    {visionMode ? `AI analyzing ${uploadedFile}… (15–30s)` : `Extracting text from ${uploadedFile}…`}
                  </span>
                </div>
              ) : (
                <div className="w-full border border-green-200 bg-green-50 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate max-w-[280px]">{uploadedFile}</span>
                    <span className="text-xs text-gray-400">— text extracted</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setUploadedFile(null); setContent(''); fileInputRef.current?.click(); }}
                    className="text-xs text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                  >
                    Replace
                  </button>
                </div>
              )}
              {extractError && (
                <p className="text-xs text-red-500 mt-2 leading-relaxed">{extractError}</p>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
            <input
              type="date"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              className="w-full h-9 text-sm border border-gray-300 rounded px-3 focus:outline-none focus:border-[#F0602C]"
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full h-9 text-sm border border-gray-300 rounded px-3 focus:outline-none focus:border-[#F0602C]"
            />
          </div>

          {/* Content — textarea for non-file types, or review extracted text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                {isFileType && uploadedFile ? 'Extracted Text (review & edit)' : 'Content'}
              </label>
              {isFileType && uploadedFile && (
                <span className="text-xs text-gray-400">{content.length.toLocaleString()} chars</span>
              )}
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={isFileType && uploadedFile ? 6 : 8}
              placeholder={isFileType ? 'Upload a file above, or paste content manually…' : 'Paste call notes, email thread, or any relevant context…'}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#F0602C] resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 gap-3">
          <button
            onClick={onClose}
            className="h-9 px-4 text-sm font-medium text-gray-600 border border-gray-300 rounded hover:border-gray-400 transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => save(false)}
              disabled={!canSave}
              className="h-9 px-4 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:border-gray-400 transition disabled:opacity-40"
            >
              Save
            </button>
            <button
              onClick={() => save(true)}
              disabled={saving || !canSave}
              className="h-9 px-4 text-sm font-medium text-white rounded transition disabled:opacity-40 inline-flex items-center gap-1.5"
              style={{ backgroundColor: '#F0602C' }}
            >
              {saving && (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              Save & Re-analyze All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Content Block ────────────────────────────────────────────────────

function SectionBlock({
  section,
  ventureId,
  analyzing,
  onSave,
}: {
  section: VentureSection;
  ventureId: number;
  analyzing: boolean;
  onSave: (key: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.content);
  const [showMethodology, setShowMethodology] = useState(false);
  const methodology = SECTION_METHODOLOGY[section.key];

  const handleSave = async () => {
    const res = await fetch(`/api/ventures/${ventureId}/sections/${section.key}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    const data = await res.json();
    if (data.success) {
      onSave(section.key, editContent);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(section.content);
    setEditing(false);
  };

  return (
    <div id={`section-${section.key}`} className="py-8 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">{SECTION_LABELS[section.key]}</h2>
          {methodology && (
            <button
              onClick={() => setShowMethodology(v => !v)}
              title="Why this section?"
              className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition text-[10px] font-semibold leading-none
                ${showMethodology
                  ? 'border-[#F0602C] text-[#F0602C]'
                  : 'border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600'}`}
            >
              i
            </button>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {section.generatedAt && (
              <span className="hidden sm:inline text-xs text-gray-400">
                Generated {formatDate(section.generatedAt)}
                {section.inputCount > 0 && ` · after ${section.inputCount} input${section.inputCount !== 1 ? 's' : ''}`}
              </span>
            )}
            {section.content && (
              <button
                onClick={() => { setEditContent(section.content); setEditing(true); }}
                className="text-xs text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Methodology callout */}
      {showMethodology && methodology && (
        <div className="mb-5 rounded-lg border border-orange-100 bg-orange-50/40 px-4 py-3.5 space-y-2.5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Why this section</p>
            <p className="text-xs text-gray-600 leading-relaxed">{methodology.why}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">How to read it</p>
            <p className="text-xs text-gray-600 leading-relaxed">{methodology.howToRead}</p>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            <span className="font-semibold text-red-500 uppercase tracking-wide mr-1.5">Red flag</span>
            {methodology.redFlag}
          </p>
        </div>
      )}

      {editing ? (
        <div>
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            rows={10}
            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#F0602C] resize-y leading-relaxed"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSave}
              className="h-8 px-3 text-xs font-medium text-white rounded transition"
              style={{ backgroundColor: '#F0602C' }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="h-8 px-3 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:border-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : section.content ? (
        <MarkdownContent text={section.content} />
      ) : analyzing ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating...
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic">No analysis yet.</div>
      )}
    </div>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-50 text-red-600 border-red-200',
    high: 'bg-orange-50 text-orange-600 border-orange-200',
    medium: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  const labels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
  };
  const s = styles[priority] || styles.medium;
  return (
    <span className={`inline-flex items-center text-xs font-medium px-1.5 py-0.5 rounded border flex-shrink-0 ${s}`}>
      {labels[priority] || 'Medium'}
    </span>
  );
}

// ─── Questions Section ────────────────────────────────────────────────────────

function QuestionsSection({
  ventureId,
  questions,
  onUpdate,
}: {
  ventureId: number;
  questions: VentureQuestion[];
  onUpdate: (questions: VentureQuestion[]) => void;
}) {
  const [newQ, setNewQ] = useState('');
  const [answerInputs, setAnswerInputs] = useState<Record<number, string>>({});
  const [clearing, setClearing] = useState(false);

  const openCount = questions.filter(q => !q.answered).length;
  const answeredCount = questions.filter(q => q.answered).length;

  // Sort by priority: critical first, then high, then medium, then answered last
  const priorityOrder = ['critical', 'high', 'medium'];
  const sorted = [...questions].sort((a, b) => {
    if (a.answered !== b.answered) return a.answered ? 1 : -1;
    return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
  });

  const addQuestion = async () => {
    if (!newQ.trim()) return;
    const res = await fetch(`/api/ventures/${ventureId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: newQ.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      onUpdate([...questions, data.data]);
      setNewQ('');
    }
  };

  const deleteQuestion = async (qId: number) => {
    const res = await fetch(`/api/ventures/${ventureId}/questions/${qId}`, { method: 'DELETE' });
    if (res.ok) onUpdate(questions.filter(q => q.id !== qId));
  };

  const clearAll = async () => {
    if (!confirm('Clear all assumptions? They will be regenerated next time you run Analyze All.')) return;
    setClearing(true);
    const res = await fetch(`/api/ventures/${ventureId}/questions`, { method: 'DELETE' });
    if (res.ok) onUpdate([]);
    setClearing(false);
  };

  const markAnswered = async (q: VentureQuestion) => {
    const answer = answerInputs[q.id] || '';
    const res = await fetch(`/api/ventures/${ventureId}/questions/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer, answered: true }),
    });
    const data = await res.json();
    if (data.success) {
      onUpdate(questions.map(qq => qq.id === q.id ? data.data : qq));
      setAnswerInputs(prev => { const next = { ...prev }; delete next[q.id]; return next; });
    }
  };

  const toggleAnswered = async (q: VentureQuestion) => {
    const res = await fetch(`/api/ventures/${ventureId}/questions/${q.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answered: !q.answered }),
    });
    const data = await res.json();
    if (data.success) onUpdate(questions.map(qq => qq.id === q.id ? data.data : qq));
  };

  return (
    <div id="section-questions" className="py-8 border-b border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Assumptions to Validate</h2>
          <p className="text-xs text-gray-400 mt-0.5">{openCount} unvalidated · {answeredCount} validated</p>
        </div>
        {questions.length > 0 && (
          <button
            onClick={clearAll}
            disabled={clearing}
            className="text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-40"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4 mb-4">
        {sorted.map(q => (
          <div key={q.id} className="group">
            <div className="flex items-start gap-2.5">
              <button
                onClick={() => toggleAnswered(q)}
                className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 transition ${
                  q.answered ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'
                } flex items-center justify-center`}
              >
                {q.answered && (
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  {!q.answered && <PriorityBadge priority={q.priority} />}
                  <p className={`text-sm leading-relaxed ${q.answered ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {q.question}
                  </p>
                </div>
                {q.answered && q.answer && (
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Validation: {q.answer}</p>
                )}
                {!q.answered && (
                  <div className="mt-2 flex items-start gap-2">
                    <textarea
                      rows={2}
                      placeholder="How was this validated? What did you find?"
                      value={answerInputs[q.id] || ''}
                      onChange={e => setAnswerInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#F0602C] resize-none text-gray-700"
                    />
                    <button
                      onClick={() => markAnswered(q)}
                      disabled={!(answerInputs[q.id] || '').trim()}
                      className="h-8 px-2.5 text-xs font-medium text-white rounded transition disabled:opacity-40 flex-shrink-0"
                      style={{ backgroundColor: '#F0602C' }}
                    >
                      Mark Validated
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteQuestion(q.id)}
                className="mt-0.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add an assumption..."
          value={newQ}
          onChange={e => setNewQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addQuestion()}
          className="flex-1 h-9 text-sm border border-gray-200 rounded px-3 focus:outline-none focus:border-[#F0602C]"
        />
        <button
          onClick={addQuestion}
          disabled={!newQ.trim()}
          className="h-9 px-3 text-sm font-medium text-gray-700 border border-gray-200 rounded hover:border-gray-400 transition disabled:opacity-40"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ─── Actions Section ──────────────────────────────────────────────────────────

function ActionsSection({
  ventureId,
  actions,
  onUpdate,
}: {
  ventureId: number;
  actions: VentureAction[];
  onUpdate: (actions: VentureAction[]) => void;
}) {
  const [newAction, setNewAction] = useState('');
  const [hovered, setHovered] = useState<number | null>(null);
  const [suggestingActions, setSuggestingActions] = useState(false);

  const openCount = actions.filter(a => !a.done).length;

  const suggestActions = async () => {
    setSuggestingActions(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/actions/suggest`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onUpdate([...actions, ...data.data]);
      } else {
        alert(data.error || 'Failed to suggest actions');
      }
    } finally {
      setSuggestingActions(false);
    }
  };

  const addAction = async () => {
    if (!newAction.trim()) return;
    const res = await fetch(`/api/ventures/${ventureId}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newAction.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      onUpdate([...actions, data.data]);
      setNewAction('');
    }
  };

  const toggleDone = async (action: VentureAction) => {
    const res = await fetch(`/api/ventures/${ventureId}/actions/${action.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !action.done }),
    });
    const data = await res.json();
    if (data.success) {
      onUpdate(actions.map(a => a.id === action.id ? data.data : a));
    }
  };

  const deleteAction = async (aId: number) => {
    const res = await fetch(`/api/ventures/${ventureId}/actions/${aId}`, { method: 'DELETE' });
    if (res.ok) {
      onUpdate(actions.filter(a => a.id !== aId));
    }
  };

  return (
    <div id="section-actions" className="py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Actions</h2>
          <p className="text-xs text-gray-400 mt-0.5">{openCount} open</p>
        </div>
        <button
          onClick={suggestActions}
          disabled={suggestingActions}
          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white rounded transition disabled:opacity-50"
          style={{ backgroundColor: '#F0602C' }}
        >
          {suggestingActions ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Suggest with AI
            </>
          )}
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {actions.map(a => (
          <div
            key={a.id}
            className="flex items-center gap-2 group"
            onMouseEnter={() => setHovered(a.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <button
              onClick={() => toggleDone(a)}
              className={`w-4 h-4 rounded border flex-shrink-0 transition flex items-center justify-center ${
                a.done ? 'bg-gray-400 border-gray-400 text-white' : 'border-gray-300 hover:border-gray-500'
              }`}
            >
              {a.done && (
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`text-sm flex-1 ${a.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
              {a.text}
            </span>
            {hovered === a.id && (
              <button
                onClick={() => deleteAction(a.id)}
                className="text-gray-300 hover:text-red-400 transition flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Add an action item..."
          value={newAction}
          onChange={e => setNewAction(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addAction()}
          className="flex-1 h-9 text-sm border border-gray-200 rounded px-3 focus:outline-none focus:border-[#F0602C]"
        />
        <button
          onClick={addAction}
          disabled={!newAction.trim()}
          className="h-9 px-3 text-sm font-medium text-gray-700 border border-gray-200 rounded hover:border-gray-400 transition disabled:opacity-40"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VentureWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = use(params);
  const ventureId = parseInt(idParam);

  const [venture, setVenture] = useState<VentureCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Analyze state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeDropdownOpen, setAnalyzeDropdownOpen] = useState(false);
  const analyzeDropdownRef = useRef<HTMLDivElement>(null);

  // Add input modal
  const [showAddInput, setShowAddInput] = useState(false);
  const [viewingInput, setViewingInput] = useState<VentureInput | null>(null);
  const [editingInput, setEditingInput] = useState(false);
  const [editInputLabel, setEditInputLabel] = useState('');
  const [editInputContent, setEditInputContent] = useState('');
  const [editInputDate, setEditInputDate] = useState('');
  const [savingInput, setSavingInput] = useState(false);

  // Active sidebar section
  const [activeSection, setActiveSection] = useState('summary');

  // Load venture
  useEffect(() => {
    if (isNaN(ventureId)) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/ventures/${ventureId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setVenture(d.data);
        else setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [ventureId]);

  // Close analyze dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (analyzeDropdownRef.current && !analyzeDropdownRef.current.contains(e.target as Node)) {
        setAnalyzeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // Track active section via scroll
  useEffect(() => {
    const handleScroll = () => {
      const allKeys = [...SECTION_KEYS, 'questions', 'actions'];
      for (const key of [...allKeys].reverse()) {
        const el = document.getElementById(`section-${key}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(key);
            return;
          }
        }
      }
      setActiveSection(allKeys[0]);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const saveTitle = async () => {
    if (!venture || !titleInput.trim() || titleInput === venture.title) {
      setEditingTitle(false);
      return;
    }
    const res = await fetch(`/api/ventures/${ventureId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleInput.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setVenture(v => v ? { ...v, title: data.data.title } : v);
    }
    setEditingTitle(false);
  };

  const analyze = async (key?: string) => {
    setAnalyzing(true);
    setAnalyzeDropdownOpen(false);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(key ? { key } : {}),
      });
      const data = await res.json();
      if (data.success) {
        setVenture(v => v ? {
          ...v,
          sections: data.data.sections,
          questions: data.data.questions,
        } : v);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const scrollToSection = (key: string) => {
    const el = document.getElementById(`section-${key}`);
    if (el) {
      const headerOffset = 80; // fixed nav height + breathing room
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveSection(key);
    }
  };

  const handleInputSaved = (input: VentureInput) => {
    setVenture(v => v ? { ...v, inputs: [...v.inputs, input] } : v);
    setShowAddInput(false);
  };

  const handleInputSavedAndAnalyze = async (input: VentureInput) => {
    setVenture(v => v ? { ...v, inputs: [...v.inputs, input] } : v);
    setShowAddInput(false);
    await analyze();
  };

  const handleDeleteInput = async (inputId: number) => {
    const res = await fetch(`/api/ventures/${ventureId}/inputs/${inputId}`, { method: 'DELETE' });
    if (res.ok) {
      setVenture(v => v ? { ...v, inputs: v.inputs.filter(i => i.id !== inputId) } : v);
    }
  };

  const handleUpdateInput = async () => {
    if (!viewingInput) return;
    setSavingInput(true);
    const res = await fetch(`/api/ventures/${ventureId}/inputs/${viewingInput.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: editInputLabel, content: editInputContent, inputDate: editInputDate }),
    });
    if (res.ok) {
      const updated = { ...viewingInput, label: editInputLabel, content: editInputContent, inputDate: editInputDate };
      setVenture(v => v ? { ...v, inputs: v.inputs.map(i => i.id === viewingInput.id ? updated : i) } : v);
      setViewingInput(updated);
      setEditingInput(false);
    }
    setSavingInput(false);
  };

  const handleSectionSave = (key: string, content: string) => {
    setVenture(v => v ? {
      ...v,
      sections: v.sections.map(s => s.key === key ? { ...s, content, editedAt: new Date().toISOString() } : s),
    } : v);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (notFound || !venture) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">Venture case not found.</p>
          <Link href="/ventures" className="text-sm text-[#F0602C] hover:underline">Back to Ventures</Link>
        </div>
      </div>
    );
  }

  const sectionMap = Object.fromEntries(venture.sections.map(s => [s.key, s]));
  const navItems = [
    ...SECTION_KEYS.map(k => ({ key: k, label: SECTION_LABELS[k] })),
    { key: 'questions', label: 'Assumptions' },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Top bar */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {/* Breadcrumb */}
            <Link href="/ventures" className="text-sm text-gray-400 hover:text-gray-700 transition flex-shrink-0 flex items-center gap-1 w-fit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Ventures
            </Link>

            {/* Title + status */}
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight bg-transparent border-b-2 border-[#F0602C] outline-none flex-1 min-w-0 py-0.5"
                />
              ) : (
                <h1
                  className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight cursor-text hover:text-gray-700 transition"
                  onClick={() => { setTitleInput(venture.title); setEditingTitle(true); }}
                  title="Click to edit"
                >
                  {venture.title}
                </h1>
              )}
              <StatusBadge status={venture.status} />
            </div>
          </div>

          {/* Analyze button */}
          <div ref={analyzeDropdownRef} className="relative flex-shrink-0">
            <div className="flex items-center">
              <button
                onClick={() => analyze()}
                disabled={analyzing}
                className="h-9 px-3 sm:pl-4 sm:pr-2 text-sm font-medium text-white rounded-l transition disabled:opacity-50 inline-flex items-center gap-1.5"
                style={{ backgroundColor: '#F0602C' }}
              >
                {analyzing ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                <span className="hidden sm:inline">{analyzing ? 'Analyzing...' : 'Analyze All'}</span>
              </button>
              <button
                onClick={() => setAnalyzeDropdownOpen(o => !o)}
                disabled={analyzing}
                className="h-9 px-2 text-white rounded-r border-l border-white/20 transition disabled:opacity-50"
                style={{ backgroundColor: '#F0602C' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {analyzeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => analyze()}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Analyze All Sections
                </button>
                <div className="h-px bg-gray-100 my-1" />
                {SECTION_KEYS.map(k => (
                  <button
                    key={k}
                    onClick={() => analyze(k)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    Regenerate {SECTION_LABELS[k]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subtitle */}
        {(venture.researcher || venture.techOffer) && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-6">
            {venture.researcher && (
              <Link href={`/researchers/${venture.researcher.id}`} className="hover:text-gray-800 transition">
                {venture.researcher.fullName} · {venture.researcher.affiliation}
              </Link>
            )}
            {venture.researcher && venture.techOffer && <span className="text-gray-300">|</span>}
            {venture.techOffer && (
              <Link href={`/tech-offers/${venture.techOffer.id}`} className="hover:text-gray-800 transition">
                {venture.techOffer.technology}
              </Link>
            )}
          </div>
        )}

        {/* Main layout: sidebar + content */}
        <div className="flex gap-6 items-start">
          {/* Sidebar */}
          <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-[calc(3.5rem+1rem)]">
            <div className="bg-white border border-gray-200 rounded-lg p-5 overflow-y-auto max-h-[calc(100vh-6rem)]">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Sections</p>
              <nav className="space-y-0.5">
                {navItems.map(item => {
                  const section = sectionMap[item.key];
                  const isActive = activeSection === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => scrollToSection(item.key)}
                      className={`w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition ${
                        isActive ? 'text-gray-900 bg-gray-50 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {item.key === 'questions' ? (
                        <span className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
                      ) : item.key === 'actions' ? (
                        <span className="w-2 h-2 rounded-full bg-gray-200 flex-shrink-0" />
                      ) : (
                        sectionDot(section)
                      )}
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="h-px bg-gray-100 my-4" />

              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Inputs</p>
                <button
                  onClick={() => setShowAddInput(true)}
                  className="text-xs text-gray-400 hover:text-gray-700 transition font-medium"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-0.5">
                {venture.inputs.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No inputs yet</p>
                ) : (
                  [...venture.inputs].sort((a, b) => {
                    const dateA = a.inputDate ? new Date(a.inputDate).getTime() : new Date(a.createdAt).getTime();
                    const dateB = b.inputDate ? new Date(b.inputDate).getTime() : new Date(b.createdAt).getTime();
                    return dateA - dateB; // ascending: oldest first
                  }).map(input => (
                    <div key={input.id} className="group flex items-center gap-1.5 py-1.5 px-2 rounded hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => setViewingInput(input)}
                    >
                      {inputIcon(input.type)}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-600 truncate block" title={input.label}>{input.label}</span>
                        {(input.inputDate || input.createdAt) && (
                          <span className="text-xs text-gray-400 font-mono">
                            {formatDate(input.inputDate || input.createdAt)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteInput(input.id); }}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition flex-shrink-0"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-4 sm:px-8">
            {/* Mobile: top toolbar */}
            <div className="lg:hidden flex items-center justify-between py-3 border-b border-gray-100">
              <button
                onClick={() => setShowAddInput(true)}
                className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Input
              </button>
              <span className="text-xs text-gray-400">{venture.inputs.length} input{venture.inputs.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Mobile: section nav pills */}
            <div className="lg:hidden -mx-4 px-4 overflow-x-auto flex gap-1.5 py-3 border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => scrollToSection(item.key)}
                  className={`flex-shrink-0 h-7 px-3 text-xs font-medium rounded-full border transition ${
                    activeSection === item.key
                      ? 'border-[#F0602C] text-[#F0602C] bg-orange-50'
                      : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Analysis sections */}
            {SECTION_KEYS.map(key => (
              <SectionBlock
                key={key}
                section={sectionMap[key] || { id: 0, key, content: '', generatedAt: null, editedAt: null, inputCount: 0 }}
                ventureId={ventureId}
                analyzing={analyzing}
                onSave={handleSectionSave}
              />
            ))}

            {/* Questions */}
            <QuestionsSection
              ventureId={ventureId}
              questions={venture.questions}
              onUpdate={qs => setVenture(v => v ? { ...v, questions: qs } : v)}
            />

            {/* Actions */}
            <ActionsSection
              ventureId={ventureId}
              actions={venture.actions}
              onUpdate={as => setVenture(v => v ? { ...v, actions: as } : v)}
            />
          </main>
        </div>
      </div>

      {/* Add Input Modal */}
      {showAddInput && (
        <AddInputModal
          ventureId={ventureId}
          onClose={() => setShowAddInput(false)}
          onSaved={handleInputSaved}
          onSavedAndAnalyze={handleInputSavedAndAnalyze}
        />
      )}

      {/* Input view/edit modal */}
      {viewingInput && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setViewingInput(null); setEditingInput(false); }}>
          <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl shadow-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {inputIcon(viewingInput.type)}
                {editingInput ? (
                  <input
                    className="text-sm font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 flex-1 min-w-0 focus:outline-none focus:border-gray-400"
                    value={editInputLabel}
                    onChange={e => setEditInputLabel(e.target.value)}
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-900 truncate">{viewingInput.label}</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                {!editingInput && (
                  <button
                    onClick={() => {
                      setEditingInput(true);
                      setEditInputLabel(viewingInput.label);
                      setEditInputContent(viewingInput.content);
                      setEditInputDate(viewingInput.inputDate ? new Date(viewingInput.inputDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 transition"
                  >
                    Edit
                  </button>
                )}
                <span className="text-xs text-gray-400">{formatDate(viewingInput.inputDate || viewingInput.createdAt)}</span>
                <button onClick={() => { setViewingInput(null); setEditingInput(false); }} className="text-gray-400 hover:text-gray-600 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {editingInput ? (
                <>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Date</label>
                    <input
                      type="date"
                      value={editInputDate}
                      onChange={e => setEditInputDate(e.target.value)}
                      className="w-full h-9 text-sm border border-gray-300 rounded px-3 focus:outline-none focus:border-[#F0602C]"
                    />
                  </div>
                  <textarea
                    className="w-full h-64 text-sm text-gray-700 leading-relaxed border border-gray-300 rounded p-3 resize-y focus:outline-none focus:border-gray-400 font-sans"
                    value={editInputContent}
                    onChange={e => setEditInputContent(e.target.value)}
                  />
                </>
              ) : (
                <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{viewingInput.content}</pre>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
              <button
                onClick={() => { handleDeleteInput(viewingInput.id); setViewingInput(null); setEditingInput(false); }}
                className="text-xs text-red-400 hover:text-red-600 transition"
              >
                Delete input
              </button>
              <div className="flex items-center gap-2">
                {editingInput ? (
                  <>
                    <button
                      onClick={() => setEditingInput(false)}
                      className="h-8 px-4 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:border-gray-400 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateInput}
                      disabled={savingInput}
                      className="h-8 px-4 text-xs font-medium text-white rounded transition disabled:opacity-50"
                      style={{ backgroundColor: '#F0602C' }}
                    >
                      {savingInput ? 'Saving…' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setViewingInput(null); setEditingInput(false); }} className="h-8 px-4 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:border-gray-400 transition">
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
