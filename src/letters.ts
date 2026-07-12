/**
 * Letter profiles: articulation point (makhraj) and intrinsic properties
 * (ṣifāt) of every Arabic letter, transcribed from al-Muqaddimah
 * al-Jazariyyah — makhārij: lines 9–18; ṣifāt: lines 19–25.
 *
 * Pure data. `describeLetter("ص")` returns everything the classical text
 * says about the letter, each item carrying its line citation.
 */
import type { SourceRef } from "./annotation.js";

export interface SifaInfo {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  citation: SourceRef;
}

export interface MakhrajInfo {
  arabic: string;
  english: string;
  citation: SourceRef;
}

export interface LetterProfile {
  letter: string;
  name: { arabic: string; transliteration: string };
  makhraj: MakhrajInfo;
  sifat: SifaInfo[];
}

const J = (...lines: number[]): SourceRef => ({ text: "jazariyyah", lines });

// ---- ṣifāt with opposites (jazariyyah:19–22) ----
const HAMS: SifaInfo = { id: "hams", arabic: "الهمس", transliteration: "hams", english: "whispered airflow", citation: J(20) };
const JAHR: SifaInfo = { id: "jahr", arabic: "الجهر", transliteration: "jahr", english: "voiced (no air leak)", citation: J(19, 20) };
const SHIDDAH: SifaInfo = { id: "shiddah", arabic: "الشدة", transliteration: "shiddah", english: "complete stop of sound", citation: J(20) };
const BAYNIYYAH: SifaInfo = { id: "bayniyyah", arabic: "التوسط", transliteration: "tawassuṭ", english: "between stop and flow", citation: J(21) };
const RAKHAWAH: SifaInfo = { id: "rakhawah", arabic: "الرخاوة", transliteration: "rakhāwah", english: "flowing sound", citation: J(19, 21) };
const ISTILA: SifaInfo = { id: "istila", arabic: "الاستعلاء", transliteration: "istiʿlāʾ", english: "tongue elevation (tafkhīm)", citation: J(21) };
const ISTIFAL: SifaInfo = { id: "istifal", arabic: "الاستفال", transliteration: "istifāl", english: "tongue lowered (tarqīq)", citation: J(19) };
const ITBAQ: SifaInfo = { id: "itbaq", arabic: "الإطباق", transliteration: "iṭbāq", english: "tongue pressed to palate", citation: J(22) };
const INFITAH: SifaInfo = { id: "infitah", arabic: "الانفتاح", transliteration: "infitāḥ", english: "tongue-palate separation", citation: J(19) };
const IDHLAQ: SifaInfo = { id: "idhlaq", arabic: "الإذلاق", transliteration: "idhlāq", english: "fluent (lip/tongue-tip)", citation: J(22) };
const ISMAT: SifaInfo = { id: "ismat", arabic: "الإصمات", transliteration: "iṣmāt", english: "restrained", citation: J(19, 22) };
// ---- ṣifāt without opposites (jazariyyah:23–25) ----
const SAFIR: SifaInfo = { id: "safir", arabic: "الصفير", transliteration: "ṣafīr", english: "whistle", citation: J(23) };
const QALQALAH: SifaInfo = { id: "qalqalah", arabic: "القلقلة", transliteration: "qalqalah", english: "echoing bounce when sākin", citation: J(23) };
const LIN: SifaInfo = { id: "lin", arabic: "اللين", transliteration: "līn", english: "softness (sākin after fatḥah)", citation: J(23, 24) };
const INHIRAF: SifaInfo = { id: "inhiraf", arabic: "الانحراف", transliteration: "inḥirāf", english: "deflection of the sound", citation: J(24, 25) };
const TAKRIR: SifaInfo = { id: "takrir", arabic: "التكرير", transliteration: "takrīr", english: "trill (to be restrained)", citation: J(25) };
const TAFASHSHI: SifaInfo = { id: "tafashshi", arabic: "التفشي", transliteration: "tafashshī", english: "diffusion of air", citation: J(25) };
const ISTITALAH: SifaInfo = { id: "istitalah", arabic: "الاستطالة", transliteration: "istiṭālah", english: "elongation along the tongue edge", citation: J(25) };
const GHUNNAH_SIFA: SifaInfo = { id: "ghunnah", arabic: "الغنة", transliteration: "ghunnah", english: "nasal resonance (from the khayshūm)", citation: J(18) };

