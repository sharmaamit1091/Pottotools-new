import React from 'react';
import { SITE_CONFIG } from '../../config/site';
import { Mail } from 'lucide-react';
import { AdSlot } from '../common/AdSlot';

export const TermsOfUse: React.FC = () => {
  const supportEmail = SITE_CONFIG.supportEmail || 'sharma.amit1091@gmail.com';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Last Verified: {SITE_CONFIG.verifiedDate}
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and utilizing {SITE_CONFIG.name}, you agree to comply with and be bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the website.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            2. Permitted Use & Free Access
          </h2>
          <p>
            All standard document tools (including PDF compression, format conversions, image editing, OCR, and government application utilities) are provided free of charge for personal, academic, and commercial purposes without mandatory registration or fees.
          </p>
        </section>

        {/* In-Content AdSlot */}
        <div className="py-2">
          <AdSlot placement="content-inline" format="horizontal" minHeight={90} />
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            3. Accuracy & Conversion Results
          </h2>
          <p>
            While we leverage battle-tested open-source libraries (pdf-lib, pdfjs-dist, Mammoth, SheetJS, Tesseract.js), document conversions (such as PDF to Word or OCR) rely on the quality, fonts, and structure of the source material. We do not guarantee 100% layout fidelity for scanned, handwritten, or corrupted source documents. Users are encouraged to verify output files before submitting to official government or legal bodies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            4. Limitation of Liability
          </h2>
          <p>
            {SITE_CONFIG.name} and its developers provide all software "as is" without warranty of any kind, either express or implied. Under no circumstances shall {SITE_CONFIG.name} be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this service.
          </p>
        </section>

        <section className="p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            5. Inquiries & Feedback
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            For questions regarding these terms, reach us at:{' '}
            <a href={`mailto:${supportEmail}`} className="text-blue-600 dark:text-blue-400 font-mono font-semibold underline">
              {supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
};
