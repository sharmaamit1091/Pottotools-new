import React, { useState } from 'react';
import { SITE_CONFIG } from '../../config/site';
import { Mail, Send, CheckCircle2, Copy, Check, MessageSquare, Sparkles, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { AdSlot } from '../common/AdSlot';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Feedback / Tool Suggestion');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const officialEmail = SITE_CONFIG.supportEmail || 'sharma.amit1091@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(officialEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const buildBody = () =>
    `Name: ${name.trim() || 'User'}\nEmail: ${email.trim() || 'Not provided'}\n\nMessage:\n${message.trim() || 'Hello, I have an inquiry regarding PottoTools.'}`;

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(officialEmail)}&su=${encodeURIComponent(`[PottoTools] ${subject}`)}&body=${encodeURIComponent(buildBody())}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenOutlook = () => {
    const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(officialEmail)}&subject=${encodeURIComponent(`[PottoTools] ${subject}`)}&body=${encodeURIComponent(buildBody())}`;
    window.open(outlookUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDirectEmail = () => {
    const mailtoUrl = `mailto:${officialEmail}?subject=${encodeURIComponent(
      `[PottoTools] ${subject}`
    )}&body=${encodeURIComponent(buildBody())}`;
    window.location.href = mailtoUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(officialEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          _subject: `[PottoTools Contact] ${subject} - from ${name.trim()}`,
          message: message.trim(),
          _replyto: email.trim(),
          _template: 'table',
          _captcha: 'false',
        }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Server returned an error. Please try direct email.');
      }
    } catch (err: unknown) {
      console.error('Contact form submission error:', err);
      setStatus('error');
      setErrorMessage(
        'Could not deliver message via web form. Please click the button below to send it directly via your email client.'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>We're Here to Help</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Contact PottoTools
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Have questions, suggestions, or bug reports? Reach out directly to the PottoTools team.
        </p>
      </div>

      {/* Primary Contact Card: Direct Email */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4" />
              Official Support Inbox
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-slate-900 dark:text-white select-all">
              {officialEmail}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct inbox for bug reports, tool requests, government exam presets, and partnerships.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
            {/* Open in Gmail Web - 100% reliable for desktop users */}
            <button
              type="button"
              onClick={handleOpenGmail}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              title="Open Gmail in your browser"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Gmail (Web)</span>
            </button>

            {/* Open in Outlook / Hotmail Web */}
            <button
              type="button"
              onClick={handleOpenOutlook}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-medium text-xs transition-all cursor-pointer"
              title="Open Outlook.com in your browser"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
              <span>Outlook Web</span>
            </button>

            {/* Default Mail App (mailto:) */}
            <a
              href={`mailto:${officialEmail}?subject=PottoTools%20Inquiry`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-xs transition-all cursor-pointer"
              title="Open default computer email client (Apple Mail, Windows Mail, Outlook desktop)"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Mail App</span>
            </a>

            {/* Copy Email Button */}
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-xs transition-all cursor-pointer"
              title="Copy email to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* In-Content AdSlot */}
      <AdSlot placement="content-inline" format="horizontal" minHeight={90} />

      {/* Message Form or Confirmation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Send a Message Directly
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Your message will be sent straight to <strong className="text-slate-700 dark:text-slate-300">{officialEmail}</strong>.
        </p>

        {status === 'error' && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                {errorMessage}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenGmail}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send via Gmail</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenOutlook}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send via Outlook</span>
                </button>
                <button
                  type="button"
                  onClick={handleDirectEmail}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Mail App</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {status !== 'success' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Sharma"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Your Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Inquiry Topic
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900 dark:text-white"
              >
                <option value="Feedback / Tool Suggestion">Feedback / Tool Suggestion</option>
                <option value="Bug Report / Tool Issue">Bug Report / Tool Issue</option>
                <option value="Government Exam Preset Request">Government Exam Preset Request</option>
                <option value="Advertising / Business Inquiry">Advertising / Business Inquiry</option>
                <option value="General Question">General Question</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Message
              </label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your suggestion, the document tool you'd like to see added, or the issue you encountered..."
                className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 leading-relaxed text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending to {officialEmail}...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Message</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleOpenGmail}
                className="py-3 px-4 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer"
                title="Send using Gmail Web directly"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Send via Gmail</span>
              </button>

              <button
                type="button"
                onClick={handleOpenOutlook}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Send using Outlook Web directly"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Outlook Web</span>
              </button>

              <button
                type="button"
                onClick={handleDirectEmail}
                className="py-3 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Open computer's default mail application"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Mail App</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Message Sent Successfully!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your inquiry regarding "{subject}" has been delivered to{' '}
              <strong className="text-slate-700 dark:text-slate-300 font-mono">{officialEmail}</strong>.
              We review every submission and will get back to you if a response is needed.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setStatus('idle');
                  setMessage('');
                }}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
              <button
                type="button"
                onClick={handleOpenGmail}
                className="py-2.5 px-5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-xs font-semibold rounded-lg text-blue-600 dark:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Gmail</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
