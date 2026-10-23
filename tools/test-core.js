// Run from the project root:  node tools/test-core.js
const fs = require("fs"), vm = require("vm"), path = require("path"), assert = require("assert");
const root = path.join(__dirname, "..");
const C = require(path.join(root, "core.js"));

const ctx = {}; vm.createContext(ctx);
for (const f of ["hsk1", "hsk2", "hsk3", "extra"]) vm.runInContext(fs.readFileSync(path.join(root, "data", f + ".js"), "utf8"), ctx);
const lex = C.parseLexicon([
  { level: 1, lines: ctx.HSK1_RAW }, { level: 2, lines: ctx.HSK2_RAW },
  { level: 3, lines: ctx.HSK3_RAW }, { level: 4, lines: ctx.EXTRA_RAW },
]);

let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log("ok   " + name); } catch (e) { console.log("FAIL " + name + "\n     " + e.message); process.exitCode = 1; } }
const id = (h, i) => lex.byHanzi[h][i || 0].id;

test("lexicon loads with no errors", () => {
  assert.deepStrictEqual(lex.errors, []);
  assert.ok(lex.words.length > 590, "words: " + lex.words.length);
  assert.strictEqual(lex.byId[id("你好")].level, 1);
});

test("tokenizer: words, punctuation, line breaks, labels", () => {
  const r = C.tokenize("A：你好！\nB：我 是 老师。", lex);
  assert.deepStrictEqual(r.errors, []);
  assert.deepStrictEqual(r.tokens.map(t => t.t), ["l", "p", "w", "p", "br", "l", "p", "w", "w", "w", "p"]);
});

test("tokenizer: names with and without pinyin, reuse by name", () => {
  const r = C.tokenize("{小明|xiǎo míng} 说：“你好。”{小明} 笑 了。", lex);
  assert.deepStrictEqual(r.errors, []);
  const names = r.tokens.filter(t => t.t === "n");
  assert.strictEqual(names.length, 2);
  assert.strictEqual(names[1].py, "xiǎo míng");
});

test("tokenizer: a name that is also a word counts as a word, underlined", () => {
  const r = C.tokenize("{北京} 很 大。", lex);
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.tokens[0].t, "w");
  assert.strictEqual(r.tokens[0].name, true);
});

test("tokenizer: reading selection with =", () => {
  const a = C.tokenize("长", lex).tokens[0], b = C.tokenize("长=zhǎng", lex).tokens[0];
  assert.strictEqual(a.id, "长|cháng");
  assert.strictEqual(b.id, "长|zhǎng");
});

test("tokenizer: reports unknown words and nameless names", () => {
  const r = C.tokenize("你 龘 {某某}", lex);
  assert.strictEqual(r.errors.length, 2);
});

test("coverage counts repeats, skips names/punctuation/labels", () => {
  const r = C.tokenize("A：我 爱 你，我 爱 {小红|xiǎo hóng}。", lex);
  const known = new Set([id("我"), id("你")]);
  const c = C.coverage(r.tokens, x => known.has(x));
  assert.strictEqual(c.total, 5);       // 我 爱 你 我 爱
  assert.strictEqual(c.known, 3);       // 我 你 我
  assert.strictEqual(c.shown, 60);
  assert.deepStrictEqual(c.unknownIds, [id("爱")]);
});

test("coverage of an empty text is 100", () => {
  assert.strictEqual(C.coverage([], () => false).shown, 100);
});

test("bands", () => {
  assert.strictEqual(C.bandOf(100).key, "easy");
  assert.strictEqual(C.bandOf(98).key, "easy");
  assert.strictEqual(C.bandOf(97).key, "comfortable");
  assert.strictEqual(C.bandOf(95).key, "comfortable");
  assert.strictEqual(C.bandOf(94).key, "stretch");
  assert.strictEqual(C.bandOf(90).key, "stretch");
  assert.strictEqual(C.bandOf(89).key, "challenge");
});

