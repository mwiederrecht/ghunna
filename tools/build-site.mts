/**
 * Assemble the documentation site: bilingual (English at /, Arabic at /ar/),
 * fully static and crawlable, one shared shell.
 *
 *   npx tsx tools/build-site.mts     -> site/public/**.html + sitemap + robots
 *
 * Hand-written bodies live in site/pages/<lang>/<id>.html and begin with:
 *   <!-- title: Getting started -->
 * The nav id is the filename; the route and per-language labels come from NAV
 * below. Three pages are generated per language so they cannot drift from the
 * code: /rules (RULE_META + poems), /sources (poem transcriptions), /api (the
 * shipped .d.ts). SEO: per-page <title>/description, canonical, Open Graph,
 * hreflang alternates, sitemap.xml, robots.txt.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { RULE_META } from "../src/rules/meta.js";
import type { RuleId } from "../src/annotation.js";

const SITE = "https://ghunna.com";
const OUT = "site/public";
const PAGES = "site/pages";
mkdirSync(OUT, { recursive: true });

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
type Lang = "en" | "ar";

// ---- language framing ----
const LANG: Record<Lang, {
  htmlLang: string; dir: "ltr" | "rtl"; tag: string; nameFoot: string;
  switchLabel: string; footer: string;
}> = {
  en: {
    htmlLang: "en", dir: "ltr", tag: "the tajweed library", nameFoot: "ghunna",
    switchLabel: "العربية",
    footer: `<b>ghunna</b> (<span class="ar">غُنّة</span>): the nasal resonance of tajweed; the library is named for it. MIT license. Qurʾān text: Tanzil (carried intact, with attribution). Every rule cites its line.`,
  },
  ar: {
    htmlLang: "ar", dir: "rtl", tag: "مكتبة التجويد", nameFoot: "غُنّة",
    switchLabel: "English",
    footer: `<b>غُنّة</b>: الرنين الأنفي في التجويد، وبه سُمّيت المكتبة. رخصة MIT. النص القرآني: تنزيل (منقول كما هو مع النسبة). كلُّ حكمٍ يُحيل إلى بيته.`,
  },
};

// ---- navigation (routes + per-language labels) ----
const NAV: Array<{ group: Record<Lang, string>; items: Array<{ id: string; route: string; label: Record<Lang, string> }> }> = [
  { group: { en: "The library", ar: "المكتبة" }, items: [
    { id: "index", route: "/", label: { en: "Overview", ar: "نظرة عامة" } },
    { id: "start", route: "/start", label: { en: "Getting started", ar: "البداية" } },
    { id: "api", route: "/api", label: { en: "API reference", ar: "مرجع الواجهة" } },
    { id: "architecture", route: "/architecture", label: { en: "Architecture", ar: "البنية" } },
  ]},
  { group: { en: "The rules", ar: "الأحكام" }, items: [
    { id: "rules", route: "/rules", label: { en: "Rule catalog", ar: "فهرس الأحكام" } },
    { id: "waqf", route: "/waqf", label: { en: "The waqf model", ar: "نموذج الوقف" } },
    { id: "sources", route: "/sources", label: { en: "The sources", ar: "المصادر" } },
  ]},
  { group: { en: "Verification", ar: "التحقّق" }, items: [
    { id: "verification", route: "/verification", label: { en: "Method and results", ar: "المنهج والنتائج" } },
    { id: "residue", route: "/residue", label: { en: "The residue", ar: "مواضع الاختلاف" } },
    { id: "assumptions", route: "/assumptions", label: { en: "Assumptions", ar: "الافتراضات" } },
  ]},
];
const ROUTE: Record<string, string> = {};
const TITLE: Record<Lang, Record<string, string>> = { en: {}, ar: {} };
for (const g of NAV) for (const it of g.items) {
  ROUTE[it.id] = it.route;
  TITLE.en[it.id] = it.label.en; TITLE.ar[it.id] = it.label.ar;
}

// per-page meta descriptions (own description per page is an SEO signal)
const DESC: Record<Lang, Record<string, string>> = {
  en: {
    index: "ghunna, the tajweed library: a derivation engine for classical tajweed. Vocalized Uthmani text in, rule annotations out, every span cited to the line of Tuhfat al-Atfal or al-Muqaddimah al-Jazariyyah.",
    start: "Install ghunna and annotate a verse. Options, input contract, the whole-verse output shape, and the per-letter view with annotationsAt.",
    api: "The full ghunna API, reproduced from the shipped TypeScript declaration files so the reference cannot drift from the code.",
    architecture: "How the ghunna engine is built: a letter model, a rule interpreter, and declarative rule data with citations. About 2,100 lines, zero runtime dependencies.",
    rules: "Every tajweed rule ghunna derives, generated from RULE_META: Arabic name, transliteration, English and Arabic derivation, and the cited couplet.",
    waqf: "How ghunna models stopping (waqf). Several rules exist only at a pause and several die across one, so recitation context is a parameter, not a baked-in assumption.",
    sources: "The two source poems in full: Tuhfat al-Atfal and al-Muqaddimah al-Jazariyyah, the line-numbered citation targets for every rule ghunna emits.",
    verification: "How ghunna's output was verified over the whole Qur'an against independent datasets and the printed Dar al-Maarifah mushaf, with 99.8% agreement and every disagreement documented.",
    residue: "The 108 sites where ghunna disagrees with the reference datasets, in six groups, each examined against the published tajweed literature and the printed page.",
    assumptions: "Every open scholarly or engineering question ghunna answered by adopting a policy, logged with the diff signature that would expose it if wrong.",
  },
  ar: {
    index: "غُنّة، مكتبة التجويد: محرّك يستنبط أحكام التجويد الكلاسيكي. يدخله النص العثماني المشكول فتخرج منه الأحكام، كلُّ موضعٍ مُحالٌ إلى بيته من تحفة الأطفال أو المقدمة الجزرية.",
    start: "تثبيت غُنّة واستنباط أحكام آية. الخيارات، وعقد الإدخال، وشكل مخرجات الآية كاملة، والعرض حرفًا حرفًا عبر annotationsAt.",
    api: "واجهة غُنّة كاملة، منقولة من ملفات التصريح التي تُشحن مع الحزمة، فلا يمكن للمرجع أن يفارق الكود.",
    architecture: "كيف بُني محرّك غُنّة: نموذج للحروف، ومفسّر للأحكام، وبيانات أحكام تصريحية مع الإحالات. نحو ٢١٠٠ سطر، وبلا اعتماديّات وقت التشغيل.",
    rules: "كلُّ حكمٍ تستنبطه غُنّة، مُولَّدٌ من جدول الأحكام: الاسم العربي، ونقحرته، والاستنباط بالعربية والإنجليزية، والبيت المُحال إليه.",
    waqf: "كيف تنمذج غُنّة الوقف. بعض الأحكام لا يكون إلا عند الوقف وبعضها يزول به، فحال التلاوة معطًى لا افتراضٌ مُثبَّت.",
    sources: "المنظومتان المصدر كاملتين: تحفة الأطفال والمقدمة الجزرية، وهما مرجع الإحالة المرقّم لكل حكمٍ تُخرجه غُنّة.",
    verification: "كيف تم التحقق من مخرجات غُنّة على القرآن كاملًا بمقارنتها بمجموعات بيانات مستقلة وبمصحف دار المعرفة المطبوع، بنسبة اتفاق ٩٩٫٨٪ وتوثيق كل موضع اختلاف.",
    residue: "المواضع الـ١٠٨ التي تخالف فيها غُنّة مجموعات البيانات المرجعية، في ست مجموعات، كلٌّ منها مبحوثٌ في المراجع المنشورة وفي الصفحة المطبوعة.",
    assumptions: "كلُّ مسألةٍ علميةٍ أو هندسيةٍ مفتوحة أجابت عنها غُنّة بتبنّي سياسة، مُسجَّلةً مع أثرها المتوقَّع في المقارنة لو كانت خطأً.",
  },
};

// ---- poems ----
function poemLines(path: string): Map<number, string> {
  const out = new Map<number, string>();
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^(\d+)\. (.+)$/);
    if (m) out.set(Number(m[1]), m[2].replace(/\s*\*\*\*\s*/, " ۞ "));
  }
  return out;
}
const POEMS = {
  tuhfah: { name: "Tuḥfat al-Aṭfāl", nameAr: "تحفة الأطفال", lines: poemLines("docs/sources/tuhfah.md") },
  jazariyyah: { name: "al-Muqaddimah al-Jazariyyah", nameAr: "المقدمة الجزرية", lines: poemLines("docs/sources/jazariyyah.md") },
};

