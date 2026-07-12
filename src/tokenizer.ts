/**
 * Tokenizer: codepoints → letters → words.
 *
 * A Letter is a base character plus its combining marks. Conventions
 * (docs/SPEC.md §0, matching the oracle's letter model):
 *  - dagger alif (U+0670) is a BASE letter (the madd alif), not a mark;
 *  - tatweel (U+0640) is a carrier: tatweel + hamza-above is a hamza letter,
 *    tatweel + small high yāʾ/nūn is that small letter; a carrier never stands
 *    alone;
 *  - small wāw/yāʾ (U+06E5/U+06E6) are base letters (rasm-omitted ṣila letters);
 *  - a consonant with no ḥarakah at all is sākin by position (the encoding
 *    omits sukūn at idghām/ikhfāʾ-affected sites; we treat bare = sākin and
 *    never branch on the presence/absence distinction).
 *
 * Spans are codepoint-ranged: each Letter carries [start, end) codepoint
 * offsets into the verse text. Unknown codepoints are a hard error.
 */
import {
  ALEF, ALEF_MAKSURA, BASE_LETTERS, DAGGER_ALIF, FATHA, DAMMA, KASRA,
  FATHATAN, DAMMATAN, KASRATAN, HAMZA, HAMZA_ABOVE, HINT_MARKS, ORTHO_MARKS,
  SHADDA, SILENT_ALWAYS, SILENT_IN_WASL, SMALL_HIGH_NOON, SMALL_HIGH_YEH,
  SMALL_WAW, SMALL_YEH, SPACE, SUKUN, TATWEEL, TANWIN_MARKS, VOWEL_MARKS,
  WAQF_MARKS, NOON, YEH, WAW, SEEN_SUBST_HIGH, IMALA, TASHIL,
} from "./chars.js";

export type Vowel = "fatha" | "damma" | "kasra";
export type Tanwin = "fath" | "damm" | "kasr";

export interface Letter {
  /** Phoneme-identity codepoint. Tatweel-seated hamza → U+0621; small high
   *  yāʾ/nūn → U+06E6 (ṣila yāʾ) / U+0646 (nūn). */
  base: number;
  /** Codepoint range [start, end) in the verse text, covering the base, its
   *  carrier if any, and all combining marks. */
  start: number;
  end: number;
  vowel: Vowel | null;
  tanwin: Tanwin | null;
  shadda: boolean;
  /** Explicit sukūn sign. Use isSakin() for the phonological question. */
  sukun: boolean;
  silent: "always" | "wasl" | null;
  /** Ortho-class marks present (SPEC §0): rule-readable. */
  ortho: number[];
  /** Hint-class marks present: recorded for span fidelity and debugging;
   *  rule data must never reference these (enforced by test). */
  hints: number[];
}

export interface Word {
  letters: Letter[];
  start: number;
  end: number;
  index: number;
}

export interface TokenizedVerse {
  words: Word[];
  /** Standalone signs encountered (waqf marks / spaced sakt in the marked
   *  text variant), attached by preceding word index. */
  signs: Array<{ cp: number; afterWord: number; at: number }>;
  text: string;
}

export class TokenizeError extends Error {
  constructor(message: string, readonly at: number) {
    super(`${message} (codepoint offset ${at})`);
    this.name = "TokenizeError";
  }
}

const hex = (c: number) => "U+" + c.toString(16).toUpperCase().padStart(4, "0");

/** Marks a letter as phonologically silent in connected speech. */
export function isSilentInWasl(l: Letter): boolean {
  return l.silent !== null;
}

/** Sākin = explicitly sukūned, or bare of any vocalization (positional sukūn).
 *  Madd letters are also bare: callers distinguish via vowel agreement. */
export function isSakin(l: Letter): boolean {
  return l.sukun || (l.vowel === null && l.tanwin === null && !l.shadda && l.silent === null);
}

