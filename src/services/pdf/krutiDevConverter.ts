/**
 * Bidirectional Kruti Dev 010 / DevLys 010 <-> Unicode Devanagari (Hindi) converter.
 * Runs 100% locally in the browser with zero external dependencies.
 *
 * Supports:
 * - Full Kruti Dev 010 consonants, vowels, matras, half-letters, and conjuncts
 * - Chhoti 'i' (f <-> ि) prefix/suffix visual reordering across conjunct clusters
 * - Reph (Z <-> र्) visual reordering across syllables and vowel signs
 * - Nukta characters, numbers, and common Devanagari punctuation
 * - Auto-detection of Kruti Dev / DevLys PDF fonts and raw Kruti Dev ASCII text
 */

const KRUTI_TO_UNICODE_MAP: Array<[string, string]> = [
  // Quotes and smart punctuation normalization first
  ['‘', '"'],
  ['’', '"'],
  ['“', "'"],
  ['”', "'"],

  // Special multi-character vowel / ligature sequences (longest matches first)
  ['vks', 'ओ'],
  ['vkS', 'औ'],
  ['vk¡', 'आँ'],
  ['vkW', 'ऑ'],
  ['v¡', 'अँ'],
  ['vk', 'आ'],
  ['v', 'अ'],
  ['bZ', 'ई'],
  ['b', 'इ'],
  ['m', 'उ'],
  ['Å', 'ऊ'],
  ['_', 'ऋ'],
  ['Ã', 'ऋ'],
  ['s', 'े'],
  ['S', 'ै'],
  ['ks', 'ो'],
  ['kS', 'ौ'],
  ['k¡', 'ाँ'],
  ['kW', 'ॉ'],
  ['W', 'ॅ'],
  ['¡', 'ँ'],
  ['a', 'ं'],
  ['%', 'ः'],
  ['~', '्'],
  ['`', '़'],
  ['A', '।'],

  // Specific compound conjuncts and full forms
  ['{k', 'क्ष'],
  ['{', 'क्ष्'],
  ['=', 'त्र'],
  ['«', 'त्र्'],
  ['K', 'ज्ञ'],
  ['J', 'श्र'],
  ['J~', 'श्र्'],
  ['Ø', 'क्र'],
  ['ø', 'क्र'],
  ['Ùk', 'त्त'],
  ['Ù', 'त्त्'],
  ['ä', 'क्त'],
  ['Ä', 'क्त'],
  ['æ', 'द्र'],
  ['nz', 'द्र'],
  ['nz~', 'द्र्'],
  ['}k', 'द्व'],
  ['}', 'द्व'],
  ['|', 'द्य'],
  ['|k', 'द्या'],
  ['´', 'झ'],
  ['÷', 'ह्न'],
  ['º', 'ह्ल'],
  ['»', 'ह्व'],
  ['ã', 'ह्म'],
  ['á', 'ह्य'],
  ['â', 'हृ'],
  ['˜', 'हृ'],
  ['Ük', 'श्व'],
  ['Ü', 'श्व्'],
  ['Í', 'ट्ट'],
  ['Î', 'ठ्ठ'],
  ['Ï', 'ड्ड'],
  ['Ð', 'ढ्ढ'],
  ['Ñ', 'कृ'],
  ['Ò', 'भ'],
  ['Ó', 'भ्'],
  ['Ô', 'ठ'],
  ['Õ', 'ड्ड'],
  ['Ö', 'ढ'],
  ['×', '×'],
  ['Øk', 'क्रा'],
  ['Ùk', 'त्त'],
  ['Ú', 'फ'],
  ['Û', 'ई'],
  ['Ý', 'फ्र'],
  ['Þ', 'प्र'],
  ['ß', 'स्र'],
  ['à', 'ह्न'],
  ['å', 'द्ग'],
  ['æ', 'द्र'],
  ['ç', 'प्र'],
  ['èk', 'ध'],
  ['è', 'ध्'],
  ['é', 'न'],
  ['ê', 'ट्ट'],
  ['ë', 'ट्ठ'],
  ['ì', 'ड्ड'],
  ['í', 'द्द'],
  ['î', 'द्य'],
  ['ï', 'द्व'],
  ['ð', 'द्ध'],
  ['ñ', 'न्न्'],
  ['ò', 'द्म'],
  ['ó', 'द्य'],
  ['ô', 'क्त'],
  ['õ', 'ङ्क'],
  ['ö', 'ङ्ख'],
  ['ø', 'क्र'],
  ['ù', 'ह्'],
  ['ú', 'ङ्घ'],
  ['û', 'ङ्ग'],
  ['ü', 'श्च'],
  ['ý', '्र'],
  ['þ', 'द्ब'],
  ['ÿ', 'द्भ'],

  // Rakars / special forms
  ['iz', 'प्र'],
  ['iz~', 'प्र्'],
  ['Qz', 'फ्र'],
  ['dz', 'क्र'],
  ['cz', 'ब्र'],
  ['xz', 'ग्र'],
  ['oz', 'व्र'],
  ['ez', 'म्र'],
  ['tz', 'ज्र'],
  ['nz', 'द्र'],
  ['kz', '्र'],
  ['z', '्र'],
  ['ª', '्र'],
  ['«', 'त्र्'],
  ['¬', 'र्'],
  ['®', 'त्र'],
  ['¯', 'र्ि'],
  ['°', '्र'],
  ['±', '्र'],
  ['²', '्र'],
  ['³', 'ङ'],
  ['´', 'झ'],
  ['µ', 'झ्'],
  ['¶', 'फ'],
  ['·', 'फ्'],
  ['¸', 'य'],
  ['¹', 'य्'],
  ['º', 'ह्ल'],
  ['»', 'ह्व'],
  ['¼', '('],
  ['½', ')'],
  ['¾', '='],
  ['¿', '{'],
  ['À', '}'],
  ['Á', 'प्र'],
  ['Â', 'र्'],
  ['Ä', 'क्त'],
  ['Å', 'ऊ'],
  ['Æ', 'र्ि'],
  ['Ç', 'र्ि'],
  ['È', 'र्ी'],
  ['É', 'र्ी'],
  ['Ê', 'ीं'],
  ['Ë', 'ीं'],
  ['Ì', 'ड्ड'],

  // Consonants with 'k' (vertical bar completing half-consonants in Kruti Dev)
  ['[k', 'ख'],
  ['[', 'ख्'],
  ['Xk', 'ग'],
  ['X', 'ग्'],
  ['?k', 'घ'],
  ['?', 'घ्'],
  ['Pk', 'च'],
  ['P', 'च्'],
  ['Tk', 'ज'],
  ['T', 'ज्'],
  ['>k', 'झ'],
  ['>', 'झ'],
  ['¥', 'ञ'],
  ['.k', 'ण'],
  ['.', 'ण्'],
  ['Rk', 'त'],
  ['R', 'त्'],
  ['Fk', 'थ'],
  ['F', 'थ्'],
  ['Hk', 'भ'],
  ['H', 'भ्'],
  ['Ek', 'म'],
  ['E', 'म्'],
  ['Yk', 'ल'],
  ['Y', 'ल्'],
  ['Ok', 'व'],
  ['O', 'व्'],
  ["'k", 'श'],
  ["'", 'श्'],
  ['"k', 'ष'],
  ['"', 'ष्'],
  ['Lk', 'स'],
  ['L', 'स्'],
  ['Kk', 'ज्ञा'],
  ['{k', 'क्ष'],
  ['=k', 'त्रा'],
  ['|k', 'द्या'],
  ['èk', 'ध'],
  ['è', 'ध्'],
  ['/k', 'ध'],
  ['/', 'ध्'],
  ['Ik', 'प'],
  ['I', 'प्'],
  ['Ck', 'ब'],
  ['C', 'ब्'],
  ['Uk', 'न'],
  ['U', 'न्'],
  ['Dk', 'क'],
  ['D', 'क्'],
  ['Qk', 'फ'],
  ['Q', 'फ्'],

  // Standalone full consonants & vowels
  ['d', 'क'],
  ['x', 'ग'],
  ['p', 'च'],
  ['N', 'छ'],
  ['t', 'ज'],
  ['V', 'ट'],
  ['B', 'ठ'],
  ['M', 'ड'],
  ['<', 'ढ'],
  ['r', 'त'],
  ['n', 'द'],
  ['u', 'न'],
  ['i', 'प'],
  ['Q', 'फ'],
  ['c', 'ब'],
  ['e', 'म'],
  [';', 'य'],
  ['j', 'र'],
  ['y', 'ल'],
  ['o', 'व'],
  ['l', 'स'],
  ['g', 'ह'],
  ['M+', 'ड़'],
  ['<+', 'ढ़'],
  ['d+', 'क़'],
  ['[k+', 'ख़'],
  ['x+', 'ग़'],
  ['t+', 'ज़'],
  ['Q+', 'फ़'],

  // Vowel signs & independent vowels
  [',s', 'ऐ'],
  [',', 'ए'],
  ['k', 'ा'],
  ['h', 'ी'],
  ['q', 'ु'],
  ['w', 'ू'],
  ['`', 'ृ'],
  ['W', 'ॅ'],
  ['s', 'े'],
  ['S', 'ै'],
  ['a', 'ं'],
  ['¡', 'ँ'],
  ['%', 'ः'],

  // Digits & punctuation used in Kruti Dev 010
  ['\\', '?'],
  ['-', ';'],
  ['&', '-'],
  ['^', '‘'],
  ['*', '’'],
  ['Þ', '"'],
  ['ß', '"'],
  ['$', '+'],
  ['@', '/'],
  ['!', '!'],
  ['#', 'रु'],
  [':', 'रू'],
  [']', ','],
];

