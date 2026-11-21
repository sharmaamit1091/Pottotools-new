import createQpdfModule from '@neslinesli93/qpdf-wasm';

export interface PdfEncryptionInfo {
  isEncrypted: boolean;
  requiresUserPassword: boolean;
  encryptionMethod: string;
  pageCount: number | null;
}

export interface ProtectPdfPermissions {
  allowPrinting: 'full' | 'low' | 'none';
  allowCopying: boolean;
  allowModifying: 'all' | 'annotate' | 'form' | 'none';
}

export interface ProtectPdfOptions {
  userPassword: string;
  ownerPassword?: string;
  keyBits?: 128 | 256;
  permissions?: Partial<ProtectPdfPermissions>;
  existingPassword?: string;
}

export interface ProtectPdfResult {
  data: Uint8Array;
  encryptionLabel: string;
  keyBits: 128 | 256;
  hasOpenPassword: boolean;
  hasOwnerRestrictions: boolean;
  verifiedEncrypted: boolean;
}

export interface UnlockPdfResult {
  data: Uint8Array;
  wasEncrypted: boolean;
  removedRestrictionsOnly: boolean;
  pageCount: number | null;
  verifiedUnlocked: boolean;
}

let cachedWasmBinaryPromise: Promise<ArrayBuffer> | null = null;

/**
 * Fetch and cache the QPDF WebAssembly binary once so subsequent operations are instant (~20ms)
 * and 100% client-side in browser memory.
 */
async function loadQpdfWasmBinary(): Promise<ArrayBuffer> {
  if (!cachedWasmBinaryPromise) {
    cachedWasmBinaryPromise = (async () => {
      if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
        const res = await fetch('/qpdf.wasm');
        if (!res.ok) {
          throw new Error(`Failed to load PDF encryption engine (/qpdf.wasm: HTTP ${res.status}).`);
        }
        return await res.arrayBuffer();
      }

      // Node.js fallback for automated verification & tests
      const fs = await import('node:fs');
      const path = await import('node:path');
      const candidates = [
        path.resolve('public/qpdf.wasm'),
        path.resolve('node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        }
      }
      throw new Error('Could not locate qpdf.wasm binary.');
    })();
  }
  return cachedWasmBinaryPromise;
}

interface QpdfRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  outputBytes: Uint8Array | null;
}

/**
 * Execute QPDF inside an isolated Emscripten WebAssembly instance.
 * Each run uses a fresh virtual filesystem so memory is cleanly reclaimed after every operation.
 */