// ---- makhārij (jazariyyah:9–18) ----
const M = {
  jawf: { arabic: "الجوف — للألف والواو والياء المدية", english: "the empty space of mouth and throat (madd letters)", citation: J(10) },
  aqsaHalq: { arabic: "أقصى الحلق", english: "deepest part of the throat", citation: J(11) },
  wasatHalq: { arabic: "وسط الحلق", english: "middle of the throat", citation: J(11) },
  adnaHalq: { arabic: "أدنى الحلق", english: "nearest part of the throat", citation: J(12) },
  aqsaLisan: { arabic: "أقصى اللسان مع ما فوقه من الحنك", english: "back of the tongue with the soft palate", citation: J(12) },
  aqsaLisanAsfal: { arabic: "أقصى اللسان أسفل مخرج القاف", english: "back of the tongue, slightly forward of qāf", citation: J(12, 13) },
  wasatLisan: { arabic: "وسط اللسان مع وسط الحنك", english: "middle of the tongue with the hard palate", citation: J(13) },
  hafatLisan: { arabic: "حافة اللسان مع الأضراس", english: "side of the tongue with the molars", citation: J(13, 14) },
  adnaHafah: { arabic: "أدنى حافة اللسان إلى منتهى طرفه", english: "front edge of the tongue to its tip", citation: J(14) },
  tarafNun: { arabic: "طرف اللسان تحت مخرج اللام", english: "tongue tip, below the lām point", citation: J(15) },
  tarafRa: { arabic: "طرف اللسان قرب النون بظهره", english: "tongue tip toward its back, near nūn", citation: J(15) },
  tarafThanaya: { arabic: "طرف اللسان مع أصول الثنايا العليا", english: "tongue tip with the base of the upper incisors", citation: J(16) },
  tarafSafir: { arabic: "طرف اللسان فويق الثنايا السفلى", english: "tongue tip just above the lower incisors", citation: J(16, 17) },
  tarafAtraf: { arabic: "طرف اللسان مع أطراف الثنايا العليا", english: "tongue tip with the edges of the upper incisors", citation: J(16, 17) },
  batnShafah: { arabic: "بطن الشفة السفلى مع أطراف الثنايا العليا", english: "inner lower lip with the upper incisor edges", citation: J(17) },
  shafatan: { arabic: "الشفتان", english: "the two lips", citation: J(18) },
  khayshum: { arabic: "الخيشوم — مخرج الغنة", english: "the nasal passage (ghunnah)", citation: J(18) },
} as const;

const P = (
  letter: string,
  nameAr: string,
  nameTr: string,
  makhraj: MakhrajInfo,
  sifat: SifaInfo[]
): [string, LetterProfile] => [letter, { letter, name: { arabic: nameAr, transliteration: nameTr }, makhraj, sifat }];

/** Base ṣifāt per letter, derived from the mnemonics:
 *  hams فحثه شخص سكت · shiddah أجد قط بكت · bayniyyah لن عمر ·
 *  istiʿlāʾ خص ضغط قظ · iṭbāq ص ض ط ظ · idhlāq فر من لب · ṣafīr ص ز س ·
 *  qalqalah قطب جد · līn و ي · inḥirāf ل ر · takrīr ر · tafashshī ش ·
 *  istiṭālah ض (jazariyyah:20–25). */