// Build an ordered list where longer Kruti Dev tokens always match before shorter substrings.
// NOTE: We keep explicit key ordering carefully so multi-char combinations like '[k', 'vkS', 'bZ', 'M+' win first.
const KRUTI_EXACT_REPLACEMENTS: Array<[string, string]> = [
  // 1. Multi-char vowels & specials
  ['vkS', 'औ'],
  ['vks', 'ओ'],
  ['vk¡', 'आँ'],
  ['vkW', 'ऑ'],
  ['v¡', 'अँ'],
  ['vk', 'आ'],
  ['bZ', 'ई'],
  [',s', 'ऐ'],
  ['kS', 'ौ'],
  ['ks', 'ो'],
  ['k¡', 'ाँ'],
  ['kW', 'ॉ'],

  // 2. Nukta combinations
  ['[k+', 'ख़'],
  ['M+', 'ड़'],
  ['<+', 'ढ़'],
  ['d+', 'क़'],
  ['x+', 'ग़'],
  ['t+', 'ज़'],
  ['Q+', 'फ़'],

  // 3. Common 2-char full consonants (half + k) & conjuncts
  ['{k', 'क्ष'],
  ['Ùk', 'त्त'],
  ['Ük', 'श्व'],
  ['èk', 'ध'],
  ['/k', 'ध'],
  ['[k', 'ख'],
  ['Xk', 'ग'],
  ['?k', 'घ'],
  ['Pk', 'च'],
  ['Tk', 'ज'],
  ['.k', 'ण'],
  ['Rk', 'त'],
  ['Fk', 'थ'],
  ['Hk', 'भ'],
  ['Ek', 'म'],
  ['Yk', 'ल'],
  ['Ok', 'व'],
  ["'k", 'श'],
  ['"k', 'ष'],
  ['Lk', 'स'],
  ['Ik', 'प'],
  ['Ck', 'ब'],
  ['Uk', 'न'],
  ['Dk', 'क'],
  ['Qk', 'फ'],
  ['iz', 'प्र'],
  ['dz', 'क्र'],
  ['cz', 'ब्र'],
  ['xz', 'ग्र'],
  ['oz', 'व्र'],
  ['ez', 'म्र'],
  ['tz', 'ज्र'],
  ['nz', 'द्र'],
  ['Qz', 'फ्र'],
  ['}k', 'द्व'],
  ['|k', 'द्या'],

  // 4. Special Kruti Dev extended characters (Latin-1 / CP1252 glyphs)
  ['Ø', 'क्र'],
  ['ø', 'क्र'],
  ['ä', 'क्त'],
  ['Ä', 'क्त'],
  ['æ', 'द्र'],
  ['ç', 'प्र'],
  ['Á', 'प्र'],
  ['Ý', 'फ्र'],
  ['ß', 'स्र'],
  ['Ñ', 'कृ'],
  ['Ò', 'भ'],
  ['Ó', 'भ्'],
  ['Ô', 'ठ'],
  ['Ö', 'ढ'],
  ['Ú', 'फ'],
  ['Å', 'ऊ'],
  ['Ã', 'ऋ'],
  ['_', 'ऋ'],
  ['«', 'त्र्'],
  ['®', 'त्र'],
  ['³', 'ङ'],
  ['´', 'झ'],
  ['µ', 'झ्'],
  ['¥', 'ञ'],
  ['Í', 'ट्ट'],
  ['Î', 'ठ्ठ'],
  ['Ï', 'ड्ड'],
  ['Ð', 'ढ्ढ'],
  ['ê', 'ट्ट'],
  ['ë', 'ट्ठ'],
  ['ì', 'ड्ड'],
  ['í', 'द्द'],
  ['î', 'द्य'],
  ['ï', 'द्व'],
  ['ð', 'द्ध'],
  ['ò', 'द्म'],
  ['ó', 'द्य'],
  ['ô', 'क्त'],
  ['õ', 'ङ्क'],
  ['ö', 'ङ्ख'],
  ['ù', 'ह्'],
  ['ú', 'ङ्घ'],
  ['û', 'ङ्ग'],
  ['ü', 'श्च'],
  ['þ', 'द्ब'],
  ['ÿ', 'द्भ'],
  ['ã', 'ह्म'],
  ['á', 'ह्य'],
  ['â', 'हृ'],
  ['˜', 'हृ'],
  ['÷', 'ह्न'],
  ['à', 'ह्न'],
  ['º', 'ह्ल'],
  ['»', 'ह्व'],
  ['¼', '('],
  ['½', ')'],
  ['¾', '='],
  ['Ü', 'श्व्'],
  ['Ù', 'त्त्'],
  ['è', 'ध्'],
  ['ý', '्र'],
  ['ª', '्र'],
  ['z', '्र'],

  // 5. Single ASCII half-consonants
  ['{', 'क्ष्'],
  ['[', 'ख्'],
  ['X', 'ग्'],
  ['?', 'घ्'],
  ['P', 'च्'],
  ['T', 'ज्'],
  ['.', 'ण्'],
  ['R', 'त्'],
  ['F', 'थ्'],
  ['/', 'ध्'],
  ['H', 'भ्'],
  ['E', 'म्'],
  ['Y', 'ल्'],
  ['O', 'व्'],
  ["'", 'श्'],
  ['"', 'ष्'],
  ['L', 'स्'],
  ['I', 'प्'],
  ['C', 'ब्'],
  ['U', 'न्'],
  ['D', 'क्'],

  // 6. Single ASCII full consonants, vowels & matras
  ['=', 'त्र'],
  ['K', 'ज्ञ'],
  ['J', 'श्र'],
  ['}', 'द्व'],
  ['|', 'द्य'],
  ['>', 'झ'],
  ['v', 'अ'],
  ['b', 'इ'],
  ['m', 'उ'],
  [',', 'ए'],
  ['d', 'क'],
  ['x', 'ग'],
  ['p', 'च'],
  ['N', 'छ'],
  ['t', 'ज'],
  ['V', 'ट'],
  ['B', 'ठ'],
  ['M', 'ड'],
  ['<', 'ढ'],
  ['r', 'त'],
  ['n', 'द'],
  ['u', 'न'],
  ['i', 'प'],
  ['Q', 'फ'],
  ['c', 'ब'],
  ['e', 'म'],
  [';', 'य'],
  ['j', 'र'],
  ['y', 'ल'],
  ['o', 'व'],
  ['l', 'स'],
  ['g', 'ह'],
  ['k', 'ा'],
  ['h', 'ी'],
  ['q', 'ु'],
  ['w', 'ू'],
  ['`', 'ृ'],
  ['W', 'ॅ'],
  ['s', 'े'],
  ['S', 'ै'],
  ['a', 'ं'],
  ['¡', 'ँ'],
  ['%', 'ः'],
  ['~', '्'],
  ['A', '।'],
  ['#', 'रु'],
  [':', 'रू'],
  [']', ','],
  ['&', '-'],
  ['\\', '?'],
];