async function runQpdfCommand(
  inputBytes: Uint8Array,
  args: string[],
  expectOutputFile = false
): Promise<QpdfRunResult> {
  const wasmBinary = await loadQpdfWasmBinary();
  const stdoutBytes: number[] = [];
  const stderrBytes: number[] = [];
  const extraErrors: string[] = [];

  const createFn: any =
    typeof createQpdfModule === 'function'
      ? createQpdfModule
      : (createQpdfModule as any)?.default;

  if (typeof createFn !== 'function') {
    throw new Error('QPDF WebAssembly module loader is unavailable.');
  }

  const qpdf: any = await createFn({
    wasmBinary: new Uint8Array(wasmBinary),
    noInitialRun: true,
    preRun: [
      (mod: any) => {
        try {
          mod.FS.init(
            () => null,
            (ch: number | null) => {
              if (ch !== null && ch !== undefined) stdoutBytes.push(ch & 0xff);
            },
            (ch: number | null) => {
              if (ch !== null && ch !== undefined) stderrBytes.push(ch & 0xff);
            }
          );
        } catch {
          // Fallback to print callbacks if FS.init already ran
        }
      },
    ],
    print: (line: string) => {
      for (const b of new TextEncoder().encode(`${line}\n`)) stdoutBytes.push(b);
    },
    printErr: (line: string) => {
      for (const b of new TextEncoder().encode(`${line}\n`)) stderrBytes.push(b);
    },
  });

  qpdf.FS.writeFile('/in.pdf', inputBytes);

  let exitCode = 0;
  try {
    exitCode = qpdf.callMain(args);
  } catch (err: any) {
    if (typeof err?.status === 'number') {
      exitCode = err.status;
    } else if (typeof err?.errno === 'number') {
      exitCode = err.errno;
    } else {
      exitCode = 2;
      if (err?.message) {
        extraErrors.push(String(err.message));
      }
    }
  }

  let outputBytes: Uint8Array | null = null;
  if (expectOutputFile) {
    try {
      const raw: Uint8Array = qpdf.FS.readFile('/out.pdf');
      // Copy out of WASM linear memory heap before GC
      outputBytes = new Uint8Array(raw.slice(0));
    } catch {
      outputBytes = null;
    }
  }

  // Clean up virtual FS files
  try {
    qpdf.FS.unlink('/in.pdf');
  } catch {
    // Ignore cleanup error
  }
  if (expectOutputFile) {
    try {
      qpdf.FS.unlink('/out.pdf');
    } catch {
      // Ignore cleanup error
    }
  }

  const decoder = new TextDecoder('utf-8');
  const stdout = decoder.decode(new Uint8Array(stdoutBytes)).trim();
  const stderr = [decoder.decode(new Uint8Array(stderrBytes)).trim(), ...extraErrors]
    .filter(Boolean)
    .join('\n')
    .trim();

  return {
    exitCode,
    stdout,
    stderr,
    outputBytes,
  };
}

/**
 * Generate a strong random owner password when a user enables permissions restrictions
 * without manually specifying a separate owner password.
 */
function generateRandomOwnerPassword(length = 24): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^*_+=';
  const randomValues = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(randomValues);
  } else {
    for (let i = 0; i < length; i++) {
      randomValues[i] = Math.floor(Math.random() * 256);
    }
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[randomValues[i] % chars.length];
  }
  return out;
}

/**
 * Parse QPDF `--show-encryption` output to determine human-readable cipher name.
 */
function parseEncryptionMethod(stdout: string): string {
  if (/R\s*=\s*6/i.test(stdout) || /256-bit AES/i.test(stdout)) return 'AES-256 (R=6)';
  if (/R\s*=\s*5/i.test(stdout)) return 'AES-256 (R=5)';
  if (/R\s*=\s*4/i.test(stdout) && /AES/i.test(stdout)) return 'AES-128 (R=4)';
  if (/R\s*=\s*4/i.test(stdout)) return '128-bit (R=4)';
  if (/R\s*=\s*3/i.test(stdout)) return 'RC4-128 (R=3)';
  if (/R\s*=\s*2/i.test(stdout)) return 'RC4-40 (R=2)';
  return 'Standard PDF Encryption';
}

/**
 * Inspect whether a PDF is encrypted, whether it requires an open password,
 * and its page count (when readable without a password).
 */