test("status thresholds", () => {
  assert.strictEqual(C.statusOf(undefined), "new");
  assert.strictEqual(C.statusOf({ exp: 1, clean: 0, looks: 0 }), "seen");
  assert.strictEqual(C.statusOf({ exp: 3, clean: 2, looks: 0 }), "seen");
  assert.strictEqual(C.statusOf({ exp: 3, clean: 3, looks: 0 }), "familiar");
  assert.strictEqual(C.statusOf({ exp: 8, clean: 8, looks: 0 }), "secure");
  assert.strictEqual(C.statusOf({ exp: 8, clean: 4, looks: 0 }, { familiarAt: 5 }), "seen");
});

test("manual set status", () => {
  const s = C.newState(), w = id("书");
  C.setStatus(s, w, "familiar"); assert.strictEqual(C.statusById(s, w), "familiar");
  C.setStatus(s, w, "secure"); assert.strictEqual(C.statusById(s, w), "secure");
  C.setStatus(s, w, "familiar"); assert.strictEqual(C.statusById(s, w), "familiar");
  C.setStatus(s, w, "seen"); assert.strictEqual(C.statusById(s, w), "seen");
  C.setStatus(s, w, "new"); assert.strictEqual(C.statusById(s, w), "new");
  assert.ok(!(w in s.words));
});

test("lookup halves clean, counts once per reading, and can be undone", () => {
  const s = C.newState(), w = id("书"), sess = C.newSession();
  C.setStatus(s, w, "secure");               // clean 8
  assert.strictEqual(C.lookup(s, w, sess), true);
  assert.strictEqual(s.words[w].clean, 4);   // secure -> familiar
  assert.strictEqual(C.statusById(s, w), "familiar");
  assert.strictEqual(C.lookup(s, w, sess), false);   // second tap ignored
  assert.strictEqual(s.words[w].clean, 4);
  assert.strictEqual(C.undoLookup(s, w, sess), true);
  assert.strictEqual(C.statusById(s, w), "secure");
  assert.strictEqual(s.words[w].looks, 0);
});

test("lookup of a brand-new word makes it 'seen'; undo removes it again", () => {
  const s = C.newState(), w = id("汉语"), sess = C.newSession();
  C.lookup(s, w, sess);
  assert.strictEqual(C.statusById(s, w), "seen");
  C.undoLookup(s, w, sess);
  assert.strictEqual(C.statusById(s, w), "new");
});

test("finishing a text: clean words climb, looked-up words don't, once per day", () => {
  const s = C.newState(), sess = C.newSession();
  const tk = C.tokenize("我 爱 你 我 爱 你", lex).tokens;
  const [a, b, c] = [id("我"), id("爱"), id("你")];
  C.lookup(s, b, sess);
  let r = C.finishText(s, "t1", tk, sess, null, "2026-10-20");
  assert.strictEqual(r.counted, true);
  assert.strictEqual(s.words[a].exp, 1);     // unique per text, not per repeat
  assert.strictEqual(s.words[a].clean, 1);
  assert.strictEqual(s.words[b].clean, 0);   // looked up, so no clean credit
  assert.strictEqual(s.reads.t1.n, 1);
  assert.deepStrictEqual(s.days["2026-10-20"], { texts: 1, words: 3 });
  r = C.finishText(s, "t1", tk, C.newSession(), null, "2026-10-20");
  assert.strictEqual(r.counted, false);      // same day: not counted again
  assert.strictEqual(s.words[a].clean, 1);
  r = C.finishText(s, "t1", tk, C.newSession(), null, "2026-10-21");
  assert.strictEqual(r.counted, true);
  assert.strictEqual(s.reads.t1.n, 2);
});

test("finishing reports status changes", () => {
  const s = C.newState(), tk = C.tokenize("书", lex).tokens, w = id("书");
  let last;
  for (let d = 1; d <= 3; d++) last = C.finishText(s, "t", tk, C.newSession(), null, "2026-10-0" + d);
  assert.deepStrictEqual(last.changes, [{ id: w, from: "seen", to: "familiar" }]);
});

test("known-word lookup follows status", () => {
  const s = C.newState(), w = id("书");
  assert.strictEqual(C.isKnown(s, w), false);
  C.setStatus(s, w, "seen"); assert.strictEqual(C.isKnown(s, w), false);
  C.setStatus(s, w, "familiar"); assert.strictEqual(C.isKnown(s, w), true);
});