// ============ generated pages, per language ============
const T = (lang: Lang, en: string, ar: string) => (lang === "en" ? en : ar);

// ---- /rules ----
const GROUPS: Array<{ title: Record<Lang, string>; note: Record<Lang, string>; ids: RuleId[] }> = [
  { title: { en: "Nūn sākinah and tanwīn", ar: "النون الساكنة والتنوين" },
    note: { en: "The nūn sākinah family of Tuḥfat al-Aṭfāl: what happens to an unvoweled nūn, or to tanwīn, before each class of following letter.",
      ar: "أحكام النون الساكنة والتنوين من تحفة الأطفال: ما يعرض للنون الساكنة أو التنوين أمام كل صنفٍ من الحروف بعدها." },
    ids: ["izhar-halqi", "idgham-bighunnah", "izhar-mutlaq", "idgham-bila-ghunnah", "iqlab", "ikhfa-haqiqi"] },
  { title: { en: "Ghunnah", ar: "الغنّة" }, note: { en: "", ar: "" }, ids: ["ghunnah-mushaddadah"] },
  { title: { en: "Mīm sākinah", ar: "الميم الساكنة" }, note: { en: "", ar: "" }, ids: ["ikhfa-shafawi", "idgham-shafawi", "izhar-shafawi"] },
  { title: { en: "The lām rules", ar: "أحكام اللام" },
    note: { en: "The definite article before moon and sun letters, and the lām of lafẓ al-jalālah.",
      ar: "لام التعريف قبل الحروف القمرية والشمسية، ولام لفظ الجلالة." },
    ids: ["lam-qamariyyah", "lam-shamsiyyah", "lam-jalalah-tafkhim", "lam-jalalah-tarqiq"] },
  { title: { en: "Tafkhīm and tarqīq", ar: "التفخيم والترقيق" },
    note: { en: "The heaviness rules: the seven istiʿlāʾ letters, and the contextual rules of the rāʾ. These are printed in the Dar al-Maarifah tajweed muṣḥaf as a separate (blue) color class that the digital datasets never carried; this library is, to our knowledge, their first digital derivation.",
      ar: "أحكام التفخيم: حروف الاستعلاء السبعة، وأحكام الراء بحسب سياقها. تُطبع في مصحف دار المعرفة بلونٍ (أزرق) مستقلٍّ لم تحمله مجموعات البيانات الرقمية قطّ، وهذه المكتبة ــ فيما نعلم ــ أول من استنبطها رقميًّا." },
    ids: ["tafkhim-istila", "ra-tafkhim", "ra-tarqiq", "ra-takrir"] },
  { title: { en: "Articulation care", ar: "البيان" }, note: { en: "", ar: "" }, ids: ["bayan-dad-zha"] },
  { title: { en: "Adjacent-consonant idghām", ar: "إدغام المتماثلين والمتجانسين والمتقاربين" },
    note: { en: "Assimilation between neighboring consonants outside the nūn and mīm families.",
      ar: "الإدغام بين الحرفين المتجاورين في غير بابَي النون والميم." },
    ids: ["idgham-mithlayn", "idgham-mutajanisayn", "idgham-mutaqaribayn"] },
  { title: { en: "Qalqalah", ar: "القلقلة" }, note: { en: "", ar: "" }, ids: ["qalqalah-sughra", "qalqalah-kubra"] },
  { title: { en: "The madd family", ar: "المدود" },
    note: { en: "All madd classes, with the aqwā al-maddayn precedence rule applied when two causes compete for one madd letter.",
      ar: "أصناف المدّ كلها، مع تطبيق قاعدة أقوى المدَّين عند اجتماع سببين على حرف مدٍّ واحد." },
    ids: ["madd-tabii", "madd-badal", "madd-muttasil", "madd-munfasil", "madd-arid-lissukun", "madd-lin",
      "madd-lazim-kalimi-muthaqqal", "madd-lazim-kalimi-mukhaffaf", "madd-lazim-harfi-muthaqqal", "madd-lazim-harfi-mukhaffaf", "madd-iwad"] },
  { title: { en: "Stopping options and structure", ar: "أوجه الوقف والبنية" },
    note: { en: "Transmitted performance options at a stop, and the structural categories of the written text.",
      ar: "الأوجه المنقولة عند الوقف، والأصناف البنيوية للنص المكتوب." },
    ids: ["rawm", "ishmam", "waqf-ta-maftuha", "hamzat-wasl", "silent", "sakt"] },
];
{
  const covered = new Set(GROUPS.flatMap((g) => g.ids));
  const all = Object.keys(RULE_META);
  const missing = all.filter((r) => !covered.has(r as RuleId));
  if (missing.length) throw new Error(`rules page missing: ${missing.join(", ")}`);
  if (covered.size !== all.length) throw new Error("rules page lists unknown rules");
}
function ruleCard(id: RuleId, lang: Lang): string {
  const m = RULE_META[id];
  const src = POEMS[m.citation.text as keyof typeof POEMS];
  const couplets = m.citation.lines.map((n) => {
    const t = src.lines.get(n);
    return t ? `<div class="couplet">${esc(t)} <span class="ln">${n}</span></div>` : "";
  }).join("");
  const derivEn = `<div class="why">${esc(m.derivation)}</div>`;
  const derivAr = `<div class="why ar">${esc(m.derivationAr)}</div>`;
  return `<div class="rulecard" id="${id}">
  <div class="rn"><span class="ar">${esc(m.name.arabic)}</span><span class="id">${id}</span>${m.waqfDependent ? `<span class="badge">${T(lang, "waqf-dependent", "متعلّق بالوقف")}</span>` : ""}</div>
  <div class="tr">${esc(m.name.transliteration)} · ${esc(m.name.english)}</div>
  ${lang === "ar" ? derivAr + derivEn : derivEn + derivAr}
  <div class="cite">${T(lang, src.name, src.nameAr)} ${m.citation.lines.join(", ")}</div>
  ${couplets}
</div>`;
}
function rulesBody(lang: Lang): string {
  const count = Object.keys(RULE_META).length;
  let body = `<section style="padding-bottom: 8px">
  <p class="label">${T(lang, "Rule catalog", "فهرس الأحكام")} <span class="n">${count}</span></p>
  <h1>${T(lang, "Every rule, with its line.", "كلُّ حكمٍ ببيته.")}</h1>
  <p class="lede">${T(lang,
    "This page is generated from <code>RULE_META</code>, the table the package ships, so the catalog and the code agree by construction.",
    "هذه الصفحة مُولَّدة من <code>RULE_META</code>، الجدول الذي يُشحن مع الحزمة، فيتطابق الفهرس والكود بحكم البناء.")}</p>
  <p>${T(lang,
    "Each entry gives the canonical Arabic name, transliteration and English gloss, the derivation template in English and Arabic, the citation into the source poem, and the cited couplets verbatim. In the templates, <code>{t}</code> is replaced with the trigger letters and <code>{n}</code> with the following letter at annotation time. Entries marked <i>waqf-dependent</i> change with the recitation mode described in <a href=\"" + relHref(lang, "waqf") + "\">the waqf model</a>.",
    "كلُّ مدخلٍ يذكر الاسم العربي المعتمد، ونقحرته وترجمته، وقالب الاستنباط بالعربية والإنجليزية، والإحالة إلى المنظومة، والبيت المُحال إليه نصًّا. في القوالب يحلّ <code>{t}</code> محلّ الحرف المُوجِب و<code>{n}</code> محلّ الحرف التالي عند الاستنباط. والمداخل الموسومة <i>متعلّق بالوقف</i> تتغيّر بحسب حال التلاوة الموصوفة في <a href=\"" + relHref(lang, "waqf") + "\">نموذج الوقف</a>.")}</p>
</section>
`;
  for (const g of GROUPS) {
    const anchor = g.title.en.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
    body += `<section id="${anchor}">
  <h2>${T(lang, g.title.en, g.title.ar)}</h2>
  ${g.note[lang] ? `<p>${g.note[lang]}</p>` : ""}
  ${g.ids.map((id) => ruleCard(id, lang)).join("\n")}
</section>\n`;
  }
  return body;
}

