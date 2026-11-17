import React from 'react';
import { ShieldCheck, Lock, EyeOff, ServerOff, Database, Sparkles, CheckCircle } from 'lucide-react';

export const PrivacySecuritySection: React.FC = () => {
  return (
    <section className="py-10 sm:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 sm:p-14 border border-indigo-900/50 shadow-2xl">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-3.5 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Knowledge Privacy Standard</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Your Documents Never Touch Our Servers
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Most online PDF websites upload your confidential resumes, contracts, bank statements, and tax IDs to external cloud servers where they can be retained or leaked. PottoTools runs directly in your browser — your files never travel across the internet.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-10 mt-10 border-t border-indigo-900/40">
          {/* Card 1 */}
          <div className="bg-slate-900/80 backdrop-blur-xs p-6 rounded-2xl border border-indigo-900/40 space-y-3 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center">
              <ServerOff className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">No Cloud Storage</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are processed entirely within your computer's RAM. Zero bytes are uploaded to remote servers.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/80 backdrop-blur-xs p-6 rounded-2xl border border-indigo-900/40 space-y-3 hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">No Data Scraping</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never inspect, train models on, or log your document content. What you convert stays 100% confidential.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/80 backdrop-blur-xs p-6 rounded-2xl border border-indigo-900/40 space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">No Signup Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero mandatory registrations, credit cards, or subscription tiers. Every tool is immediately ready to use.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/80 backdrop-blur-xs p-6 rounded-2xl border border-indigo-900/40 space-y-3 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Instant RAM Purge</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Buffer allocations and Blob object URLs are automatically cleared from browser memory upon completion.
            </p>
          </div>
        </div>

        {/* Bottom Guarantee Banner */}
        <div className="relative z-10 mt-10 pt-6 border-t border-indigo-900/40 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Compliant with strict international privacy & GDPR client-side principles</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Verified Local Execution Engine
          </div>
        </div>
      </div>
    </section>
  );
};
