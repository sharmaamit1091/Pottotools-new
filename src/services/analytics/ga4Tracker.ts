/**
 * PottoTools - Google Analytics 4 (via GTM dataLayer) & Tool Funnel Tracker
 * Pushes privacy-safe SPA pageviews, tool opens, file selection events,
 * and completed conversion/download events without capturing personal filenames or file contents.
 */

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

let activeToolContext: { id: string; title: string; category: string } | null = null;

export function setActiveToolContext(
  tool: { id: string; title: string; category: string } | null
): void {
  activeToolContext = tool ? { id: tool.id, title: tool.title, category: tool.category } : null;
}

export function getActiveToolContext() {
  return activeToolContext;
}

function pushAnalyticsEvent(eventName: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    }
  } catch {
    // Never let analytics issues impact user workflows
  }
}

export function trackPageView(pagePath: string, pageTitle: string, language: 'en' | 'hi' = 'en'): void {
  if (typeof window === 'undefined') return;
  pushAnalyticsEvent('page_view', {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath}`,
    page_title: pageTitle,
    page_language: language,
  });
}

export function trackToolOpen(toolId: string, toolTitle: string, category: string): void {
  pushAnalyticsEvent('tool_open', {
    tool_id: toolId,
    tool_name: toolTitle,
    tool_category: category,
  });
}

export function trackToolFileSelected(
  fileCount: number,
  totalSizeBytes: number,
  extensions: string[],
  explicitToolId?: string
): void {
  const ctx = activeToolContext;
  pushAnalyticsEvent('tool_file_selected', {
    tool_id: explicitToolId || ctx?.id || 'unknown',
    tool_name: ctx?.title || 'Unknown Tool',
    file_count: fileCount,
    total_size_kb: Math.round(totalSizeBytes / 1024),
    file_extensions: Array.from(new Set(extensions)).slice(0, 5).join(','),
  });
}

export function trackToolCompleted(
  outputExtension: string,
  outputSizeBytes?: number,
  explicitToolId?: string
): void {
  const ctx = activeToolContext;
  pushAnalyticsEvent('tool_completed', {
    tool_id: explicitToolId || ctx?.id || 'unknown',
    tool_name: ctx?.title || 'Unknown Tool',
    output_format: outputExtension.toLowerCase(),
    output_size_kb: typeof outputSizeBytes === 'number' ? Math.round(outputSizeBytes / 1024) : undefined,
  });
}

export function trackToolError(reason: string, explicitToolId?: string): void {
  const ctx = activeToolContext;
  pushAnalyticsEvent('tool_error', {
    tool_id: explicitToolId || ctx?.id || 'unknown',
    error_reason: reason.slice(0, 120),
  });
}
