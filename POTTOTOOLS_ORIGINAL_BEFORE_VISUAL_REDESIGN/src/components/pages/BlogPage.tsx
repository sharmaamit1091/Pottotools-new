import React from 'react';
import { BLOG_POSTS, BlogPost, getBlogPostBySlug } from '../../config/blogPosts';
import { getToolBySlug, ToolDefinition } from '../../config/toolsRegistry';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { ArrowRight, BookOpen, Calendar, Clock, HelpCircle, UserCheck, Wrench } from 'lucide-react';

interface BlogPageProps {
  slug?: string; // undefined = /blog index
  onNavigateHome: () => void;
  onNavigateBlog: (slug?: string) => void;
  onSelectTool: (tool: ToolDefinition) => void;
}

export const BlogPage: React.FC<BlogPageProps> = ({
  slug,
  onNavigateHome,
  onNavigateBlog,
  onSelectTool,
}) => {
  const post: BlogPost | undefined = slug ? getBlogPostBySlug(slug) : undefined;

  if (slug && !post) {
    return (
      <div className="max-w-3xl mx-auto py-14 px-4 text-center space-y-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Guide Not Found</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The requested guide article could not be found. Browse all practical PottoTools tutorials below.
        </p>
        <a
          href="/blog"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
              e.preventDefault();
              onNavigateBlog();
            }
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold no-underline"
        >
          <span>View All Guides</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  // Individual Blog Article View
  if (post) {
    const linkedTools = post.relatedToolSlugs
      .map((s) => getToolBySlug(s))
      .filter((t): t is ToolDefinition => Boolean(t));
    const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug);

    return (
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/', onClick: onNavigateHome },
            { label: 'Guides & Blog', href: '/blog', onClick: () => onNavigateBlog() },
            { label: post.title },
          ]}
        />

        <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              PottoTools Editorial Team
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Updated {post.updatedAt}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {post.excerpt}
          </p>
        </header>

        {/* Main Article Body */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-8">
          {post.sections.map((sec, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {sec.heading}
              </h2>
              {sec.paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {para}
                </p>
              ))}
              {sec.table && sec.table.headers.length > 0 && (
                <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                        {sec.table.headers.map((header, hIdx) => (
                          <th
                            key={hIdx}
                            className="px-4 py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {sec.table.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="bg-white dark:bg-slate-900">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className="px-4 py-3 text-slate-600 dark:text-slate-300 align-top"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sec.bullets && sec.bullets.length > 0 && (
                <ul className="space-y-2 pl-5 list-disc text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Linked Tools mentioned in this guide */}
        {linkedTools.length > 0 && (
          <section className="bg-blue-50/60 dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Wrench className="w-5 h-5" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Tools Featured in This Guide
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {linkedTools.map((tool) => (
                <a
                  key={tool.id}
                  href={`/${tool.slug}`}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                      e.preventDefault();
                      onSelectTool(tool);
                    }
                  }}
                  className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-colors flex items-center justify-between gap-3 no-underline group"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 truncate">
                      {tool.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {tool.shortDesc}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* FAQs */}
        {post.faqs.length > 0 && (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-4">
              {post.faqs.map((faq, idx) => (
                <div key={idx} className="border-b last:border-b-0 border-slate-100 dark:border-slate-800 pb-4 last:pb-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1">{faq.q}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* More Guides */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">More Practical Document Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherPosts.slice(0, 4).map((other) => (
              <a
                key={other.slug}
                href={`/blog/${other.slug}`}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onNavigateBlog(other.slug);
                  }
                }}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-colors no-underline group"
              >
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">{other.category}</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 mt-1">
                  {other.title}
                </h3>
              </a>
            ))}
          </div>
        </section>
      </article>
    );
  }

  // Blog Index View (/blog)
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/', onClick: onNavigateHome },
          { label: 'Guides & Blog' },
        ]}
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>PottoTools Practical Knowledge Base ({BLOG_POSTS.length} Guides)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Document, PDF &amp; Image Guides
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          In-depth technical tutorials explaining PDF compression byte budgets, lossless page rotation, Word-to-PDF layout rules, CSV/UTF-8 spreadsheets, OCR search workflows, exact KB photo sizing, and offline ID redaction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BLOG_POSTS.map((article) => (
          <a
            key={article.slug}
            href={`/blog/${article.slug}`}
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                onNavigateBlog(article.slug);
              }
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-6 shadow-xs flex flex-col justify-between gap-4 transition-all no-underline group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{article.category}</span>
                <span>{article.readTime}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                {article.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {article.excerpt}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Read Full Guide</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