test("bulkSet marks a whole level", () => {
  const s = C.newState();
  C.bulkSet(s, lex.words.filter(w => w.level <= 2).map(w => w.id), "familiar");
  assert.ok(C.isKnown(s, id("你好")) && C.isKnown(s, id("帮助")));
  assert.ok(!C.isKnown(s, id("阿姨")));
});

test("streak", () => {
  const s = C.newState();
  assert.strictEqual(C.streak(s, "2026-10-20"), 0);
  s.days["2026-10-19"] = { texts: 1, words: 5 };
  assert.strictEqual(C.streak(s, "2026-10-20"), 1);   // yesterday still counts until today ends
  s.days["2026-10-20"] = { texts: 2, words: 9 };
  s.days["2026-10-18"] = { texts: 1, words: 4 };
  assert.strictEqual(C.streak(s, "2026-10-20"), 3);
  s.days["2026-10-16"] = { texts: 1, words: 4 };      // gap on the 17th
  assert.strictEqual(C.streak(s, "2026-10-20"), 3);
});

test("ymd formats local dates", () => {
  assert.strictEqual(C.ymd(new Date(2026, 0, 5)), "2026-01-05");
});

test("character dictionary: single-char words give defaults, chars.js overrides", () => {
  const d = C.buildCharDict(lex, ["好|hǎo|very good", "电|diàn|electricity"]);
  assert.deepStrictEqual(d.errors, []);
  assert.strictEqual(d.chars["好"].e, "very good");        // overridden
  assert.strictEqual(d.chars["我"].p, "wǒ");               // from the word list
  assert.strictEqual(d.chars["电"].e, "electricity");
});

test("character dictionary: reports bad and duplicate lines", () => {
  const d = C.buildCharDict(lex, ["电|diàn", "电脑|diàn nǎo|computer", "电|diàn|a", "电|diàn|b"]);
  assert.strictEqual(d.errors.length, 3);
});

test("the shipped chars.js covers every character in the lexicon", () => {
  vm.runInContext(fs.readFileSync(path.join(root, "data", "chars.js"), "utf8"), ctx);
  const d = C.buildCharDict(lex, ctx.CHARS_RAW);
  assert.deepStrictEqual(d.errors, []);
  const missing = new Set();
  lex.words.forEach(w => Array.from(w.h).forEach(c => { if (!d.chars[c]) missing.add(c); }));
  assert.deepStrictEqual([...missing], []);
});

test("charReadings splits pinyin per character, null for erhua", () => {
  assert.deepStrictEqual(C.charReadings(lex.byId[id("电脑")]), ["diàn", "nǎo"]);
  assert.strictEqual(C.charReadings(lex.byId[id("一会儿")]), null);
});

test("wordsContaining: excludes itself, lower levels first, honours limit", () => {
  const r = C.wordsContaining(lex, "电", id("电脑"), 3);
  assert.strictEqual(r.length, 3);
  assert.ok(!r.some(w => w.id === id("电脑")));
  assert.ok(r.every(w => w.h.includes("电")));
  assert.ok(r[0].level <= r[2].level);
});

test("starting level can be raised and lowered again", () => {
  const s = C.newState(), nw = id => C.statusById(s, id);
  C.applyBaseline(s, lex.words, 3);
  assert.ok(C.isKnown(s, id("你好")) && C.isKnown(s, id("阿姨")));
  C.applyBaseline(s, lex.words, 2);
  assert.ok(C.isKnown(s, id("你好")) && !C.isKnown(s, id("阿姨")), "HSK3 word is unknown again");
  assert.strictEqual(nw(id("阿姨")), "new");
  C.applyBaseline(s, lex.words, 0);
  assert.ok(!C.isKnown(s, id("你好")));
  assert.strictEqual(s.settings.startLevel, 0);
});

