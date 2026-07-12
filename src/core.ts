/**
 * Corpus-free entry point: the engine and tokenizer without the embedded
 * Qur'an text. Use `annotate(text)` with your own vocalized Uthmani text
 * (Tanzil Uthmani encoding), or import from "ghunna" for
 * `annotateVerse(surah, ayah)` with the bundled corpus.
 */
export { annotate, annotateTokens, annotationsAt, DerivationError } from "./engine.js";
export type { AnnotateOptions } from "./engine.js";
export { tokenize, TokenizeError, isMaddLetter, isLinLetter, isSakin } from "./tokenizer.js";
export type { Letter, Word, TokenizedVerse, Vowel, Tanwin } from "./tokenizer.js";
export type { Annotation, RuleId, RuleName, SourceRef } from "./annotation.js";
export { RULE_META } from "./rules/meta.js";
export type { RuleMeta } from "./rules/meta.js";
export { HAFS_SHATIBIYYAH, HAFS_SAKT_SITES } from "./riwayah.js";
export type { RiwayahParams, SaktSite } from "./riwayah.js";
export { describeLetter, LETTER_PROFILES } from "./letters.js";
export type { LetterProfile, SifaInfo, MakhrajInfo } from "./letters.js";
