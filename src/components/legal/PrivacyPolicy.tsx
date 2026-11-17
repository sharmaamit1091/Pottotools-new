import React from 'react';
import { SITE_CONFIG } from '../../config/site';
import { ShieldCheck, CheckCircle2, Mail } from 'lucide-react';
import { AdSlot } from '../common/AdSlot';

export const PrivacyPolicy: React.FC = () => {
  const supportEmail = SITE_CONFIG.supportEmail || 'sharma.amit1091@gmail.com';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Zero-Log Document Privacy Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Last Updated & Verified: {SITE_CONFIG.verifiedDate}
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. Core Architectural Principle: 100% Client-Side Processing
          </h2>
          <p>
            At <strong>{SITE_CONFIG.name}</strong>, user privacy is not an afterthought; it is the foundational architectural pillar of our software. Unlike conventional document processing websites that require users to upload confidential contracts, tax documents, medical forms, or identity papers to remote cloud servers, <strong>{SITE_CONFIG.name} performs document tasks directly inside your web browser</strong>.
          </p>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-xs text-emerald-900 dark:text-emerald-200">
            <div className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zero Document Uploads Guaranteed</span>
            </div>
            <p>
              When you select a PDF, image, spreadsheet, or Word file in our upload zone, the file data is loaded strictly into your device's local memory (RAM) via JavaScript Web APIs. No document bytes are transmitted across the internet to our servers.
            </p>
          </div>
        </section>

        {/* In-Content AdSlot */}
        <div className="py-2">
          <AdSlot placement="content-inline" format="horizontal" minHeight={90} />
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. What Data We Collect
          </h2>
          <p>
            We adhere strictly to data minimization principles:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <li><strong>Document Contents:</strong> We NEVER collect, transmit, inspect, store, or log the contents of your documents or images.</li>
            <li><strong>Personal Identity:</strong> We do not require account registration, usernames, passwords, phone numbers, or credit card numbers.</li>
            <li><strong>Local Settings:</strong> User preferences (such as dark mode toggle and recently accessed tool shortcuts) are stored strictly on your device using HTML5 LocalStorage and are never sent to external analytics.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Google AdSense, Advertising &amp; Third-Party Cookies Policy
          </h2>
          <p>
            {SITE_CONFIG.name} partners with third-party advertising networks, including <strong>Google AdSense</strong>, to serve non-intrusive advertisements when you visit our website. To maintain compliance with Google Publisher Policies, please review the following required advertising disclosures:
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 pl-2">
            <li>
              <strong>Google Advertising Cookies:</strong> Third-party vendors, including Google, use cookies (such as the DoubleClick cookie) to serve ads based on a user's prior visits to {SITE_CONFIG.name} or other websites across the Internet.
            </li>
            <li>
              <strong>Personalized Advertising:</strong> Google's use of advertising cookies enables it and its partners to serve ads to your users based on their visit to your sites and/or other sites on the Internet.
            </li>
            <li>
              <strong>Opt-Out of Personalized Ads:</strong> Users may opt out of personalized advertising at any time by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold underline">Google Ads Settings</a>.
            </li>
            <li>
              <strong>Third-Party Vendor Opt-Out:</strong> Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold underline">www.aboutads.info</a> or <a href="https://youradchoices.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold underline">YourAdChoices</a>.
            </li>
          </ul>
          <p className="text-xs text-slate-500 pt-1">
            Disabling advertising cookies will not affect your ability to use any of PottoTools' client-side document processing, conversion, or compression utilities. All local file operations remain 100% accessible.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Optical Character Recognition (OCR) Assets
          </h2>
          <p>
            When utilizing our in-browser OCR tools (powered by Tesseract.js), language traineddata models (such as English or Hindi) are downloaded from open-source content delivery networks directly to your browser's Cache Storage. Once cached, OCR operations run completely offline on your CPU.
          </p>
        </section>

        <section className="p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            5. Contact Information
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            If you have questions regarding this Privacy Policy or our client-side architecture, contact us directly at:{' '}
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
