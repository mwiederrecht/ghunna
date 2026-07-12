# ASSUMPTIONS

Every unresolved scholarly or engineering question is logged here with its expected
diff signature. Entries are removed only when resolved with evidence; genuinely
scholarly ambiguities graduate to RESIDUE.md instead.

---

## A-001 — Assumed ṭarīq: al-Shāṭibiyyah

Madd munfaṣil/muttaṣil at 4 counts, and the rest of the Shāṭibiyyah parameter set.
**Unverified** against the source mushaf underlying the cpfair oracle (Dar al-Maarifah
tajweed maṣāḥif per its README).
**Expected diff signature:** systematic length/classification differences on madd
spans if the oracle's mushaf follows a different ṭarīq convention.
Status: open. Check when madd diffs arrive.

## A-002 — Canonical text: Tanzil Uthmani (current)

Canonical corpus = Tanzil.net Uthmani, snapshot vendored 2026-07-11 at
`vendor/quran-uthmani-current.txt`. The oracle's indices are pinned to a ca. 2017-04-06
snapshot (`vendor/quran-uthmani-2017.txt`, from the cpfair README's attachment link).
The two differ (~5.6 KB); an explicit per-verse index-mapping layer bridges them.
**Expected diff signature:** none, if the mapping layer is correct — any residual
index misalignment is a mapping bug, not a rule bug.
Status: **resolved 2026-07-11.** Drift fully classified (5 kinds, 322 sites, 309
verses — see `reports/drift.md`): hamza-on-tatweel encoding (277), small-high-yāʾ
encoding (38), بَعْدَ مَا spacing (3), يَٰصَٰحِبَىِ seat encoding (2), stray tatweel (2).
All pure encoding; zero textual differences. Index-mapping layer
(`tools/oracle-map.ts`) verified round-trip over all 60,057 oracle annotations
with 0 failures and 0 approximate endpoints (`tools/verify-oracle-map.ts`).

## A-005 — بَعْدَ مَا word-boundary drift (3 sites)

At 2:181, 8:6, 13:37 the canonical text writes بَعْدَ مَا as two words where the
2017 oracle text has بَعْدَمَا as one. Word boundaries are rule-relevant (madd
munfaṣil, waqf positions). No madd/hamza interaction exists at these three sites,
so no rule-derivation difference is expected — but if a diff ever lands on these
verses, check this first.
Status: open (watch-list).

## A-003 — Oracle rule taxonomy mapping

cpfair's rule ids (`madd_2`, `madd_246`, `idghaam_ghunnah`, …) are *its* taxonomy.
Our rule granularity follows the classical texts. The mapping table
(`tools/oracle-rule-map.ts`) is our interpretation of what each oracle id covers.
**Expected diff signature:** systematic whole-category mismatches if a mapping row is
wrong (e.g. our madd ṭabīʿī vs their `madd_2` scope).
Status: open; refine as diff categories emerge.

## A-006 — Sakt sites under Ḥafṣ/Shāṭibiyyah

Four (some count five) sakt positions for Ḥafṣ: 18:1–2 (عِوَجَا ۜ قَيِّمًا),
36:52 (مَرْقَدِنَا ۜ هَٰذَا), 75:27 (مَنْ ۜ رَاقٍ), 83:14 (بَلْ ۜ رَانَ). The sakt
**blocks** the idghām that letter context would otherwise derive (75:27, 83:14
would be idghām bilā ghunnah / mutaqāribayn).
**Superseded by evidence (2026-07-11):** the plain canonical text carries NO
sakt mark — U+06DC there is only the seen-for-ṣād sign (2:245, 7:69); the sakt ۜ
exists only in the marked Tanzil variant. The oracle omits idghām annotations at
both 75:27 and 83:14 (verified directly), i.e. it respects the sakt.
**Adopted policy:** sakt sites are riwāyah parameter data — an enumerated
positions list in the Ḥafṣ/Shāṭibiyyah parameter set (classically sound: the
ṭarīq transmits sakt as a list, not a derivable rule). Engine suppresses idghām
and emits `sakt` at listed sites: 18:1→2, 36:52, 75:27, 83:14.
Status: resolved by policy; verify at diff time that no idghām diff appears at
75:27 / 83:14.

## A-007 — ʿAyn wajhān in fawātiḥ (كهيعص، حم عسق)

Tuḥfah:54: ʿayn may take 4 or 6 counts; ṭūl "more proper". Engine emits 6 with
the wajhān recorded in the explanation.
**Expected diff signature:** none (oracle's `madd_6` category is length-blind).
Status: settled by policy, revisit only if a scholar objects.

## A-008 — Muttaṣil requires a voweled hamzah

Introduced for 2:72 فَٱدَّٰرَٰٔتُمْ, whose apparent "madd + sākin hamzah" turned
out to be a mis-tokenized hamzah *seat* (see RESIDUE R-006, resolved): the word
is فَادَّارَأْتُمْ with no madd before the hamzah. After the tokenizer fix, no
corpus site pairs a madd letter with a sākin hamzah, so the policy is moot in
practice; the voweled-hamzah condition remains in the engine as a harmless
guard consistent with all classical examples.
Status: **resolved 2026-07-11** (root cause was encoding, not fiqh).

## A-004 — NPM package name

Working name `tajweed-engine`; final name to be confirmed with the project owner
before publish. No code depends on it.
