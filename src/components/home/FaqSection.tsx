import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { TOOLS } from '../../config/toolsRegistry';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'What types of files can I use on PottoTools?',
    answer:
      'You can work with PDFs, photos (JPG, PNG, WebP, BMP), Microsoft Word (.docx), Excel (.xlsx, .csv), PowerPoint (.pptx), and plain text files.',
  },
  {
    question: 'How do I install and use PottoTools offline without internet?',
    answer:
      `Open pottotools.in once while connected to the internet so all ${TOOLS.length} PDF, document, and photo tools are saved on your device. Then click "Install App" (on Chrome/Edge click the install icon in the address bar; on Android tap Chrome menu ⋮ → Install app; on iPhone/iPad tap Safari Share → Add to Home Screen). After that, you can open the app and use it even in Airplane Mode.`,
  },
  {
    question: 'Are my files uploaded to any online server?',
    answer:
      'No. Every tool runs directly inside your own browser on your phone or computer. Your files are never sent to any outside server, so your personal documents stay completely private.',
  },
  {
    question: 'Do I need an account or payment to use the tools?',
    answer:
      'No. Every tool is 100% free with no login, no sign-up, and no hidden fees. Just open any tool and start right away.',
  },
  {
    question: 'Can I shrink a PDF or photo to an exact size like 100 KB or 200 KB?',
    answer:
      'Yes. Both the PDF Compressor and Photo Size Compressor let you pick quick presets (20KB, 50KB, 100KB, 200KB, 500KB) or type your own target size. The tool automatically adjusts the file to fit under your limit while keeping it clear to read.',
  },
  {
    question: 'Why does PDF to Word sometimes look slightly different from the original PDF?',
    answer:
      'PDF files are designed for printing and viewing, while Word files are made for editing. Our converter rebuilds the text and layout so you can edit it easily in Word. If your PDF is a scanned photo of paper, use our OCR tool to turn the scanned words into editable text.',
  },
  {
    question: 'How do I resize a photo or signature for exam and government forms?',
    answer:
      'Exam portals like UPSC, SSC, and bank exams ask for an exact size (such as 3.5×4.5 cm or 200×230 px) AND a small file size (like 20KB to 50KB). Our Exam Photo & Signature Resizer sets both the dimensions and the KB size together in one step.',
  },
  {
    question: 'What should I do if a file does not open or shows an error?',
    answer:
      'First, check if the PDF has a password — if it does, use our Unlock PDF tool first. Second, make sure the file is not damaged or empty. For very large files (over 200 MB), closing extra browser tabs helps your device run faster.',
  },
  {
    question: 'Can I use PottoTools on my phone or tablet?',
    answer:
      'Yes. Every tool works smoothly on Android phones, iPhones, tablets, and computers.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section aria-label="Frequently Asked Questions" className="py-8 sm:py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1A528C] dark:text-[#A3D2FF] bg-[#DDEEFF] dark:bg-[#162742] px-3.5 py-1 rounded-full border border-[#B2D7FB] dark:border-[#243E63]">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Helpful Answers</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#252536] dark:text-[#F2F4FC]">
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-[#777789] dark:text-[#A0A5C0] max-w-xl mx-auto">
          Quick, simple answers to common questions about using PottoTools.
        </p>
      </div>

      <div className="divide-y divide-[#EFEFF6] dark:divide-[#262B45] border border-[#E8E6F2] dark:border-[#2A2F4A] rounded-3xl bg-white dark:bg-[#181B2E] overflow-hidden shadow-[0_8px_24px_-16px_rgba(37,37,54,0.12)]">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} className="transition-colors">
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#252536] dark:text-[#F2F4FC] hover:text-[#5B50E6] dark:hover:text-[#A99EFF] transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen
                      ? 'bg-[#E9E4FF] dark:bg-[#231F44] text-[#4B3A9D] dark:text-[#C5BAFF] rotate-180'
                      : 'bg-[#F5F4FA] dark:bg-[#20243C] text-[#777789] dark:text-[#A0A5C0]'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-[#55556A] dark:text-[#C4C9E0] leading-relaxed border-t border-[#F0EEF8] dark:border-[#262B45] pt-4 bg-[#FAFAFC] dark:bg-[#141727]">
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