// Keep TS happy about unused table if kept for reference
void KRUTI_TO_UNICODE_MAP;

const DEVANAGARI_CONSONANT_RE = /[\u0915-\u0939\u0958-\u095F]/;
const DEVANAGARI_MATRA_OR_MOD_RE = /[\u093E-\u094D\u0901-\u0903\u093C\u0951-\u0954]/;

/**
 * Reorder Chhoti 'i' ('f' placeholder '\uE101') from BEFORE a consonant/conjunct cluster
 * to AFTER the consonant cluster in Unicode Devanagari (ि = U+093F).
 */
function reorderChhotiI(text: string): string {
  const chars = Array.from(text);
  const out: string[] = [];
  let i = 0;

  while (i < chars.length) {
    if (chars[i] === '\uE101') {
      // Collect consonant cluster immediately following the placeholder:
      // C (् C)* optionally with nukta ़
      let j = i + 1;
      if (j < chars.length && DEVANAGARI_CONSONANT_RE.test(chars[j])) {
        j++;
        if (j < chars.length && chars[j] === '\u093C') j++; // nukta
        // Follow halant-joined conjuncts (e.g. स्थित, प्रिया, क्रिया, क्षि)
        while (
          j + 1 < chars.length &&
          chars[j] === '\u094D' &&
          DEVANAGARI_CONSONANT_RE.test(chars[j + 1])
        ) {
          j += 2;
          if (j < chars.length && chars[j] === '\u093C') j++;
        }
        for (let k = i + 1; k < j; k++) {
          out.push(chars[k]);
        }
        out.push('\u093F'); // ि
        i = j;
        continue;
      } else {
        out.push('\u093F');
        i++;
        continue;
      }
    }
    out.push(chars[i]);
    i++;
  }

  return out.join('');
}