export const LETTER_PROFILES: ReadonlyMap<string, LetterProfile> = new Map([
  P("ء", "الهمزة", "hamzah", M.aqsaHalq, [JAHR, SHIDDAH, ISTIFAL, INFITAH, ISMAT]),
  P("ه", "الهاء", "hāʾ", M.aqsaHalq, [HAMS, RAKHAWAH, ISTIFAL, INFITAH, ISMAT]),
  P("ع", "العين", "ʿayn", M.wasatHalq, [JAHR, BAYNIYYAH, ISTIFAL, INFITAH, ISMAT]),
  P("ح", "الحاء", "ḥāʾ", M.wasatHalq, [HAMS, RAKHAWAH, ISTIFAL, INFITAH, ISMAT]),
  P("غ", "الغين", "ghayn", M.adnaHalq, [JAHR, RAKHAWAH, ISTILA, INFITAH, ISMAT]),
  P("خ", "الخاء", "khāʾ", M.adnaHalq, [HAMS, RAKHAWAH, ISTILA, INFITAH, ISMAT]),
  P("ق", "القاف", "qāf", M.aqsaLisan, [JAHR, SHIDDAH, ISTILA, INFITAH, ISMAT, QALQALAH]),
  P("ك", "الكاف", "kāf", M.aqsaLisanAsfal, [HAMS, SHIDDAH, ISTIFAL, INFITAH, ISMAT]),
  P("ج", "الجيم", "jīm", M.wasatLisan, [JAHR, SHIDDAH, ISTIFAL, INFITAH, ISMAT, QALQALAH]),
  P("ش", "الشين", "shīn", M.wasatLisan, [HAMS, RAKHAWAH, ISTIFAL, INFITAH, ISMAT, TAFASHSHI]),
  P("ي", "الياء", "yāʾ", M.wasatLisan, [JAHR, RAKHAWAH, ISTIFAL, INFITAH, ISMAT, LIN]),
  P("ض", "الضاد", "ḍād", M.hafatLisan, [JAHR, RAKHAWAH, ISTILA, ITBAQ, ISMAT, ISTITALAH]),
  P("ل", "اللام", "lām", M.adnaHafah, [JAHR, BAYNIYYAH, ISTIFAL, INFITAH, IDHLAQ, INHIRAF]),
  P("ن", "النون", "nūn", M.tarafNun, [JAHR, BAYNIYYAH, ISTIFAL, INFITAH, IDHLAQ, GHUNNAH_SIFA]),
  P("ر", "الراء", "rāʾ", M.tarafRa, [JAHR, BAYNIYYAH, ISTIFAL, INFITAH, IDHLAQ, INHIRAF, TAKRIR]),
  P("ط", "الطاء", "ṭāʾ", M.tarafThanaya, [JAHR, SHIDDAH, ISTILA, ITBAQ, ISMAT, QALQALAH]),
  P("د", "الدال", "dāl", M.tarafThanaya, [JAHR, SHIDDAH, ISTIFAL, INFITAH, ISMAT, QALQALAH]),
  P("ت", "التاء", "tāʾ", M.tarafThanaya, [HAMS, SHIDDAH, ISTIFAL, INFITAH, ISMAT]),
  P("ص", "الصاد", "ṣād", M.tarafSafir, [HAMS, RAKHAWAH, ISTILA, ITBAQ, ISMAT, SAFIR]),
  P("ز", "الزاي", "zāy", M.tarafSafir, [JAHR, RAKHAWAH, ISTIFAL, INFITAH, ISMAT, SAFIR]),
  P("س", "السين", "sīn", M.tarafSafir, [HAMS, RAKHAWAH, ISTIFAL, INFITAH, ISMAT, SAFIR]),
  P("ظ", "الظاء", "ẓāʾ", M.tarafAtraf, [JAHR, RAKHAWAH, ISTILA, ITBAQ, ISMAT]),
  P("ذ", "الذال", "dhāl", M.tarafAtraf, [JAHR, RAKHAWAH, ISTIFAL, INFITAH, ISMAT]),
  P("ث", "الثاء", "thāʾ", M.tarafAtraf, [HAMS, RAKHAWAH, ISTIFAL, INFITAH, ISMAT]),
  P("ف", "الفاء", "fāʾ", M.batnShafah, [HAMS, RAKHAWAH, ISTIFAL, INFITAH, IDHLAQ]),
  P("و", "الواو", "wāw", M.shafatan, [JAHR, RAKHAWAH, ISTIFAL, INFITAH, ISMAT, LIN]),
  P("ب", "الباء", "bāʾ", M.shafatan, [JAHR, SHIDDAH, ISTIFAL, INFITAH, IDHLAQ, QALQALAH]),
  P("م", "الميم", "mīm", M.shafatan, [JAHR, BAYNIYYAH, ISTIFAL, INFITAH, IDHLAQ, GHUNNAH_SIFA]),
  P("ا", "الألف", "alif", M.jawf, [JAHR, RAKHAWAH, ISTIFAL, INFITAH, ISMAT]),
]);

const SEAT_NORMALIZE: Record<string, string> = {
  "أ": "ء", "إ": "ء", "ؤ": "ء", "ئ": "ء", "ٱ": "ا", "ى": "ي", "ة": "ه",
  "ٰ": "ا", "ۥ": "و", "ۦ": "ي",
};

/**
 * The classical profile of a letter (makhraj + ṣifāt, jazariyyah:9–25).
 * Hamzah seats, tāʾ marbūṭah, and small/dagger forms resolve to their
 * phonetic letter. Throws on non-Arabic input (fail loudly).
 */
export function describeLetter(char: string): LetterProfile {
  const c = SEAT_NORMALIZE[char] ?? char;
  const p = LETTER_PROFILES.get(c);
  if (p === undefined) throw new RangeError(`No letter profile for ${JSON.stringify(char)}`);
  return p;
}