export function tokenize(text: string): TokenizedVerse {
  const cps = [...text];
  const words: Word[] = [];
  const signs: TokenizedVerse["signs"] = [];
  let letters: Letter[] = [];
  let wordStart = 0;
  let cur: Letter | null = null;

  const closeWord = (endIdx: number) => {
    cur = null;
    if (letters.length === 0) return;
    words.push({ letters, start: wordStart, end: endIdx, index: words.length });
    letters = [];
  };

  const newLetter = (base: number, start: number, end: number): Letter => {
    const l: Letter = {
      base, start, end,
      vowel: null, tanwin: null, shadda: false, sukun: false, silent: null,
      ortho: [], hints: [],
    };
    if (letters.length === 0) wordStart = start;
    letters.push(l);
    cur = l;
    return l;
  };

  for (let i = 0; i < cps.length; i++) {
    const c = cps[i]!.codePointAt(0)!;

    if (c === SPACE) { closeWord(i); continue; }

    if (WAQF_MARKS.has(c)) {
      // standalone structure sign (marked text variant)
      closeWord(i);
      signs.push({ cp: c, afterWord: words.length - 1, at: i });
      continue;
    }

    if (BASE_LETTERS.has(c)) { newLetter(c, i, i + 1); continue; }

    if (c === DAGGER_ALIF) {
      // base letter by convention: starts a new letter even though combining
      newLetter(DAGGER_ALIF, i, i + 1);
      continue;
    }

    if (c === SMALL_WAW || c === SMALL_YEH) { newLetter(c, i, i + 1); continue; }

    if (c === TATWEEL) {
      const next = i + 1 < cps.length ? cps[i + 1]!.codePointAt(0)! : -1;
      if (next === HAMZA_ABOVE) { newLetter(HAMZA, i, i + 2); i++; continue; }
      if (next === SMALL_HIGH_YEH) { newLetter(SMALL_YEH, i, i + 2); i++; continue; }
      if (next === SMALL_HIGH_NOON) { newLetter(NOON, i, i + 2); i++; continue; }
      if (next === SMALL_WAW) { continue; } // pure spacer before a small letter (17:7)
      throw new TokenizeError(`tatweel followed by unexpected ${hex(next)}`, i);
    }

    // combining marks: must attach to a current letter
    if (cur === null) {
      // spaced sakt sign in the marked variant: U+06DC after a space
      if (c === SEEN_SUBST_HIGH) {
        signs.push({ cp: c, afterWord: words.length - 1, at: i });
        continue;
      }
      throw new TokenizeError(`combining mark ${hex(c)} with no base letter`, i);
    }

    const l: Letter = cur;
    if (VOWEL_MARKS.has(c)) {
      if (l.vowel !== null) throw new TokenizeError(`two vowels on one letter`, i);
      l.vowel = c === FATHA ? "fatha" : c === DAMMA ? "damma" : "kasra";
    } else if (TANWIN_MARKS.has(c)) {
      if (l.tanwin !== null) throw new TokenizeError(`two tanwīn on one letter`, i);
      l.tanwin = c === FATHATAN ? "fath" : c === DAMMATAN ? "damm" : "kasr";
    } else if (c === SHADDA) {
      l.shadda = true;
    } else if (c === SUKUN) {
      l.sukun = true;
    } else if (c === HAMZA_ABOVE) {
      if (l.base === DAGGER_ALIF && l.end === i) {
        // superscript alif serving as a hamza SEAT (2:72 فَٱدَّٰرَٰٔتُمْ =
        // فَادَّارَأْتُمْ: the hamza is sākinah right after رَ; there is no madd
        // letter here). Convert the seat+mark cluster into one hamza letter.
        l.base = HAMZA;
        l.end = i + 1;
        continue;
      }
      // ى/و hamza seats are precomposed in Tanzil; anything else is unexpected
      throw new TokenizeError(`unexpected hamza-above on ${hex(l.base)}`, i);
    } else if (c === SILENT_ALWAYS) {
      l.silent = "always";
      l.ortho.push(c);
    } else if (c === SILENT_IN_WASL) {
      l.silent = "wasl";
      l.ortho.push(c);
    } else if (ORTHO_MARKS.has(c)) {
      l.ortho.push(c);
    } else if (HINT_MARKS.has(c)) {
      l.hints.push(c);
    } else {
      throw new TokenizeError(`unknown codepoint ${hex(c)}`, i);
    }
    l.end = i + 1;
  }
  closeWord(cps.length);

  if (words.length === 0) throw new TokenizeError("no letters in input", 0);
  return { words, signs, text };
}

