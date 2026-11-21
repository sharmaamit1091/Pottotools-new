import React from 'react';
import { SITE_CONFIG } from '../../config/site';
import { Cookie, Shield, CheckCircle2, Mail, ExternalLink } from 'lucide-react';

export const CookiePolicy: React.FC = () => {
  const supportEmail = SITE_CONFIG.supportEmail || 'sharma.amit1091@gmail.com';

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
          <Cookie className="w-4 h-4" />
          <span>Transparency & Cookie Practices</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cookie Policy
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Last Verified & Updated: {SITE_CONFIG.verifiedDate}
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* Intro */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            1. What Are Cookies?
          </h2>
          <p>
            Cookies are small text files placed on your computer or mobile device when you visit websites. They are widely used to make websites work efficiently, remember your preferences, and provide analytical or advertising information to site operators and third-party partners.
          </p>
          <p>
            In addition to HTTP cookies, modern web applications may utilize browser storage mechanisms like HTML5 LocalStorage to remember interface preferences (such as light or dark display mode) locally on your device.
          </p>
        </section>

        {/* How PottoTools Uses Cookies */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. How PottoTools Uses Cookies and Local Storage
          </h2>
          <p>
            We classify the technologies used on {SITE_CONFIG.name} into the following categories:
          </p>

          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Essential Functional Storage (First-Party LocalStorage)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                We store your chosen theme preference (light or dark mode) and your recently selected tool shortcuts in your browser’s local storage. This data never leaves your device and is not sent to any external server.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Third-Party Advertising Cookies (Google AdSense)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Third-party advertising vendors, including Google, use cookies (such as DoubleClick cookies) to serve advertisements based on your prior visits to our website or other sites on the Internet. Google’s use of advertising cookies enables it and its partners to serve ads to users based on their visits across the web.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cookie className="w-4 h-4 text-indigo-500" />
                <span>Analytics & Performance Metrics (Google Tag Manager)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                We use aggregated, anonymized web metrics to understand which tools are popular and how to optimize user experience. These tools do not record private document contents or personal identity information.
              </p>
            </div>
          </div>
        </section>

        {/* Managing and Opting Out */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. How to Opt Out of Advertising Cookies
          </h2>
          <p>
            You have the right to control and opt out of personalized third-party advertising cookies at any time:
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 pl-2">
            <li>
              <strong>Google Personalized Ads Opt-Out:</strong> Visit{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 font-semibold underline inline-flex items-center gap-1"
              >
                <span>Google Ads Settings</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              to customize your ad preferences.
            </li>
            <li>
              <strong>Digital Advertising Alliance (US):</strong> Visit{' '}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 font-semibold underline inline-flex items-center gap-1"
              >
                <span>www.aboutads.info</span>
                <ExternalLink className="w-3 h-3" />
              </a>{' '}
              to opt out of participating ad networks.
            </li>
            <li>
              <strong>European Interactive Digital Advertising Alliance (EDAA):</strong> Visit{' '}
              <a
                href="https://youronlinechoices.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 font-semibold underline inline-flex items-center gap-1"
              >
                <span>Your Online Choices</span>
                <ExternalLink className="w-3 h-3" />
              </a>.
            </li>
          </ul>
        </section>

        {/* Managing Cookies in Browser */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Managing Cookies in Your Browser Settings
          </h2>
          <p>
            Most modern web browsers allow you to manage, block, or delete cookies through browser settings. For guidance on popular browsers:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pl-2">
            <li><strong>Google Chrome:</strong> Settings &rarr; Privacy and security &rarr; Third-party cookies</li>
            <li><strong>Mozilla Firefox:</strong> Settings &rarr; Privacy &amp; Security &rarr; Enhanced Tracking Protection</li>
            <li><strong>Apple Safari:</strong> Preferences / Settings &rarr; Privacy &rarr; Prevent cross-site tracking</li>
            <li><strong>Microsoft Edge:</strong> Settings &rarr; Cookies and site permissions &rarr; Manage and delete cookies</li>
          </ul>
          <p className="text-xs text-slate-500 pt-1">
            Note: Disabling cookies will NOT impact the functionality of PottoTools' document processing, image resizing, or format conversions. You can still use all tools freely.
          </p>
        </section>

        {/* Contact */}
        <section className="p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            5. Contact Us Regarding Cookies
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            If you have questions about our cookie practices or data transparency, contact us directly at:{' '}
            <a
              href={`mailto:${supportEmail}`}
              className="text-blue-600 dark:text-blue-400 font-mono font-semibold underline"
            >
              {supportEmail}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
};
