import React from 'react';
import { HINDI_PAGES, HindiPageConfig } from '../../config/hindiPages';
import { getToolBySlug, ToolDefinition } from '../../config/toolsRegistry';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { ArrowRight, CheckCircle2, Globe, HelpCircle, ShieldCheck } from 'lucide-react';

interface HindiLandingPageProps {
  config: HindiPageConfig;
  onNavigateHome: () => void;
  onNavigateHindi: (slug: string) => void;
  onSelectTool: (tool: ToolDefinition) => void;
  onNavigateEnglishSlug: (enSlug: string) => void;
}

export const HindiLandingPage: React.FC<HindiLandingPageProps> = ({
  config,
  onNavigateHome,
  onNavigateHindi,
  onSelectTool,
  onNavigateEnglishSlug,
}) => {
  const linkedTool = config.linkedToolId ? getToolBySlug(config.linkedToolId) : undefined;
  const englishHref = config.enSlug ? `/${config.enSlug}` : '/';
  const otherHindiTools = HINDI_PAGES.filter((p) => p.slug !== config.slug && p.slug !== 'hi');

  return (
    <div lang="hi" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs
          items={
            config.slug === 'hi'
              ? [
                  { label: 'Home (EN)', href: '/', onClick: onNavigateHome },
                  { label: 'PottoTools हिंदी' },
                ]
              : [
                  { label: 'Home (EN)', href: '/', onClick: onNavigateHome },
                  { label: 'हिंदी टूल्स', href: '/hi', onClick: () => onNavigateHindi('hi') },
                  { label: config.h1.split('–')[0].trim() },
                ]
          }
        />

        <a
          href={englishHref}
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
              e.preventDefault();
              onNavigateEnglishSlug(config.enSlug);
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 no-underline transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>English Version</span>
        </a>
      </div>

      {/* Hero Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% मुफ़्त • कोई सर्वर अपलोड नहीं • सीधे ब्राउज़र में</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {config.h1}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          {config.subtitle}
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          {linkedTool ? (
            <a
              href={`/${linkedTool.slug}`}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onSelectTool(linkedTool);
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-colors no-underline"
            >
              <span>{config.ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <a
              href="/directory"
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                  e.preventDefault();
                  onNavigateEnglishSlug('directory');
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-colors no-underline"
            >
              <span>{config.ctaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
          मुख्य विशेषताएँ
        </h2>
        <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
          {config.highlights.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
          {config.stepsTitle}
        </h2>
        <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          {config.steps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span className="pt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Other Hindi Pages */}
      {otherHindiTools.length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            अन्य लोकप्रिय हिंदी टूल्स गाइड
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherHindiTools.map((hp) => (
              <a
                key={hp.slug}
                href={`/${hp.slug}`}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateHindi(hp.slug);
                  }
                }}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-colors flex items-center justify-between gap-2 no-underline"
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">{hp.h1}</span>
                <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            अक्सर पूछे जाने वाले प्रश्न (FAQ)
          </h2>
        </div>
        <div className="space-y-4">
          {config.faqs.map((faq, idx) => (
            <div key={idx} className="border-b last:border-b-0 border-slate-100 dark:border-slate-800 pb-4 last:pb-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