// ---- madd-letter detection (SPEC §7 preamble) ----

/**
 * The letter carrying the vowel that governs letters[i]'s madd status: usually
 * letters[i-1], but a bare seat letter (ا/ى/و with no marks, carrying a dagger
 * alif after it: عَلَىٰ، ٱلصَّلَوٰةَ) is transparent: skip back over it.
 */
function governingLetter(letters: readonly Letter[], i: number): Letter | null {
  for (let j = i - 1; j >= 0; j--) {
    const p = letters[j]!;
    if (p.silent !== null) continue; // silent letters are transparent (جِا۟ىٓءَ)
    const isBareSeat =
      (p.base === ALEF || p.base === ALEF_MAKSURA || p.base === WAW) &&
      p.vowel === null && p.tanwin === null && !p.shadda && !p.sukun;
    if (!isBareSeat) return p;
  }
  return null;
}

/**
 * Is letters[i] a madd letter? Presence of the glyph alone is insufficient:
 * requires vowel agreement with the governing preceding letter (SPEC §7).
 */
export function isMaddLetter(letters: readonly Letter[], i: number): boolean {
  const l = letters[i]!;
  if (l.silent !== null) return false;
  // the tashīl alif (41:44 ءَا۬عْجَمِىٌّ) is a softened hamzah, not a madd letter
  if (l.ortho.includes(TASHIL)) return false;
  if (l.vowel !== null || l.tanwin !== null || l.shadda || l.sukun) {
    // a vocalized letter is a consonant; explicit sukūn = līn candidate, not madd
    return false;
  }
  if (l.base === SMALL_WAW || l.base === SMALL_YEH) return true; // ṣila letters
  const prev = governingLetter(letters, i);
  if (prev === null) return false;
  // the imālah word (11:41 مَجْر۪ىٰهَا): the imālah sign stands in for the fatḥah
  const prevFatha = prev.vowel === "fatha" || prev.ortho.includes(IMALA);
  if (l.base === ALEF) {
    // after tanwīn fatḥ the alif is the silent tanwīn seat (نَارًا), not madd :
    // it surfaces as a madd alif only at waqf (Phase 2 stop model)
    return prevFatha;
  }
  if (l.base === DAGGER_ALIF) {
    return prevFatha || prev.tanwin === "fath";
  }
  if (l.base === ALEF_MAKSURA) {
    // ى after kasrah = yāʾ-type madd (فِى). After fatḥah, the alif sound is
    // always written with a following dagger alif in this encoding (عَلَىٰ) :
    // the dagger is the madd letter and the ى is a silent seat; a bare ى after
    // fatḥah with NO dagger is the līn yāʾ of شَىْء. After tanwīn fatḥ (هُدًى)
    // it is the silent tanwīn seat.
    return prev.vowel === "kasra";
  }
  if (l.base === WAW) return prev.vowel === "damma";
  if (l.base === YEH) return prev.vowel === "kasra";
  return false;
}

/**
 * Līn letter: و/ي sākin (explicit sukūn or bare) after fatḥah (tuhfah:41).
 * Excludes the dagger-alif seat (ٱلصَّلَوٰةَ: the wāw there is silent rasm),
 * i.e. the following letter must not be a dagger alif.
 */
export function isLinLetter(letters: readonly Letter[], i: number): boolean {
  const l = letters[i]!;
  if (!(l.base === WAW || l.base === YEH || l.base === ALEF_MAKSURA)) return false;
  const sakin = l.sukun || (l.vowel === null && l.tanwin === null && !l.shadda && l.silent === null);
  if (!sakin) return false;
  const next = i + 1 < letters.length ? letters[i + 1]! : null;
  if (next !== null && next.base === DAGGER_ALIF) return false; // seat, not līn
  const prev = i > 0 ? letters[i - 1]! : null;
  return prev !== null && prev.vowel === "fatha";
}
