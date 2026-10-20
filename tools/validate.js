// Checks every text against the word lists and shows how hard each one is.
// Run from the project root:  node tools/validate.js            (assumes you know HSK 1-2)
//                             node tools/validate.js --known 3  (assumes you know HSK 1-3)
//                             node tools/validate.js --known 0  (assumes you know nothing)
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const C = require(path.join(root, "core.js"));

const arg = process.argv.indexOf("--known");
const knownLevel = arg > 0 ? parseInt(process.argv[arg + 1], 10) : 2;

const ctx = {}; vm.createContext(ctx);
const dataFiles = ["hsk1", "hsk2", "hsk3", "extra", "texts", "chars"].filter(f => fs.existsSync(path.join(root, "data", f + ".js")));
for (const f of dataFiles) vm.runInContext(fs.readFileSync(path.join(root, "data", f + ".js"), "utf8"), ctx);
const lex = C.parseLexicon([
  { level: 1, lines: ctx.HSK1_RAW }, { level: 2, lines: ctx.HSK2_RAW },
  { level: 3, lines: ctx.HSK3_RAW }, { level: 4, lines: ctx.EXTRA_RAW },
]);

let problems = 0;
const say = (m) => { console.log(m); };
const problem = (m) => { problems++; console.log("PROBLEM  " + m); };

// Lexicon checks
lex.errors.forEach(e => problem("lexicon " + e));
const MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g;
lex.words.forEach(w => {
  const syl = w.p.trim().split(/\s+/), n = [...w.h].length;
  if (!(syl.length === n || (w.h.endsWith("儿") && syl.length === n - 1))) problem("syllables don't match characters: " + w.id);
  syl.forEach(s => { const m = s.match(MARK); if (m && m.length > 1) problem("two tone marks in " + w.id); });
});

// Character dictionary: every character in every word and every name needs an entry
const dict = C.buildCharDict(lex, ctx.CHARS_RAW || []);
dict.errors.forEach(e => problem(e));
const needChars = new Set();
lex.words.forEach(w => Array.from(w.h).forEach(c => needChars.add(c)));
const missingChars = [];

// Text checks
const missing = {}, rows = [], ids = new Set();
const isKnown = (id) => lex.byId[id].level <= knownLevel;
ctx.TEXTS.forEach(t => {
  if (ids.has(t.id)) problem("duplicate text id " + t.id); ids.add(t.id);
  if (!C.CATS[t.cat]) problem(t.id + ": unknown category " + t.cat);
  ["title", "titleEn", "text", "en"].forEach(k => { if (!t[k] || !String(t[k]).trim()) problem(t.id + ": missing " + k); });
  const r = C.tokenize(t.text, lex);
  r.errors.forEach(e => {
    if (e.indexOf("not in lexicon: ") === 0) { const w = e.slice(16); (missing[w] = missing[w] || []).push(t.id); }
    else problem(t.id + ": " + e);
  });
  r.tokens.filter(x => x.t === "n").forEach(n => {
    if (n.py.trim().split(/\s+/).length !== [...n.h].length) problem(t.id + ": name pinyin doesn't match characters: " + n.h + " " + n.py);
  });
  const cov = C.coverage(r.tokens.filter(x => x.t === "w"), isKnown);
  const lvl = [0, 0, 0, 0, 0];
  r.tokens.forEach(x => { if (x.t === "w") lvl[lex.byId[x.id].level]++; });
  rows.push({ id: t.id, cat: t.cat, tokens: cov.total, chars: [...t.text.replace(/[\s{}|a-zǎ-ǜāáàēéěèīíìōóòūúù]/gi, "")].length, pct: cov.shown, band: C.bandOf(cov.shown).label, newWords: cov.unknownCount, lvl: lvl });
});

ctx.TEXTS.forEach(t => C.tokenize(t.text, lex).tokens.filter(x => x.t === "n").forEach(n => Array.from(n.h).forEach(c => needChars.add(c))));
needChars.forEach(c => { if (!dict.chars[c]) missingChars.push(c); });
if (missingChars.length) {
  say("\nCHARACTERS MISSING FROM THE DICTIONARY (" + missingChars.length + "), add to data/chars.js:");
  say("  " + missingChars.join(" "));
  problems += missingChars.length;
}

if (Object.keys(missing).length) {
  say("\nWORDS NOT IN THE LEXICON (add to data/extra.js or the right HSK file):");
  Object.keys(missing).forEach(w => say("  " + w + "   (in " + [...new Set(missing[w])].join(", ") + ")"));
  problems += Object.keys(missing).length;
}

say("\nCoverage assuming you know HSK 1" + (knownLevel > 1 ? "-" + knownLevel : knownLevel === 1 ? "" : " (nothing)") + ":");
say("id   cat       words  known%  band          new words   by level (1/2/3/other)");
rows.forEach(r => say(
  r.id.padEnd(5) + r.cat.padEnd(10) + String(r.tokens).padEnd(7) + (r.pct + "%").padEnd(8) + r.band.padEnd(14) +
  String(r.newWords).padEnd(12) + r.lvl.slice(1).join("/")));
const counts = {}; rows.forEach(r => counts[r.band] = (counts[r.band] || 0) + 1);
say("\nBands: " + Object.keys(counts).map(k => k + " " + counts[k]).join(", ") + "  |  " + rows.length + " texts");
say(problems ? "\n" + problems + " problem(s) found." : "\nAll good.");
process.exitCode = problems ? 1 : 0;
