/**
 * Codepoint classification for the Tanzil Uthmani encoding.
 *
 * Derived from the exhaustive corpus inventory (62 distinct codepoints :
 * tools/codepoint-inventory.ts). Every codepoint the tokenizer may encounter
 * is classified here; anything else is a hard error (fail loudly).
 *
 * Policy classes (docs/SPEC.md §0):
 *  - "text":      base letters & vocalization: rules may read
 *  - "ortho":     orthographic silence/rasm signs: rules may read, documented
 *  - "hint":      rule-outcome hints: recorded on tokens, but NEVER exposed
 *                 to rule predicates (enforced by the Letter API surface)
 *  - "structure": spaces, waqf marks, ayah markers: stop model only
 */

// ---- base letters (occupy a phonological position) ----

export const HAMZA = 0x0621; // ء
export const ALEF_HAMZA_ABOVE = 0x0623; // أ
export const WAW_HAMZA = 0x0624; // ؤ
export const ALEF_HAMZA_BELOW = 0x0625; // إ
export const YEH_HAMZA = 0x0626; // ئ
export const ALEF = 0x0627; // ا
export const BEH = 0x0628;
export const TEH_MARBUTA = 0x0629; // ة
export const TEH = 0x062a;
export const THEH = 0x062b;
export const JEEM = 0x062c;
export const HAH = 0x062d;
export const KHAH = 0x062e;
export const DAL = 0x062f;
export const THAL = 0x0630;
export const REH = 0x0631;
export const ZAIN = 0x0632;
export const SEEN = 0x0633;
export const SHEEN = 0x0634;
export const SAD = 0x0635;
export const DAD = 0x0636;
export const TAH = 0x0637;
export const ZAH = 0x0638;
export const AIN = 0x0639;
export const GHAIN = 0x063a;
export const FEH = 0x0641;
export const QAF = 0x0642;
export const KAF = 0x0643;
export const LAM = 0x0644;
export const MEEM = 0x0645;
export const NOON = 0x0646;
export const HEH = 0x0647;
export const WAW = 0x0648;
export const ALEF_MAKSURA = 0x0649; // ى: spells alif or yāʾ sound by context
export const YEH = 0x064a;
export const HAMZAT_WASL = 0x0671; // ٱ
export const DAGGER_ALIF = 0x0670; // ٰ: combining, but a base letter by convention
export const SMALL_WAW = 0x06e5; // ۥ: ṣila wāw (rasm-omitted, restored small)
export const SMALL_YEH = 0x06e6; // ۦ: ṣila yāʾ
export const SMALL_HIGH_YEH = 0x06e7; // ۧ: combining; on tatweel = small yāʾ letter
export const SMALL_HIGH_NOON = 0x06e8; // ۨ: combining; on tatweel = small nūn letter (21:88)
export const TATWEEL = 0x0640; // ـ: carrier only, never a letter by itself

export const BASE_LETTERS: ReadonlySet<number> = new Set([
  HAMZA, ALEF_HAMZA_ABOVE, WAW_HAMZA, ALEF_HAMZA_BELOW, YEH_HAMZA, ALEF, BEH,
  TEH_MARBUTA, TEH, THEH, JEEM, HAH, KHAH, DAL, THAL, REH, ZAIN, SEEN, SHEEN,
  SAD, DAD, TAH, ZAH, AIN, GHAIN, FEH, QAF, KAF, LAM, MEEM, NOON, HEH, WAW,
  ALEF_MAKSURA, YEH, HAMZAT_WASL,
]);

// ---- combining marks: vocalization ("text" class) ----

export const FATHATAN = 0x064b;
export const DAMMATAN = 0x064c;
export const KASRATAN = 0x064d;
export const FATHA = 0x064e;
export const DAMMA = 0x064f;
export const KASRA = 0x0650;
export const SHADDA = 0x0651;
export const SUKUN = 0x0652;
export const HAMZA_ABOVE = 0x0654; // ٔ: on tatweel: a hamza letter

export const VOWEL_MARKS: ReadonlySet<number> = new Set([FATHA, DAMMA, KASRA]);
export const TANWIN_MARKS: ReadonlySet<number> = new Set([FATHATAN, DAMMATAN, KASRATAN]);

// ---- combining marks: orthographic / performance ("ortho" class) ----

