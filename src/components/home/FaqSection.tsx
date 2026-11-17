import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What types of files can I process with PottoTools?',
    answer:
      'PottoTools supports major document and image formats including PDF documents, images (JPG, PNG, WebP, BMP), Microsoft Word documents (.docx), Excel spreadsheets (.xlsx, .csv), PowerPoint presentations (.pptx), and plain text or Markdown files.',
  },
  {
    question: 'How do I download, install, and use PottoTools 100% offline without internet?',
    answer:
      'Visit pottotools.in once while connected to the internet so our Service Worker automatically caches all 43+ PDF, document, and image tools into your browser. Then click "Install App (Works Offline)" (on Desktop Chrome/Edge click the address bar install icon; on Android tap Chrome menu ⋮ → Install app; on iPhone/iPad tap Safari Share → Add to Home Screen). After installation, turn off Wi-Fi or enable Airplane Mode and open the PottoTools icon to use every tool 100% offline.',
  },
  {
    question: 'How does in-browser file processing work?',
    answer:
      'Our utilities run directly inside your web browser utilizing modern WebAssembly and HTML5 Canvas engines. Instead of uploading your documents to remote cloud servers, the processing logic executes locally on your device processor. This minimizes network data transfer and keeps your files on your machine.',
  },
  {
    question: 'Do I need an account or subscription to use the tools?',
    answer:
      'No. All tools are freely available without registration, sign-up forms, subscription plans, or hidden paywalls. You can open any tool and start processing immediately.',
  },
  {
    question: 'Can I compress a file to an exact target size like 100 KB or 200 KB?',
    answer:
      'Yes. Both the PDF Compressor and Photo Size Compressor allow you to pick standard presets (20KB, 50KB, 100KB, 200KB, 500KB) or type in a custom target byte ceiling. The engine iteratively adjusts stream quality to reach your target. Note that if a file is already heavily compressed, further reduction may be limited by data entropy.',
  },
  {
    question: 'Why does PDF to Word conversion sometimes look different from the original PDF?',
    answer:
      'Standard PDFs store visual glyph coordinates rather than structured paragraphs and tables. Our converter reconstructs the document structure into an editable Word document. For scanned PDFs (which are pictures of text rather than digital text), our OCR scanner must be used to recognize the characters.',
  },
  {
    question: 'How do I resize a photo or signature for official government application portals?',
    answer:
      'Government exam and recruitment portals (such as UPSC, SSC, state PSCs, and passport agencies) require specific pixel or millimeter dimensions (e.g. 3.5×4.5 cm or 200×230 px) along with strict file size limits (20KB to 50KB). The Photo & Signature Resizer allows you to set both dimensions and file weight simultaneously.',
  },
  {
    question: 'What should I do if a file fails to process or an error appears?',
    answer:
      'First, verify that the file is not password-protected (unlock it first or enter the password in the security tool). Second, check that the file is not empty or corrupted. Third, for very large files (over 200 MB), ensure your browser has sufficient available RAM by closing background tabs.',
  },
  {
    question: 'Can I use PottoTools on my smartphone or tablet?',
    answer:
      'Yes. The interface is fully responsive and supports touch interactions across mobile browsers including Safari on iOS and Chrome on Android.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section aria-label="Frequently Asked Questions" className="py-8 sm:py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3.5 py-1 rounded-full border border-blue-200/60 dark:border-blue-900/40">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Helpful Answers</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Common questions about file processing, format compatibility, and troubleshooting on PottoTools.
        </p>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="transition-colors">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              >
                <span>{faq.question}</span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 rotate-180'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-50 dark:border-slate-800/40 pt-4 bg-slate-50/50 dark:bg-slate-950/30">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