/**
 * Reorder Reph ('Z' placeholder '\uE102') from AFTER a syllable + vowel signs
 * to BEFORE the base consonant cluster in Unicode Devanagari (र् = \u0930\u094D).
 */
function reorderReph(text: string): string {
  const chars = Array.from(text);
  const out: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '\uE102') {
      // Walk backward in `out` past vowel matras/anusvara/chandrabindu, then base consonant + any halant-preceded half consonants
      let pos = out.length - 1;
      while (pos >= 0 && DEVANAGARI_MATRA_OR_MOD_RE.test(out[pos]) && out[pos] !== '\u094D') {
        pos--;
      }
      if (pos >= 0 && DEVANAGARI_CONSONANT_RE.test(out[pos])) {
        // Also walk past preceding conjunct half-consonants (C + ्)
        while (
          pos >= 2 &&
          out[pos - 1] === '\u094D' &&
          DEVANAGARI_CONSONANT_RE.test(out[pos - 2])
        ) {
          pos -= 2;
        }
        out.splice(pos, 0, '\u0930', '\u094D'); // र्
      } else {
        out.push('\u0930', '\u094D');
      }
    } else {
      out.push(chars[i]);
    }
  }

  return out.join('');
}

/**
 * Convert Kruti Dev 010 / DevLys 010 encoded text into clean Unicode Devanagari Hindi.
 * Preserves whitespace, line breaks, and numeric dates (like 18.11.2025) safely.
 */
