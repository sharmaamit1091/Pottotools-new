/**
 * PottoTools - Local Search Query Logger & Analytics
 * Tracks search queries in browser localStorage to identify user intent
 * and pinpoint popular missing tools without external telemetry.
 */

export interface SearchLogEntry {
  id: string;
  query: string;
  timestamp: string;
  epoch: number;
  resultsCount: number;
  isMissingTool: boolean;
}

const STORAGE_KEY = 'pottotools_search_logs';
const MAX_LOGS = 250;

/**
 * Retrieve all logged search queries from localStorage
 */
export function getSearchLogs(): SearchLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Log a search query entered anywhere on PottoTools (Hero or Header)
 */
export function logSearchQuery(query: string, resultsCount: number): void {
  if (typeof window === 'undefined') return;
  const trimmed = query.trim();
  // Avoid logging empty strings or single characters
  if (!trimmed || trimmed.length < 2) return;

  try {
    const existing = getSearchLogs();
    const now = Date.now();

    // Check if the most recent entry was the exact same search query
    const lastEntry = existing[0];
    if (lastEntry && lastEntry.query.toLowerCase() === trimmed.toLowerCase()) {
      // Just update results count and timestamp
      lastEntry.resultsCount = resultsCount;
      lastEntry.isMissingTool = resultsCount === 0;
      lastEntry.epoch = now;
      lastEntry.timestamp = new Date(now).toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      return;
    }

    const newEntry: SearchLogEntry = {
      id: `${now}-${Math.random().toString(36).substring(2, 7)}`,
      query: trimmed,
      timestamp: new Date(now).toISOString(),
      epoch: now,
      resultsCount,
      isMissingTool: resultsCount === 0,
    };

    // Prepend new search and keep up to MAX_LOGS
    const updated = [newEntry, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Get aggregated summary of missing tools (queries with 0 results)
 */
export function getMissingToolsSummary(): { query: string; count: number; lastSearched: string }[] {
  const logs = getSearchLogs();
  const missingMap: Record<string, { count: number; lastEpoch: number; lastSearched: string }> = {};

  logs
    .filter((log) => log.isMissingTool)
    .forEach((log) => {
      const q = log.query.toLowerCase();
      if (!missingMap[q]) {
        missingMap[q] = { count: 0, lastEpoch: log.epoch, lastSearched: log.timestamp };
      }
      missingMap[q].count += 1;
      if (log.epoch > missingMap[q].lastEpoch) {
        missingMap[q].lastEpoch = log.epoch;
        missingMap[q].lastSearched = log.timestamp;
      }
    });

  return Object.entries(missingMap)
    .map(([query, data]) => ({
      query,
      count: data.count,
      lastSearched: data.lastSearched,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Clear all search logs from localStorage
 */
export function clearSearchLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Export all logged search queries as a formatted CSV file
 */
export function exportSearchAnalyticsCSV(): boolean {
  if (typeof window === 'undefined') return false;
  const logs = getSearchLogs();
  if (logs.length === 0) return false;

  const headers = ['Query', 'Results Found', 'Status', 'Date', 'Time', 'ISO Timestamp'];
  const rows = logs.map((log) => {
    const dateObj = new Date(log.epoch || log.timestamp);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = dateObj.toLocaleTimeString();
    const status = log.resultsCount > 0 ? 'Found' : 'No Results (Missing Tool)';
    const escapedQuery = `"${log.query.replace(/"/g, '""')}"`;
    return [
      escapedQuery,
      log.resultsCount,
      `"${status}"`,
      `"${dateStr}"`,
      `"${timeStr}"`,
      `"${log.timestamp}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `pottotools_search_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

// Global browser console helper for site owner inspection
if (typeof window !== 'undefined') {
  const win = window as unknown as {
    getPottoSearchLogs?: () => SearchLogEntry[];
    getPottoMissingTools?: () => ReturnType<typeof getMissingToolsSummary>;
    clearPottoSearchLogs?: () => void;
    exportPottoSearchCSV?: () => boolean;
  };

  win.getPottoSearchLogs = () => {
    const logs = getSearchLogs();
    const missing = logs.filter((l) => l.isMissingTool);
    console.group('🔍 PottoTools Search Logs (localStorage)');
    console.log(`Total searches: ${logs.length} | Missing tools (0 results): ${missing.length}`);
    if (logs.length > 0) {
      console.table(
        logs.map((l) => ({
          Query: l.query,
          Results: l.resultsCount,
          'Missing Tool?': l.isMissingTool ? '⚠️ YES (0 Results)' : '✓ Found',
          Time: new Date(l.epoch).toLocaleTimeString(),
          Date: new Date(l.epoch).toLocaleDateString(),
        }))
      );
    }
    console.groupEnd();
    return logs;
  };

  win.getPottoMissingTools = () => {
    const missing = getMissingToolsSummary();
    console.group('⚠️ PottoTools Missing Tools (Searched but not found)');
    console.table(missing);
    console.groupEnd();
    return missing;
  };

  win.clearPottoSearchLogs = () => {
    clearSearchLogs();
    console.log('Search logs cleared successfully.');
  };

  win.exportPottoSearchCSV = () => {
    return exportSearchAnalyticsCSV();
  };
}