// ---- /sources ----
function sourcesBody(lang: Lang): string {
  const about: Record<"tuhfah" | "jazariyyah", Record<Lang, string>> = {
    tuhfah: {
      en: "By Sulaymān al-Jamzūrī (1198 AH). The standard introductory poem on the rules of nūn sākinah and tanwīn, mīm sākinah, ghunnah, the lām rules, adjacent-consonant idghām, and the madd family. Text from Arabic Wikisource (CC BY-SA), fetched 2026-07-11. The line numbers below are the citation targets used throughout the library.",
      ar: "لسليمان الجمزوري (١١٩٨ﻫ). المنظومة التعليمية المشهورة في أحكام النون الساكنة والتنوين، والميم الساكنة، والغنّة، وأحكام اللام، وإدغام المتجاورَين، والمدود. النص من ويكي مصدر العربية (رخصة CC BY-SA)، جُلب في ٢٠٢٦-٠٧-١١. وأرقام الأبيات أدناه هي مرجع الإحالة في المكتبة كلها.",
    },
    jazariyyah: {
      en: "By Ibn al-Jazarī (d. 833 AH), the central reference poem of tajweed: articulation points and attributes of the letters, tafkhīm and tarqīq, the rāʾ rules, ḍād and ẓāʾ, the kinds of stop, and the rules of the connective hamzah. Text from Arabic Wikisource (CC BY-SA), fetched 2026-07-11.",
      ar: "لابن الجزري (ت ٨٣٣ﻫ)، المنظومة المرجع في التجويد: مخارج الحروف وصفاتها، والتفخيم والترقيق، وأحكام الراء، والضاد والظاء، وأقسام الوقف، وأحكام همزة الوصل. النص من ويكي مصدر العربية (رخصة CC BY-SA)، جُلب في ٢٠٢٦-٠٧-١١.",
    },
  };
  let body = `<section style="padding-bottom: 8px">
  <p class="label">${T(lang, "The sources", "المصادر")}</p>
  <h1>${T(lang, "The two poems, in full.", "المنظومتان كاملتين.")}</h1>
  <p class="lede">${T(lang,
    "Every rule the library emits cites one of these two texts, to the line. The transcriptions below are the library's canonical citation targets.",
    "كلُّ حكمٍ تُخرجه المكتبة يُحيل إلى إحدى هاتين المنظومتين ببيته. والنصّان أدناه هما مرجع الإحالة المعتمد.")}</p>
  <p>${T(lang,
    "Hemistichs are separated by ۞. The transcriptions are also shipped in the repository under <code>docs/sources/</code>, and the rule catalog quotes the relevant couplets beside each rule.",
    "الأشطر مفصولة بعلامة ۞. والنصّان مشحونان أيضًا في المستودع تحت <code>docs/sources/</code>، وفهرس الأحكام يقتبس البيت المناسب بجانب كل حكم.")}</p>
</section>
`;
  for (const key of ["tuhfah", "jazariyyah"] as const) {
    const rows = [...POEMS[key].lines.entries()].map(([n, t]) => {
      const [a, b] = t.split(" ۞ ");
      return b !== undefined
        ? `<span class="h">${esc(a)}</span><span class="h">${esc(b)}</span><span class="ln">${n}</span>`
        : `<span class="h wide">${esc(a)}</span><span class="ln">${n}</span>`;
    }).join("\n    ");
    body += `<section id="${key}">
  <h2>${T(lang, POEMS[key].name, POEMS[key].nameAr)}</h2>
  <p>${about[key][lang]}</p>
  <div class="scroller"><div class="poem">
    ${rows}
  </div></div>
</section>\n`;
  }
  return body;
}