export function krutiDevToUnicode(input: string): string {
  if (!input) return '';

  // Normalize curly quotes used by some Kruti Dev PDFs before tokenizing
  let str = input
    .replace(/\r\n/g, '\n')
    .replace(/‘/g, "'")
    .replace(/’/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"');

  // Protect pure numeric tokens (dates like 18.11.2025, page/serial numbers) so '.' inside dates isn't turned into 'ण्'
  const protectedTokens: string[] = [];
  str = str.replace(/\b\d+(?:[.,:/-]\d+)+\b/g, (m) => {
    const idx = protectedTokens.push(m) - 1;
    return `\uE200${idx}\uE201`;
  });

  // Replace Kruti Dev visual 'f' (chhoti i) and 'Z' (reph) with temporary placeholders
  // Note: handle combined 'bZ' -> ई and '¯'/'Æ'/'Ç' (र्ि) and 'È'/'É' (र्ी) BEFORE single 'Z'
  str = str
    .replace(/bZ/g, 'ई')
    .replace(/[¯ÆÇ]/g, '\uE101\uE102')
    .replace(/[ÈÉ]/g, 'ी\uE102')
    .replace(/f/g, '\uE101')
    .replace(/Z/g, '\uE102');

  // Single-pass greedy longest-match scan over KRUTI_EXACT_REPLACEMENTS
  const maxKeyLen = 3;
  const table = new Map<string, string>(KRUTI_EXACT_REPLACEMENTS);
  let converted = '';
  let idx = 0;

  while (idx < str.length) {
    // Pass through protected numeric tokens unchanged
    if (str[idx] === '\uE200') {
      const endMarker = str.indexOf('\uE201', idx + 1);
      if (endMarker !== -1) {
        const tokenIdx = Number(str.slice(idx + 1, endMarker));
        converted += protectedTokens[tokenIdx] ?? '';
        idx = endMarker + 1;
        continue;
      }
    }

    // Pass through placeholders, whitespace, digits, and already-Unicode Devanagari untouched
    const ch = str[idx];
    const code = ch.charCodeAt(0);
    if (
      ch === '\uE101' ||
      ch === '\uE102' ||
      /\s/.test(ch) ||
      (code >= 0x30 && code <= 0x39) ||
      (code >= 0x0900 && code <= 0x097f)
    ) {
      converted += ch;
      idx++;
      continue;
    }

    let matched = false;
    for (let len = Math.min(maxKeyLen, str.length - idx); len >= 1; len--) {
      const slice = str.slice(idx, idx + len);
      const rep = table.get(slice);
      if (rep !== undefined) {
        converted += rep;
        idx += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      converted += ch;
      idx++;
    }
  }

  // Reorder visual chhoti 'i' (ि) and reph (र्) to proper Unicode logical order
  converted = reorderChhotiI(converted);
  converted = reorderReph(converted);

  // Clean up duplicate vowel/matra edge cases from Kruti Dev combinations
  converted = converted
    .replace(/अा/g, 'आ')
    .replace(/आे/g, 'ओ')
    .replace(/आै/g, 'औ')
    .replace(/ाे/g, 'ो')
    .replace(/ाै/g, 'ौ')
    .replace(/अो/g, 'ओ')
    .replace(/अौ/g, 'औ')
    .replace(/एे/g, 'ऐ')
    .replace(/इर्/g, 'ई')
    .replace(/्ा/g, '') // half-consonant + aa-kar resolves to full consonant
    .replace(/र्ि/g, 'िर्'); // keep standard matra+reph order clean if adjacent

  try {
    return converted.normalize('NFC');
  } catch {
    return converted;
  }
}

/**
 * Reverse table: Unicode Devanagari -> Kruti Dev 010
 */
const UNICODE_TO_KRUTI_PAIRS: Array<[string, string]> = [
  // Multi-codepoint conjuncts & nukta letters first
  ['क्ष्', '{'],
  ['क्ष', '{k'],
  ['त्र्', '«'],
  ['त्र', '='],
  ['ज्ञ', 'K'],
  ['श्र', 'J'],
  ['द्य', '|'],
  ['द्व', '}'],
  ['त्त', 'Ùk'],
  ['क्त', 'ä'],
  ['क्र', 'Ø'],
  ['प्र', 'iz'],
  ['द्र', 'æ'],
  ['फ्र', 'Qz'],
  ['ग्र', 'xz'],
  ['ब्र', 'cz'],
  ['व्र', 'oz'],
  ['म्र', 'ez'],
  ['ज्र', 'tz'],
  ['श्व', 'Ük'],
  ['ट्ट', 'Í'],
  ['ठ्ठ', 'Î'],
  ['ड्ड', 'Ï'],
  ['ढ्ढ', 'Ð'],
  ['द्द', 'í'],
  ['द्ध', 'ð'],
  ['द्म', 'ò'],
  ['द्भ', 'ÿ'],
  ['द्ब', 'þ'],
  ['ह्म', 'ã'],
  ['ह्य', 'á'],
  ['हृ', 'â'],
  ['ह्न', '÷'],
  ['ह्ल', 'º'],
  ['ह्व', '»'],
  ['कृ', 'Ñ'],
  ['रु', '#'],
  ['रू', ':'],

  // Nukta consonants
  ['क़', 'd+'],
  ['ख़', '[k+'],
  ['ग़', 'x+'],
  ['ज़', 't+'],
  ['ड़', 'M+'],
  ['ढ़', '<+'],
  ['फ़', 'Q+'],

  // Half consonants (Consonant + Halant)
  ['क्', 'D'],
  ['ख्', '['],
  ['ग्', 'X'],
  ['घ्', '?'],
  ['च्', 'P'],
  ['ज्', 'T'],
  ['झ्', 'µ'],
  ['ण्', '.'],
  ['त्', 'R'],
  ['थ्', 'F'],
  ['ध्', '/'],
  ['न्', 'U'],
  ['प्', 'I'],
  ['फ्', 'Q'],
  ['ब्', 'C'],
  ['भ्', 'H'],
  ['म्', 'E'],
  ['ल्', 'Y'],
  ['व्', 'O'],
  ['श्', "'"],
  ['ष्', '"'],
  ['स्', 'L'],
  ['ह्', 'ù'],

  // Rakar (Halant + Ra)
  ['्र', 'z'],

  // Independent vowels
  ['आँ', 'vk¡'],
  ['ऑ', 'vkW'],
  ['औ', 'vkS'],
  ['ओ', 'vks'],
  ['आ', 'vk'],
  ['अँ', 'v¡'],
  ['अ', 'v'],
  ['ई', 'bZ'],
  ['इ', 'b'],
  ['ऊ', 'Å'],
  ['उ', 'm'],
  ['ऋ', '_'],
  ['ऐ', ',s'],
  ['ए', ','],

  // Full consonants
  ['क', 'd'],
  ['ख', '[k'],
  ['ग', 'x'],
  ['घ', '?k'],
  ['ङ', '³'],
  ['च', 'p'],
  ['छ', 'N'],
  ['ज', 't'],
  ['झ', '>'],
  ['ञ', '¥'],
  ['ट', 'V'],
  ['ठ', 'B'],
  ['ड', 'M'],
  ['ढ', '<'],
  ['ण', '.k'],
  ['त', 'r'],
  ['थ', 'Fk'],
  ['द', 'n'],
  ['ध', '/k'],
  ['न', 'u'],
  ['प', 'i'],
  ['फ', 'Q'],
  ['ब', 'c'],
  ['भ', 'Hk'],
  ['म', 'e'],
  ['य', ';'],
  ['र', 'j'],
  ['ल', 'y'],
  ['व', 'o'],
  ['श', "'k"],
  ['ष', '"k'],
  ['स', 'l'],
  ['ह', 'g'],

  // Vowel matras & modifiers
  ['ाँ', 'k¡'],
  ['ॉ', 'kW'],
  ['ौ', 'kS'],
  ['ो', 'ks'],
  ['ा', 'k'],
  ['ी', 'h'],
  ['ु', 'q'],
  ['ू', 'w'],
  ['ृ', '`'],
  ['ॅ', 'W'],
  ['े', 's'],
  ['ै', 'S'],
  ['ं', 'a'],
  ['ँ', '¡'],
  ['ः', '%'],
  ['्', '~'],
  ['।', 'A'],

  // Devanagari digits -> standard ASCII digits used in Kruti Dev
  ['०', '0'],
  ['१', '1'],
  ['२', '2'],
  ['३', '3'],
  ['४', '4'],
  ['५', '5'],
  ['६', '6'],
  ['७', '7'],
  ['८', '8'],
  ['९', '9'],
];

/**
 * Convert Unicode Devanagari Hindi text into Kruti Dev 010 encoding
 * (ready to copy-paste directly into MS Word / PageMaker using Kruti Dev 010 font).
 */
export function unicodeToKrutiDev(input: string): string {
  if (!input) return '';

  let str = input.normalize('NFC');

  // 1. Move Unicode Chhoti 'i' (ि) BEFORE its consonant/conjunct cluster using placeholder '\uE101'
  {
    const chars = Array.from(str);
    const out: string[] = [];
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === '\u093F') {
        let pos = out.length - 1;
        // Skip nukta if present
        if (pos >= 0 && out[pos] === '\u093C') pos--;
        if (pos >= 0 && DEVANAGARI_CONSONANT_RE.test(out[pos])) {
          while (
            pos >= 2 &&
            out[pos - 1] === '\u094D' &&
            DEVANAGARI_CONSONANT_RE.test(out[pos - 2])
          ) {
            pos -= 2;
          }
          out.splice(pos, 0, '\uE101');
        } else {
          out.push('\uE101');
        }
      } else {
        out.push(chars[i]);
      }
    }
    str = out.join('');
  }

  // 2. Move Unicode Reph (र् before a consonant) AFTER the following consonant cluster + matras using '\uE102'
  {
    const chars = Array.from(str);
    const out: string[] = [];
    let i = 0;
    while (i < chars.length) {
      if (
        chars[i] === '\u0930' &&
        i + 2 < chars.length &&
        chars[i + 1] === '\u094D' &&
        (DEVANAGARI_CONSONANT_RE.test(chars[i + 2]) || chars[i + 2] === '\uE101')
      ) {
        let j = i + 2;
        if (chars[j] === '\uE101') j++;
        if (j < chars.length && DEVANAGARI_CONSONANT_RE.test(chars[j])) {
          j++;
          if (j < chars.length && chars[j] === '\u093C') j++;
          while (
            j + 1 < chars.length &&
            chars[j] === '\u094D' &&
            DEVANAGARI_CONSONANT_RE.test(chars[j + 1])
          ) {
            j += 2;
            if (j < chars.length && chars[j] === '\u093C') j++;
          }
          while (j < chars.length && DEVANAGARI_MATRA_OR_MOD_RE.test(chars[j]) && chars[j] !== '\u094D') {
            j++;
          }
          for (let k = i + 2; k < j; k++) {
            out.push(chars[k]);
          }
          out.push('\uE102');
          i = j;
          continue;
        }
      }
      out.push(chars[i]);
      i++;
    }
    str = out.join('');
  }

  // 3. Greedy longest-match mapping from Unicode -> Kruti Dev 010
  const map = new Map<string, string>(UNICODE_TO_KRUTI_PAIRS);
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '\uE101') {
      result += 'f';
      i++;
      continue;
    }
    if (str[i] === '\uE102') {
      result += 'Z';
      i++;
      continue;
    }

    let matched = false;
    for (let len = Math.min(3, str.length - i); len >= 1; len--) {
      const slice = str.slice(i, i + len);
      const rep = map.get(slice);
      if (rep !== undefined) {
        result += rep;
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result += str[i];
      i++;
    }
  }

  return result;
}

