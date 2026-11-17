import React, { useState } from 'react';
import { ToolDefinition, getToolBySlug } from '../../config/toolsRegistry';
import {
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  HelpCircle,
  BookOpen,
  Sparkles,
  Sliders,
  FileCheck,
  AlertTriangle,
  Wrench,
  Info,
} from 'lucide-react';
import { getToolVisualSpec } from '../../config/toolVisualMetadata';
import { getToolTechnicalProfile } from '../../config/toolTechnicalProfiles';
import { getRelatedToolSlugs } from '../../config/relatedToolsMap';
import { BLOG_POSTS } from '../../config/blogPosts';
import { getHindiCounterpartForEnglishSlug } from '../../config/hindiPages';

interface ToolSeoContentSectionProps {
  tool: ToolDefinition;
  onSelectTool: (tool: ToolDefinition) => void;
  onNavigate?: (view: string) => void;
}

export const ToolSeoContentSection: React.FC<ToolSeoContentSectionProps> = ({
  tool,
  onSelectTool,
  onNavigate,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex((prev) => (prev === idx ? null : idx));
  };

  const profile = getToolTechnicalProfile(tool.slug);
  const relatedSlugs = getRelatedToolSlugs(tool.id);

  const relatedTools = relatedSlugs
    .map((slug) => getToolBySlug(slug))
    .filter((t): t is ToolDefinition => Boolean(t) && t !== undefined && t.id !== tool.id)
    .slice(0, 4);

  const relatedGuides = BLOG_POSTS.filter((p) => p.relatedToolSlugs.includes(tool.slug));
  const hindiCounterpart = getHindiCounterpartForEnglishSlug(tool.slug);

  const faqs =
    tool.faqs && tool.faqs.length > 0
      ? tool.faqs
      : [
          {
            question: `Is ${tool.title} completely free to use?`,
            answer: `Yes, ${tool.title} is completely free with no hidden charges, trial periods, or credit card requirements.`,
          },
          {
            question: `Are my files kept private on PottoTools?`,
            answer: `Yes. Processing runs locally on your device inside your web browser. Your files are not transmitted to or stored on remote application servers.`,
          },
          {
            question: `Do I need to install software or register?`,
            answer: `No. PottoTools runs directly in modern web browsers across desktop, tablet, and mobile devices without registration or software installation.`,
          },
        ];

  const instructions =
    tool.instructions && tool.instructions.length > 0
      ? tool.instructions
      : [
          `Upload your ${tool.acceptedFormats.join(', ')} file by dragging it into the workspace or clicking browse.`,
          `Select your desired settings or adjustment options from the configuration panel.`,
          `Click the action button to process the file locally in your browser.`,
          `Preview the result and click download to save the finished file directly to your device.`,
        ];

  return (
    <div className="w-full mt-10 space-y-8 text-slate-800 dark:text-slate-200">
      {/* 1. Introduction & Supported Formats Overview */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Info className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            About {tool.title}
          </h2>
        </div>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {tool.fullDesc || tool.shortDesc}
        </p>

        {/* Specifications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Supported Inputs</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{tool.acceptedFormats.join(', ')}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Output Format</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{tool.outputFormat}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Max File Size</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{tool.maxFileSizeMB} MB</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[11px] font-semibold uppercase">Execution Model</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">Client-Side (Local)</span>
          </div>
        </div>
      </section>

      {/* 2. Available Settings and Options */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Available Settings &amp; Options
          </h2>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          {profile.settingsAndOptions.map((opt, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>{opt}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Step-by-Step Instructions */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            How to Use {tool.title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instructions.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80"
            >
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                {idx + 1}
              </span>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Output Explanation & Limitations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Output Explanation */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Explanation of the Output
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {profile.outputExplanation}
            </p>
          </div>
        </section>

        {/* Relevant Limitations */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Technical Considerations &amp; Limitations
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              {profile.limitations.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold">&bull;</span>
                  <span>{lim}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* 5. Troubleshooting Guidance */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
            <Wrench className="w-4 h-4" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Troubleshooting Common Issues
          </h2>
        </div>

        <div className="space-y-3">
          {profile.troubleshooting.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-1"
            >
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Issue: {item.issue}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Solution:</strong> {item.solution}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Frequently Asked Questions */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Frequently Asked Questions About {tool.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear answers regarding format support, speed, and privacy
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-slate-50/70 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Accurate File-Processing & Privacy Information */}
      <section className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex items-center gap-2.5 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">
            Client-Side File Processing &amp; Privacy Notice
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          PottoTools executes all file conversion, compression, and image manipulation directly in your device web browser using client-side WebAssembly, HTML5 Canvas, and open-source libraries. Your documents are not transmitted over the network to external application servers. All memory buffers allocated during processing are released upon completion or when you navigate away.
        </p>
      </section>

      {/* 8. Related Tools */}
      {relatedTools.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Related Free Productivity Tools
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complementary utilities you might also need:
              </p>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 hidden sm:inline">
              100% Free
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => {
              const spec = getToolVisualSpec(relTool.id, relTool.title);
              const VisualComp = spec.visual;

              return (
                <a
                  key={relTool.id}
                  href={`/${relTool.slug}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onSelectTool(relTool);
                    }
                  }}
                  className="group p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="w-full h-14 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1 flex items-center justify-center mb-2.5 overflow-hidden shadow-2xs">
                      <VisualComp />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                      {relTool.categoryName}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                      {relTool.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {relTool.shortDesc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* 9. Matching Step-by-Step Guides & Hindi Edition */}
      {(relatedGuides.length > 0 || hindiCounterpart) && (
        <section className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Helpful Guides &amp; Language Editions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Learn workflows and tips or switch language edition:
              </p>
            </div>
            {hindiCounterpart && (
              <a
                href={`/${hindiCounterpart.slug}`}
                onClick={(e) => {
                  if (onNavigate && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigate(hindiCounterpart.slug);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-xs font-bold text-blue-600 dark:text-blue-400 no-underline transition-colors"
              >
                <span>हिंदी में पढ़ें: {hindiCounterpart.h1.split('–')[0].trim()}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {relatedGuides.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {relatedGuides.map((guide) => (
                <a
                  key={guide.slug}
                  href={`/blog/${guide.slug}`}
                  onClick={(e) => {
                    if (onNavigate && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onNavigate(`blog/${guide.slug}`);
                    }
                  }}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-colors flex items-center justify-between gap-3 no-underline group"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {guide.category} &bull; {guide.readTime}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 mt-0.5 line-clamp-1">
                      {guide.title}
                    </h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                </a>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