// ---- /api ----
function apiBody(lang: Lang): string {
  const index = readFileSync("dist/index.d.ts", "utf8");
  const core = readFileSync("dist/core.d.ts", "utf8");
  return `<section style="padding-bottom: 8px">
  <p class="label">${T(lang, "API reference", "مرجع الواجهة")}</p>
  <h1>${T(lang, "The interface, verbatim.", "الواجهة نصًّا.")}</h1>
  <p class="lede">${T(lang,
    "The two blocks below are the declaration files the npm package ships, reproduced without editing. The reference cannot drift from the code because it is the code's own type declaration.",
    "الكتلتان أدناه هما ملفّا التصريح اللذان تُشحن بهما حزمة npm، منقولان بلا تعديل. ولا يمكن للمرجع أن يفارق الكود لأنه تصريح الكود نفسه.")}</p>
  <p>${T(lang,
    "For a guided introduction, read <a href=\"" + relHref(lang, "start") + "\">getting started</a>. For the meaning of each rule identifier, see <a href=\"" + relHref(lang, "rules") + "\">the rule catalog</a>.",
    "لمدخلٍ موجَّه، اقرأ <a href=\"" + relHref(lang, "start") + "\">البداية</a>. ولمعنى كل مُعرِّف حكم، انظر <a href=\"" + relHref(lang, "rules") + "\">فهرس الأحكام</a>.")}</p>
</section>
<section id="entry-full">
  <h2>${T(lang, "The full entry: <code>ghunna</code>", "المدخل الكامل: <code>ghunna</code>")}</h2>
  <p>${T(lang,
    "Includes the bundled Qurʾān text (Tanzil Uthmani, carried intact). Adds <code>annotateVerse</code> and <code>getVerseText</code> on top of everything in the core entry.",
    "يتضمّن النص القرآني المُضمَّن (تنزيل العثماني، منقولًا كما هو). ويضيف <code>annotateVerse</code> و<code>getVerseText</code> فوق كل ما في المدخل الأساسي.")}</p>
  <pre><code>${esc(index.trim())}</code></pre>
</section>
<section id="entry-core">
  <h2>${T(lang, "The corpus-free entry: <code>ghunna/core</code>", "المدخل بلا مصحف: <code>ghunna/core</code>")}</h2>
  <p>${T(lang,
    "The engine, tokenizer, rule table, letter profiles and riwāyah parameters, without the embedded text. Use <code>annotate(text)</code> with your own Tanzil-Uthmani-encoded input.",
    "المحرّك والمُقطِّع وجدول الأحكام وبطاقات الحروف ومعطيات الرواية، بلا نصٍّ مُضمَّن. استعمل <code>annotate(text)</code> مع نصٍّ من عندك بترميز تنزيل العثماني.")}</p>
  <pre><code>${esc(core.trim())}</code></pre>
</section>`;
}