const KRUTI_FONT_NAME_RE = /kruti|devlys|k010|kd010/i;

/**
 * Returns true if a PDF font family / font name clearly identifies Kruti Dev or DevLys.
 */
export function isKrutiDevFontName(fontName: string): boolean {
  return KRUTI_FONT_NAME_RE.test(fontName || '');
}

/**
 * Heuristic check to recognize raw Kruti Dev 010 ASCII text even when font metadata is missing.
 * Checks for unmistakable Kruti Dev Hindi tokens (e.g. 'esa', 'dk', 'dh', 'ds', 'gS', 'ls', 'fd', 'iz', 'fo/', 'lHkk', 'A')
 * while avoiding false positives on normal English prose.
 */
export function looksLikeKrutiDevText(text: string): boolean {
  if (!text || text.trim().length < 12) return false;

  // If text already contains significant Unicode Devanagari, it's not raw Kruti Dev
  const devMatches = text.match(/[\u0900-\u097F]/g);
  if (devMatches && devMatches.length >= 6) return false;

  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return false;

  // Classic ultra-frequent Kruti Dev Hindi function words & endings
  const krutiStopWords = new Set([
    'esa',
    'dk',
    'dh',
    'ds',
    'gS',
    'gSa',
    'ls',
    'dks',
    'ij',
    'fd',
    'vkSj',
    'ugha',
    'fd;k',
    'x;k',
    'gks',
    'tks',
    'bl',
    'ml',
    'A',
    'gSA',
    'gSaA',
    'rkfd',
    'fy,',
    'fy;s',
    'izns\'k',
    'fo/kku',
    'lHkk',
  ]);

  let krutiHits = 0;
  let englishStopHits = 0;
  const englishStopWords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'have',
    'are',
    'was',
    'were',
    'page',
    'date',
    'total',
    'number',
  ]);

  for (const raw of tokens) {
    const clean = raw.replace(/[(),.;:!?]+$/g, '');
    if (krutiStopWords.has(raw) || krutiStopWords.has(clean)) {
      krutiHits += 2;
    } else if (
      // Mixed-case or symbol-embedded Kruti Dev syllable patterns like 'lHkk', 'fo/kku', '[k', 'vk', 'dk;Z', 'izns'
      /[a-z][A-Z][a-z]/.test(clean) ||
      /(?:vk|bZ|kS|ks|\[k|\/k|'k|"k|\{k|Hk|Fk|Rk|Xk|Lk|Ek|Yk|Ok|Uk|Ik|Ck|Dk|iz|nz|xz|dz)/.test(
        clean
      )
    ) {
      krutiHits += 1;
    }

    if (englishStopWords.has(clean.toLowerCase())) {
      englishStopHits++;
    }
  }

  if (englishStopHits >= 3 && krutiHits < englishStopHits * 2) {
    return false;
  }

  return krutiHits >= Math.max(4, Math.floor(tokens.length * 0.35));
}

