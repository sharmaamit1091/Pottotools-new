import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Download,
  Trash2,
  X,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Copy,
  Check,
} from 'lucide-react';
import {
  getSearchLogs,
  clearSearchLogs,
  exportSearchAnalyticsCSV,
  SearchLogEntry,
} from '../../services/analytics/searchQueryLogger';

interface SearchAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchAnalyticsModal: React.FC<SearchAnalyticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<SearchLogEntry[]>([]);
  const [filterText, setFilterText] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Load fresh logs when modal opens
  useEffect(() => {
    if (isOpen) {
      setLogs(getSearchLogs());
      setDownloadSuccess(false);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesText = log.query.toLowerCase().includes(filterText.toLowerCase());
      const matchesMissing = !onlyMissing || log.isMissingTool;
      return matchesText && matchesMissing;
    });
  }, [logs, filterText, onlyMissing]);

  const stats = useMemo(() => {
    const total = logs.length;
    const uniqueQueries = new Set(logs.map((l) => l.query.toLowerCase())).size;
    const missingCount = logs.filter((l) => l.isMissingTool).length;
    return { total, uniqueQueries, missingCount };
  }, [logs]);

  const handleExportCSV = () => {
    const success = exportSearchAnalyticsCSV();
    if (success) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all logged search queries? This cannot be undone.')) {
      clearSearchLogs();
      setLogs([]);
    }
  };

  const handleCopyQuery = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (epoch: number, iso: string) => {
    const date = new Date(epoch || iso);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-indigo-50/30 to-purple-50/30 dark:from-slate-800/50 dark:to-slate-800/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Search Analytics Dashboard</span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  localStorage
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                User search queries captured locally to help you understand visitor intent and requested tools.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Badges */}
        <div className="p-4 grid grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Total Searches
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {stats.uniqueQueries}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Unique Queries
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-2xs">
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.missingCount}
            </div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Zero Results (Missing)
            </div>
          </div>
        </div>

        {/* Toolbar: Filter, Missing filter toggle, Export CSV, Clear */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter search queries…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {filterText && (
                <button
                  onClick={() => setFilterText('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setOnlyMissing(!onlyMissing)}
              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                onlyMissing
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title="Show only searches that returned zero results"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Missing Only ({stats.missingCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </>
              )}
            </button>

            {logs.length > 0 && (
              <button
                onClick={handleClear}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                title="Clear all search logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* List of logged queries */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-4">
          {filteredLogs.length > 0 ? (
            <div className="space-y-1.5">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        log.resultsCount > 0
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {log.query}
                        </span>
                        {log.isMissingTool ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            0 Results
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {log.resultsCount} {log.resultsCount === 1 ? 'result' : 'results'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 inline" />
                        <span>{formatTimestamp(log.epoch, log.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyQuery(log.id, log.query)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                    title="Copy query text"
                  >
                    {copiedId === log.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {filterText || onlyMissing ? 'No matching queries found' : 'No search logs recorded yet'}
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {filterText || onlyMissing
                  ? 'Try clearing the search filter or toggle to see all queries.'
                  : 'Search queries typed into the hero or header search bar will automatically appear here.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <span>Data stored client-side in browser storage</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