export async function inspectPdfEncryption(
  pdfBuffer: ArrayBuffer | Uint8Array
): Promise<PdfEncryptionInfo> {
  const bytes = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

  // QPDF `--is-encrypted /in.pdf`:
  // - exit 0: PDF is encrypted and opens with empty user password (owner-restricted only)
  // - exit 2 + "invalid password" in stderr: PDF is encrypted and REQUIRES a user open password!
  // - exit 2 + empty/no "invalid password": PDF is NOT encrypted
  const encCheck = await runQpdfCommand(bytes, ['--is-encrypted', '/in.pdf']);
  const errLower = encCheck.stderr.toLowerCase();

  if (encCheck.exitCode !== 0 && errLower.includes('invalid password')) {
    return {
      isEncrypted: true,
      requiresUserPassword: true,
      encryptionMethod: 'AES / Standard Open-Password Encryption',
      pageCount: null,
    };
  }

  if (encCheck.exitCode === 0) {
    // Owner-restricted only (encrypted, opens with empty user password)
    let encryptionMethod = 'Owner-Restricted PDF Encryption';
    const showEnc = await runQpdfCommand(bytes, ['--show-encryption', '/in.pdf']);
    if (showEnc.stdout) {
      encryptionMethod = parseEncryptionMethod(showEnc.stdout);
    }
    const pagesRes = await runQpdfCommand(bytes, ['--show-npages', '/in.pdf']);
    const parsedPages = parseInt(pagesRes.stdout.trim(), 10);
    return {
      isEncrypted: true,
      requiresUserPassword: false,
      encryptionMethod,
      pageCount: Number.isFinite(parsedPages) && parsedPages > 0 ? parsedPages : null,
    };
  }

  // Unencrypted PDF (or non-password error — verify by reading page count)
  const pagesRes = await runQpdfCommand(bytes, ['--show-npages', '/in.pdf']);
  if (pagesRes.exitCode !== 0 && pagesRes.exitCode !== 3 && pagesRes.stderr) {
    throw new Error(pagesRes.stderr);
  }
  const parsedPages = parseInt(pagesRes.stdout.trim(), 10);
  return {
    isEncrypted: false,
    requiresUserPassword: false,
    encryptionMethod: 'None (Unencrypted)',
    pageCount: Number.isFinite(parsedPages) && parsedPages > 0 ? parsedPages : null,
  };
}

/**
 * Protect a PDF with genuine ISO-standard AES-256 (R=6) or AES-128 (R=4) encryption,
 * user open password, owner permissions password, and granular print/copy/edit restrictions.
 */
export async function protectPdfWithPassword(
  pdfBuffer: ArrayBuffer | Uint8Array,
  options: ProtectPdfOptions
): Promise<ProtectPdfResult> {
  const bytes = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);
  const keyBits: 128 | 256 = options.keyBits === 128 ? 128 : 256;

  const userPassword = options.userPassword ?? '';
  const permissions: ProtectPdfPermissions = {
    allowPrinting: options.permissions?.allowPrinting ?? 'full',
    allowCopying: options.permissions?.allowCopying ?? true,
    allowModifying: options.permissions?.allowModifying ?? 'all',
  };

  const hasOwnerRestrictions =
    permissions.allowPrinting !== 'full' ||
    !permissions.allowCopying ||
    permissions.allowModifying !== 'all';

  let ownerPassword = (options.ownerPassword ?? '').trim();

  if (!userPassword && !ownerPassword && !hasOwnerRestrictions) {
    throw new Error('Please enter a password (or enable document restrictions) to protect this PDF.');
  }

  if (userPassword.startsWith('-') || ownerPassword.startsWith('-')) {
    throw new Error(
      'Passwords cannot start with a hyphen (-). Please start your password with a letter, number, or other symbol.'
    );
  }

  // If user didn't supply a separate owner password:
  // - When restrictions are active, generate a distinct strong random owner password so
  //   viewers enforce print/copy/modify restrictions even when opened with the User Password!
  // - When no restrictions are set, use the userPassword as ownerPassword.
  if (!ownerPassword) {
    ownerPassword = hasOwnerRestrictions ? generateRandomOwnerPassword(24) : userPassword;
  }

  const args: string[] = [];

  // If source PDF was already encrypted and user supplied its current password
  if (options.existingPassword) {
    args.push(`--password=${options.existingPassword}`);
  }

  args.push('/in.pdf');
  args.push('--encrypt', userPassword, ownerPassword, String(keyBits));

  // For 128-bit encryption, force modern AES-128 instead of legacy RC4-128
  if (keyBits === 128) {
    args.push('--use-aes=y');
  }

  // Print permissions
  args.push(`--print=${permissions.allowPrinting}`);

  // Extract / copy text & graphics permission
  args.push(`--extract=${permissions.allowCopying ? 'y' : 'n'}`);

  // Modify permissions (QPDF supports all | annotate | form | assembly | none)
  args.push(`--modify=${permissions.allowModifying}`);

  // Terminate --encrypt options cleanly before output filename
  args.push('--', '/out.pdf');

  const res = await runQpdfCommand(bytes, args, true);

  // QPDF exit code 0 = clean success, exit code 3 = success with non-fatal warnings
  const succeeded = (res.exitCode === 0 || res.exitCode === 3) && res.outputBytes && res.outputBytes.byteLength > 0;

  if (!succeeded || !res.outputBytes) {
    const combined = `${res.stderr} ${res.stdout}`.toLowerCase();
    if (combined.includes('invalid password')) {
      throw new Error(
        'The uploaded PDF is already password-protected. Please enter its current password or unlock it first.'
      );
    }
    throw new Error(
      res.stderr || 'Failed to encrypt PDF document. Please verify the file is a valid PDF.'
    );
  }

  // Real cryptographic self-verification: confirm QPDF recognizes the output as genuinely encrypted!
  const verify = await inspectPdfEncryption(res.outputBytes);
  if (!verify.isEncrypted) {
    throw new Error('Encryption verification failed: output PDF was not encrypted.');
  }
  if (userPassword && !verify.requiresUserPassword) {
    throw new Error('Encryption verification failed: open password was not enforced.');
  }

  return {
    data: res.outputBytes,
    encryptionLabel: keyBits === 256 ? 'AES-256 (R=6)' : 'AES-128 (R=4)',
    keyBits,
    hasOpenPassword: userPassword.length > 0,
    hasOwnerRestrictions,
    verifiedEncrypted: verify.isEncrypted,
  };
}