/**
 * Returns true if the given string contains Unicode Devanagari (Hindi) characters.
 */
export function containsDevanagariUnicode(text: string): boolean {
  return /[\u0900-\u097F]/.test(text || '');
}

/**
 * Post-process OCR-recognized Hindi / Devanagari text so matras, conjuncts, and vowels
 * render cleanly without broken dotted-circle glyphs (◌) or split vowel signs.
 */
export function normalizeOcrHindiUnicode(text: string): string {
  if (!text) return '';

  let out = text;
  try {
    out = out.normalize('NFC');
  } catch {
    // ignore normalization error
  }

  // Strip invisible zero-width joiner noise that breaks search & rendering
  out = out.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

  // Fix split Devanagari vowels & combined matras commonly emitted by Tesseract OCR
  out = out
    .replace(/अ\s*ा/g, 'आ')
    .replace(/आ\s*े/g, 'ओ')
    .replace(/आ\s*ै/g, 'औ')
    .replace(/अ\s*ो/g, 'ओ')
    .replace(/अ\s*ौ/g, 'औ')
    .replace(/ए\s*े/g, 'ऐ')
    .replace(/ा\s*े/g, 'ो')
    .replace(/ा\s*ै/g, 'ौ')
    .replace(/ा\s*ॅ/g, 'ॉ')
    .replace(/्\s*ा/g, '');

  // Re-order visually detached chhoti 'i' (ि) placed before a consonant cluster at word start BEFORE collapsing spaces
  out = out.replace(
    /(^|[\s([{"'—-])\u093F([\u0915-\u0939\u0958-\u095F]\u093C?(?:\u094D[\u0915-\u0939\u0958-\u095F]\u093C?)*)/g,
    '$1$2\u093F'
  );

  // Remove stray spaces OCR occasionally inserts right before combining vowel matras / anusvara / visarga / halant
  out = out.replace(/([\u0915-\u0939\u0958-\u095F])\s+([\u093C\u093E-\u094D\u0901-\u0903])/g, '$1$2');

  // Rejoin spaces erroneously inserted right after a halant before a following consonant
  out = out.replace(/\u094D\s+([\u0915-\u0939\u0958-\u095F])/g, '\u094D$1');

  // Convert vertical pipe '|' used as Hindi purna viram at the end of Devanagari words into proper '।'
  out = out.replace(/([\u0900-\u097F])\s*\|(?=\s|$|[)"'\]])/g, '$1।');

  try {
    return out.normalize('NFC');
  } catch {
    return out;
  }
}

export interface KrutiDevOcrPipelineOptions {
  /** 'auto' detects Kruti Dev patterns automatically; 'force' always maps Kruti Dev -> Unicode; 'off' skips Kruti Dev mapping (still runs Unicode Hindi normalization). */
  krutiDevMode?: 'auto' | 'force' | 'off';
}

/**
 * Unified OCR post-processing pipeline stage:
 * 1. Detects or applies Kruti Dev 010 / DevLys font mapping to Unicode Devanagari
 * 2. Normalizes and repairs OCR-extracted Devanagari matras, halants, and vowels
 *    so extracted Hindi renders cleanly across UI, search, copy, and Word (.docx) exports.
 */
export function processOcrTextWithKrutiDev(
  rawText: string,
  options: KrutiDevOcrPipelineOptions = {}
): { text: string; krutiDevMapped: boolean } {
  if (!rawText) return { text: '', krutiDevMapped: false };

  const mode = options.krutiDevMode ?? 'auto';
  const shouldMapKruti =
    mode === 'force' || (mode === 'auto' && looksLikeKrutiDevText(rawText));

  if (shouldMapKruti) {
    const mapped = krutiDevToUnicode(rawText);
    return {
      text: normalizeOcrHindiUnicode(mapped),
      krutiDevMapped: true,
    };
  }

  return {
    text: normalizeOcrHindiUnicode(rawText),
    krutiDevMapped: false,
  };
}

