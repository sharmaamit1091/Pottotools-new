import React from 'react';
import { SITE_CONFIG } from '../../config/site';
import { AlertCircle } from 'lucide-react';
import { AdSlot } from '../common/AdSlot';

export const DisclaimerPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Disclaimer & Regulatory Compliance
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Last Verified: {SITE_CONFIG.verifiedDate}
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">Government Portals & Application Requirements</div>
            <p>
              Preset rules for dimensions (such as 200x230 px) and file size bounds (20 KB - 50 KB) are compiled based on published candidate information brochures from official recruitment bodies (e.g., UPSC, SSC, IBPS, State PSCs, and passport agencies). While these are continuously verified ({SITE_CONFIG.verifiedDate}), candidates are solely responsible for reviewing the specific notification rules of their respective exam advertisement before submission.
            </p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Electronic Signatures vs Digital Certificates
          </h2>
          <p>
            The signature stamped by our "Sign PDF" tool represents an electronic image signature. It is suitable for routine contracts, agreements, and application sign-offs. It does NOT constitute a cryptographically tokenized digital signature certificate (DSC) backed by a licensed Certifying Authority (such as Class 3 DSC USB tokens).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Intellectual Property & Document Ownership
          </h2>
          <p>
            You retain 100% unconditional ownership of all documents, images, and data processed using {SITE_CONFIG.name}. We assert zero copyright or intellectual property claims over your uploaded or generated files.
          </p>
        </section>

        {/* In-Content AdSlot */}
        <div className="py-2">
          <AdSlot placement="content-inline" format="horizontal" minHeight={90} />
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Independent Website
          </h2>
          <p>
            {SITE_CONFIG.name} is an independent utility website. We are not affiliated with, endorsed by, or sponsored by Microsoft Corporation, Adobe Inc., the Union Public Service Commission (UPSC), the Staff Selection Commission (SSC), or any governmental authority. All trademarks belong to their respective owners.
          </p>
        </section>

        <section className="p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Questions & Policy Inquiries
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            For compliance or policy inquiries, please contact:{' '}
            <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-blue-600 dark:text-blue-400 font-mono font-semibold underline">
              {SITE_CONFIG.supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
};