// href helper: English routes at /, Arabic at /ar
function relHref(lang: Lang, id: string): string {
  const r = ROUTE[id];
  return lang === "en" ? r : (r === "/" ? "/ar/" : "/ar" + r);
}

// ---- the shell ----
const css = readFileSync("site/assets/site.css", "utf8");

function rail(lang: Lang, current: string): string {
  const L = LANG[lang];
  const otherHref = current === "index"
    ? (lang === "en" ? "/ar/" : "/")
    : relHref(lang === "en" ? "ar" : "en", current);
  return `
<aside class="rail">
  <a class="wordmark" href="${lang === "en" ? "/" : "/ar/"}">ghunna<span class="dot" aria-hidden="true"></span></a>
  <div class="tag">${L.tag}</div>
  <a class="langswitch" href="${otherHref}" hreflang="${lang === "en" ? "ar" : "en"}">${L.switchLabel}</a>
  <nav>
  ${NAV.map((g) => `<h5>${g.group[lang]}</h5>
  ${g.items.map((it) =>
    `<a class="nav" href="${relHref(lang, it.id)}"${it.id === current ? ' aria-current="page"' : ""}>${it.label[lang]}</a>`).join("\n  ")}`).join("\n  ")}
  </nav>
  <div class="foot">
    <a href="https://github.com/mwiederrecht/ghunna">GitHub</a>
    <a href="https://www.npmjs.com/package/ghunna">npm</a>
    <a href="https://melissawiederrecht.com">Melissa Wiederrecht</a>
  </div>
</aside>`;
}