test("starting level never undoes real progress", () => {
  const s = C.newState();
  C.applyBaseline(s, lex.words, 2);
  const tk = C.tokenize("你好", lex).tokens;
  C.finishText(s, "t", tk, C.newSession(), null, "2026-10-20");   // real reading clears the assumption
  C.setStatus(s, id("书"), "secure");                              // manual choice too
  C.applyBaseline(s, lex.words, 0);
  assert.ok(C.isKnown(s, id("你好")), "read word stays known");
  assert.strictEqual(C.statusById(s, id("书")), "secure");
  assert.ok(!C.isKnown(s, id("帮助")), "untouched assumed word goes back to new");
});

test("a lookup also clears the assumption", () => {
  const s = C.newState(), sess = C.newSession();
  C.applyBaseline(s, lex.words, 2);
  C.lookup(s, id("书"), sess);
  assert.ok(!("base" in s.words[id("书")]));
});

test("progress file: a saved state round-trips through JSON", () => {
  const s = C.newState();
  C.applyBaseline(s, lex.words, 1);
  C.finishText(s, "t", C.tokenize("书", lex).tokens, C.newSession(), null, "2026-10-20");
  const r = C.parseSavedState(JSON.stringify(s));
  assert.strictEqual(r.error, undefined);
  assert.deepStrictEqual(r.state, s);
  assert.ok(C.isKnown(r.state, id("你好")));
});

test("progress file: rejects bad JSON, wrong shape and damaged entries", () => {
  assert.ok(C.parseSavedState("not json").error);
  assert.ok(C.parseSavedState("[]").error);
  assert.ok(C.parseSavedState('{"words":{}}').error);
  assert.ok(C.parseSavedState('{"words":{"a|b":{"exp":"x","clean":0,"looks":0}},"reads":{},"days":{}}').error);
  assert.ok(C.parseSavedState('{"words":{},"reads":{"t":{"n":-1}},"days":{}}').error);
  const ok = C.parseSavedState('{"words":{},"reads":{},"days":{}}');
  assert.deepStrictEqual(ok.state.settings, {});   // settings are filled in when missing
});

test("thresholds: raising them never demotes a word", () => {
  const s = C.newState(), [a, b, c] = [id("书"), id("水"), id("茶")];
  C.setStatus(s, a, "seen"); C.setStatus(s, b, "familiar"); C.setStatus(s, c, "secure");
  const r = C.changeThresholds(s, 5, 12);
  assert.strictEqual(r.error, undefined);
  assert.strictEqual(r.raised, 2);                       // the familiar and the secure word were lifted
  const cfg = { familiarAt: 5, secureAt: 12 };
  assert.strictEqual(C.statusById(s, a, cfg), "seen");
  assert.strictEqual(C.statusById(s, b, cfg), "familiar");
  assert.strictEqual(C.statusById(s, c, cfg), "secure");
  assert.deepStrictEqual([s.settings.familiarAt, s.settings.secureAt], [5, 12]);
});

test("thresholds: lowering them promotes words that now qualify", () => {
  const s = C.newState(), w = id("书");
  C.finishText(s, "t", C.tokenize("书", lex).tokens, C.newSession(), null, "2026-10-01");
  C.finishText(s, "t", C.tokenize("书", lex).tokens, C.newSession(), null, "2026-10-02");
  assert.strictEqual(C.statusById(s, w), "seen");        // clean 2 of 3
  assert.strictEqual(C.changeThresholds(s, 2, 8).raised, 0);
  assert.strictEqual(C.statusById(s, w, { familiarAt: 2, secureAt: 8 }), "familiar");
});

test("thresholds: assumed starting-level words stay known after raising", () => {
  const s = C.newState();
  C.applyBaseline(s, lex.words, 2);
  C.changeThresholds(s, 6, 15);
  const cfg = { familiarAt: 6, secureAt: 15 };
  assert.ok(C.isKnown(s, id("你好"), cfg));
  assert.ok(s.words[id("你好")].base, "still marked as assumed");
});

test("thresholds: bad values are refused and change nothing", () => {
  const s = C.newState();
  for (const [f, x] of [[0, 8], [3, 3], [5, 4], [2.5, 8], ["a", 8], [3, 99]]) {
    assert.ok(C.changeThresholds(s, f, x).error, f + "," + x);
  }
  assert.deepStrictEqual(s.settings, {});
});

console.log("\n" + passed + " passed" + (process.exitCode ? ", some FAILED" : ""));
