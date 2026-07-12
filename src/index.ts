/**
 * ghunna: the tajweed library: derivation engine for classical tajweed.
 *
 * Ask for a verse, get its rules: every annotation carries the rule that
 * fired, the trigger characters, a human-readable derivation, and a citation
 * into Tuḥfat al-Aṭfāl / al-Muqaddimah al-Jazariyyah.
 */
export { annotateVerse, getVerseText } from "./verse.js";
export type { AnnotateVerseOptions, VerseAnnotationResult } from "./verse.js";
export { annotate, annotateTokens, DerivationError } from "./engine.js";
export type { AnnotateOptions } from "./engine.js";
export { tokenize, TokenizeError, isMaddLetter, isLinLetter, isSakin } from "./tokenizer.js";
export type { Letter, Word, TokenizedVerse, Vowel, Tanwin } from "./tokenizer.js";
export type { Annotation, RuleId, RuleName, SourceRef } from "./annotation.js";
export { RULE_META } from "./rules/meta.js";
export type { RuleMeta } from "./rules/meta.js";
export { HAFS_SHATIBIYYAH, HAFS_SAKT_SITES } from "./riwayah.js";
export type { RiwayahParams, SaktSite } from "./riwayah.js";
export { getWaqfMarks } from "./waqf.js";
export type { WaqfMark, WaqfMarkKind } from "./waqf.js";
export { describeLetter, LETTER_PROFILES } from "./letters.js";
export type { LetterProfile, SifaInfo, MakhrajInfo } from "./letters.js";