function shell(lang: Lang, id: string, titleText: string, body: string): string {
  const L = LANG[lang];
  const route = ROUTE[id] ?? "/";
  const canonEn = SITE + route;
  const canonAr = SITE + (route === "/" ? "/ar/" : "/ar" + route);
  const canonical = lang === "en" ? canonEn : canonAr;
  const desc = DESC[lang][id] ?? DESC[lang].index;
  const title = `${titleText} · ${L.nameFoot}`;
  return `<!doctype html>
<html lang="${L.htmlLang}" dir="${L.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${canonEn}">
<link rel="alternate" hreflang="ar" href="${canonAr}">
<link rel="alternate" hreflang="x-default" href="${canonEn}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ghunna">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${lang === "en" ? "en_US" : "ar_AR"}">
<meta property="og:locale:alternate" content="${lang === "en" ? "ar_AR" : "en_US"}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='34' fill='%2314684f'/></svg>">
<!-- Cloudflare Web Analytics --><script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "a2215009a934488a8ab4777be9c67ca5"}'></script>
<style>${css}</style>
</head>
<body>
${rail(lang, id)}
<main><div class="content">
${body}
<footer class="page-foot">
  <div class="rule-acc"></div>
  <p style="max-width:none">${L.footer}</p>
</footer>
</div></main>
</body>
</html>`;
}