export const SILENT_ALWAYS = 0x06df; // ۟: letter never pronounced
export const SILENT_IN_WASL = 0x06e0; // ۠: pronounced only at waqf (أَنَا۠ …)
export const SEEN_SUBST_HIGH = 0x06dc; // ۜ: recite sīn for ṣād (2:245, 7:69)
export const SEEN_SUBST_LOW = 0x06e3; // ۣ: sīn-for-ṣād variant (52:37)
export const IMALA = 0x06ea; // ۪: imālah (11:41 مَجْر۪ىٰهَا)
export const ISHMAM = 0x06eb; // ۫: ishmām (12:11 تَأْمَ۫نَّا)
export const TASHIL = 0x06ec; // ۬: tashīl (41:44 ءَا۬عْجَمِىٌّ)

export const ORTHO_MARKS: ReadonlySet<number> = new Set([
  SILENT_ALWAYS, SILENT_IN_WASL, SEEN_SUBST_HIGH, SEEN_SUBST_LOW, IMALA, ISHMAM, TASHIL,
]);

// ---- combining marks: rule-outcome hints: recorded, never rule-readable ----

export const MADDAH = 0x0653; // ٓ: long-madd outcome marker (SPEC §0)
export const SMALL_HIGH_MEEM = 0x06e2; // ۢ: iqlāb/ikhfāʾ sign
export const SMALL_LOW_MEEM = 0x06ed; // ۭ: iqlāb sign

export const HINT_MARKS: ReadonlySet<number> = new Set([MADDAH, SMALL_HIGH_MEEM, SMALL_LOW_MEEM]);

// ---- structure ----

export const SPACE = 0x0020;
/** Waqf marks + sajdah sign (marked text variant only). */
export const WAQF_MARKS: ReadonlySet<number> = new Set([
  0x06d6, // ۖ ṣalā - continuation preferred
  0x06d7, // ۗ qalā - stop preferred
  0x06d8, // ۘ mīm - stop obligatory (lāzim)
  0x06d9, // ۙ lā - do not stop
  0x06da, // ۚ jīm - stop permitted
  0x06db, // ۛ three dots - muʿānaqah pair
  0x06e9, // ۩ sajdah
]);
/** In the marked text, the sakt ۜ (same codepoint as SEEN_SUBST_HIGH) appears
 * as a standalone spaced sign rather than a combining mark on a letter. The
 * tokenizer distinguishes by position (after space / not following a base). */

// ---- letter classes used by rules ----

/** The six throat letters (iẓhār ḥalqī): tuhfah:8. */
export const THROAT_LETTERS: ReadonlySet<number> = new Set([HAMZA, HEH, AIN, HAH, GHAIN, KHAH]);
/** يرملون without the exceptions; bi-ghunnah subset ينمو: tuhfah:9–12. */
export const YANMU: ReadonlySet<number> = new Set([YEH, NOON, MEEM, WAW]);
export const LAM_REH: ReadonlySet<number> = new Set([LAM, REH]);
/** The fifteen ikhfāʾ letters: tuhfah:15–16. */
export const IKHFA_LETTERS: ReadonlySet<number> = new Set([
  SAD, THAL, THEH, KAF, JEEM, SHEEN, QAF, SEEN, DAL, TAH, ZAIN, FEH, TEH, DAD, ZAH,
]);
/** Qalqalah letters قطب جد: jazariyyah:23. */
export const QALQALAH_LETTERS: ReadonlySet<number> = new Set([QAF, TAH, BEH, JEEM, DAL]);
/** Moon letters ابغ حجك وخف عقيمه: tuhfah:25. */
export const QAMARI_LETTERS: ReadonlySet<number> = new Set([
  ALEF, HAMZA, ALEF_HAMZA_ABOVE, ALEF_HAMZA_BELOW, // hamza-family word starts
  BEH, GHAIN, HAH, JEEM, KAF, WAW, KHAH, FEH, AIN, QAF, YEH, MEEM, HEH,
]);
/** Sun letters: tuhfah:27. */
export const SHAMSI_LETTERS: ReadonlySet<number> = new Set([
  TAH, THEH, SAD, REH, TEH, DAD, THAL, NOON, DAL, SEEN, ZAH, ZAIN, SHEEN, LAM,
]);

/** The seven istiʿlāʾ (elevation/tafkhīm) letters خص ضغط قظ: jazariyyah:21. */
export const ISTILA_LETTERS: ReadonlySet<number> = new Set([
  KHAH, SAD, DAD, GHAIN, TAH, QAF, ZAH,
]);

/** Letters whose written form is phonologically hamza. */
export const HAMZA_FAMILY: ReadonlySet<number> = new Set([
  HAMZA, ALEF_HAMZA_ABOVE, WAW_HAMZA, ALEF_HAMZA_BELOW, YEH_HAMZA,
]);