/**
 * Losslessly decrypt a password-protected or owner-restricted PDF using QPDF WebAssembly.
 * Preserves 100% of vector text, fonts, hyperlinks, bookmarks, and layout with zero rasterization.
 */
export async function unlockPdfWithPassword(
  pdfBuffer: ArrayBuffer | Uint8Array,
  password: string = ''
): Promise<UnlockPdfResult> {
  const bytes = pdfBuffer instanceof Uint8Array ? pdfBuffer : new Uint8Array(pdfBuffer);

  // Inspect first so we can provide exact, honest status feedback
  const info = await inspectPdfEncryption(bytes);

  if (info.isEncrypted && info.requiresUserPassword && !password) {
    throw new Error('This PDF requires an open password. Please enter the password to unlock it.');
  }

  const args: string[] = [];
  if (password) {
    args.push(`--password=${password}`);
  }
  args.push('--decrypt', '/in.pdf', '/out.pdf');

  const res = await runQpdfCommand(bytes, args, true);

  // QPDF exit code 0 = clean success, exit code 3 = success with non-fatal warnings
  const succeeded = (res.exitCode === 0 || res.exitCode === 3) && res.outputBytes && res.outputBytes.byteLength > 0;

  if (!succeeded || !res.outputBytes) {
    const combined = `${res.stderr} ${res.stdout}`.toLowerCase();
    if (combined.includes('invalid password') || res.exitCode === 2) {
      throw new Error(
        'Incorrect password. Please double-check capitalization and try again (e.g., for e-Aadhaar use first 4 letters of your name in CAPS + birth year YYYY).'
      );
    }
    throw new Error(
      res.stderr || 'Failed to unlock PDF. Please verify the file is a valid PDF document.'
    );
  }

  // Real cryptographic self-verification: confirm the unlocked output is genuinely unencrypted!
  const verify = await inspectPdfEncryption(res.outputBytes);
  if (verify.isEncrypted) {
    throw new Error('Decryption verification failed: output PDF is still encrypted.');
  }

  return {
    data: res.outputBytes,
    wasEncrypted: info.isEncrypted,
    removedRestrictionsOnly: info.isEncrypted && !info.requiresUserPassword,
    pageCount: verify.pageCount,
    verifiedUnlocked: !verify.isEncrypted,
  };
}