// ============ build ============
let n = 0;
const routesBuilt: Array<{ route: string; lang: Lang }> = [];
for (const lang of ["en", "ar"] as Lang[]) {
  const dir = join(PAGES, lang);
  // write the generated pages into the language dir
  writeFileSync(join(dir, "rules.html"), `<!-- title: ${TITLE[lang].rules} -->\n` + rulesBody(lang));
  writeFileSync(join(dir, "sources.html"), `<!-- title: ${TITLE[lang].sources} -->\n` + sourcesBody(lang));
  writeFileSync(join(dir, "api.html"), `<!-- title: ${TITLE[lang].api} -->\n` + apiBody(lang));

  for (const f of readdirSync(dir).filter((f) => f.endsWith(".html"))) {
    const id = basename(f, ".html");
    const src = readFileSync(join(dir, f), "utf8");
    const head = src.match(/<!--\s*title:\s*([^|]+?)\s*(?:\|.*?)?-->/);
    const titleText = head ? head[1] : (TITLE[lang][id] ?? id);
    const body = head ? src.slice(src.indexOf("-->") + 3).trim() : src.trim();
    const outPath = lang === "en"
      ? join(OUT, id + ".html")
      : join(OUT, "ar", id === "index" ? "index.html" : id + ".html");
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, shell(lang, id, titleText, body));
    routesBuilt.push({ route: relHref(lang, id), lang });
    n++;
  }
}

// ---- sitemap.xml + robots.txt ----
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routesBuilt.map(({ route }) => `  <url><loc>${SITE}${route}</loc></url>`).join("\n")}
</urlset>
`;
writeFileSync(join(OUT, "sitemap.xml"), sitemap);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`${n} pages built into ${OUT} (en + ar); sitemap.xml + robots.txt written`);
