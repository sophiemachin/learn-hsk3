/* Core logic for the HSK reader: no DOM, so it can be tested in node.
   Browser: exposes window.HSKCore. Node: module.exports. */
(function (root) {
  "use strict";

  var PUNCT = "，。！？、：；“”‘’（）…—《》·,.!?:;\"'()";
  var DEFAULT_CFG = { familiarAt: 3, secureAt: 8 };
  var BANDS = [
    { key: "easy", label: "Easy", min: 98 },
    { key: "comfortable", label: "Comfortable", min: 95 },
    { key: "stretch", label: "Stretch", min: 90 },
    { key: "challenge", label: "Challenge", min: 0 },
  ];
  var CATS = { story: "Story", dialogue: "Dialogue", news: "News", diary: "Diary", culture: "Culture" };
  var STATUSES = ["new", "seen", "familiar", "secure"];

  // ---------- Lexicon ----------
  // sources: [{ level: 1, lines: ["hanzi|pinyin|english", ...] }, ...] in priority order.
  function parseLexicon(sources) {
    var lex = { words: [], byId: {}, byHanzi: {}, errors: [] };
    sources.forEach(function (src) {
      (src.lines || []).forEach(function (line) {
        var p = line.split("|");
        if (p.length !== 3 || !p[0] || !p[1] || !p[2]) { lex.errors.push("malformed: " + line); return; }
        var id = p[0] + "|" + p[1];
        if (lex.byId[id]) { lex.errors.push("duplicate: " + id); return; }
        var w = { id: id, h: p[0], p: p[1], e: p[2], level: src.level };
        lex.byId[id] = w;
        lex.words.push(w);
        (lex.byHanzi[w.h] = lex.byHanzi[w.h] || []).push(w);
      });
    });
    return lex;
  }

  function levelLabel(level) { return level >= 1 && level <= 3 ? "HSK " + level : "Beyond HSK 3"; }

  // ---------- Character dictionary ----------
  // Single-character lexicon words give a default entry; lines in data/chars.js override or add to them.
  // Returns { chars: {ch: {h, p, e}}, errors: [] }.
  function buildCharDict(lex, lines) {
    var chars = {}, errors = [];
    lex.words.forEach(function (w) {
      if (Array.from(w.h).length === 1 && !chars[w.h]) chars[w.h] = { h: w.h, p: w.p, e: w.e };
    });
    var explicit = {};
    (lines || []).forEach(function (line) {
      var p = line.split("|");
      if (p.length !== 3 || !p[0] || !p[1] || !p[2] || Array.from(p[0]).length !== 1) { errors.push("malformed char line: " + line); return; }
      if (explicit[p[0]]) errors.push("duplicate char line: " + p[0]);
      explicit[p[0]] = true;
      chars[p[0]] = { h: p[0], p: p[1], e: p[2] };
    });
    return { chars: chars, errors: errors };
  }

  // Pinyin of each character as read in this word, or null when syllables and characters don't line up (erhua 儿).
  function charReadings(word) {
    var syl = word.p.trim().split(/\s+/), chs = Array.from(word.h);
    return syl.length === chs.length ? syl : null;
  }

  // Other lexicon words containing a character, lower HSK levels first.
  function wordsContaining(lex, ch, excludeId, limit) {
    return lex.words.filter(function (w) { return w.id !== excludeId && w.h.indexOf(ch) >= 0; })
      .sort(function (a, b) { return a.level - b.level || Array.from(a.h).length - Array.from(b.h).length; })
      .slice(0, limit || 5);
  }

  // ---------- Text tokenizer ----------
  // Token types: w = lexicon word {id, h, name?}, n = name not in lexicon {h, py},
  // p = punctuation, l = Latin/digit label (e.g. speaker "A"), br = line break, x = unknown word (error).
  function tokenize(text, lex) {
    var tokens = [], errors = [], nameMap = {};
    text.replace(/\{([^}|]+)\|([^}]+)\}/g, function (_, h, py) { nameMap[h] = py; return ""; });
    var i = 0, n = text.length;
    while (i < n) {
      var c = text.charAt(i);
      if (c === "\n") { tokens.push({ t: "br" }); i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === "{") {
        var end = text.indexOf("}", i);
        if (end < 0) { errors.push("unclosed { near: " + text.slice(i, i + 10)); break; }
        var parts = text.slice(i + 1, end).split("|");
        var nh = parts[0];
        i = end + 1;
        var hit = lex.byHanzi[nh];
        if (hit) tokens.push({ t: "w", h: nh, id: hit[0].id, name: true });
        else if (nameMap[nh]) tokens.push({ t: "n", h: nh, py: nameMap[nh] });
        else { errors.push("name without pinyin: " + nh); tokens.push({ t: "x", h: nh }); }
        continue;
      }
      if (PUNCT.indexOf(c) >= 0) { tokens.push({ t: "p", h: c }); i++; continue; }
      var j = i;
      while (j < n && !/\s/.test(text.charAt(j)) && text.charAt(j) !== "{" && PUNCT.indexOf(text.charAt(j)) < 0) j++;
      var run = text.slice(i, j);
      i = j;
      var bits = run.split("=");
      var h = bits[0];
      if (/^[A-Za-z0-9]+$/.test(h)) { tokens.push({ t: "l", h: h }); continue; }
      var cands = lex.byHanzi[h];
      if (!cands) { errors.push("not in lexicon: " + h); tokens.push({ t: "x", h: h }); continue; }
      var pick = cands[0];
      if (bits[1]) {
        pick = cands.filter(function (w) { return w.p.replace(/\s+/g, "") === bits[1]; })[0];
        if (!pick) { errors.push("no reading " + bits[1] + " for " + h); pick = cands[0]; }
      }
      tokens.push({ t: "w", h: h, id: pick.id });
    }
    return { tokens: tokens, errors: errors };
  }

  // ---------- Word status ----------
  function cfgOf(cfg) { return Object.assign({}, DEFAULT_CFG, cfg || {}); }

  function statusOf(rec, cfg) {
    cfg = cfgOf(cfg);
    if (!rec) return "new";
    if (rec.clean >= cfg.secureAt) return "secure";
    if (rec.clean >= cfg.familiarAt) return "familiar";
    if (rec.exp >= 1) return "seen";
    return "new";
  }
  function isKnownStatus(s) { return s === "familiar" || s === "secure"; }

  function newState() { return { v: 1, words: {}, reads: {}, days: {}, settings: {} }; }
  // Reads the text of a progress file. Returns { state } or { error } (a message fit to show the user).
  function parseSavedState(text) {
    function isObj(x) { return x !== null && typeof x === "object" && !Array.isArray(x); }
    function num(x) { return typeof x === "number" && isFinite(x) && x >= 0; }
    var s;
    try { s = JSON.parse(text); } catch (e) { return { error: "That file isn't valid JSON." }; }
    if (!isObj(s) || !isObj(s.words) || !isObj(s.reads) || !isObj(s.days)) return { error: "That doesn't look like a progress file from this reader." };
    var bad = Object.keys(s.words).some(function (k) { var r = s.words[k]; return !isObj(r) || !num(r.exp) || !num(r.clean) || !num(r.looks); }) ||
      Object.keys(s.reads).some(function (k) { var r = s.reads[k]; return !isObj(r) || !num(r.n); }) ||
      Object.keys(s.days).some(function (k) { var r = s.days[k]; return !isObj(r) || !num(r.texts) || !num(r.words); });
    if (bad) return { error: "That progress file has damaged entries, so it wasn't imported." };
    s.settings = isObj(s.settings) ? s.settings : {};
    s.v = 1;
    return { state: s };
  }
  function statusById(state, id, cfg) { return statusOf(state.words[id], cfg); }
  function isKnown(state, id, cfg) { return isKnownStatus(statusById(state, id, cfg)); }

  // Change the familiar / secure thresholds. Raising them must not quietly demote words the learner already
  // knows (or assumed from the starting level), so any word whose status would drop keeps it: its clean count
  // is lifted to the new threshold. Lowering them simply promotes words that now qualify.
  // Returns { raised } (words kept at their status) or { error } with the state untouched.
  function changeThresholds(state, familiarAt, secureAt) {
    var f = Number(familiarAt), s = Number(secureAt);
    if (!Number.isInteger(f) || !Number.isInteger(s) || f < 1 || s <= f || s > 50)
      return { error: "Familiar must be a whole number from 1 up, and secure must be higher than familiar (at most 50)." };
    var oldCfg = cfgOf(state.settings), newCfg = { familiarAt: f, secureAt: s };
    var rank = { "new": 0, seen: 1, familiar: 2, secure: 3 }, raised = 0;
    Object.keys(state.words).forEach(function (id) {
      var rec = state.words[id], before = statusOf(rec, oldCfg), after = statusOf(rec, newCfg);
      if (rank[after] < rank[before]) { rec.clean = Math.max(rec.clean, before === "secure" ? s : f); raised++; }
    });
    state.settings.familiarAt = f;
    state.settings.secureAt = s;
    return { raised: raised };
  }

  // Manual override: set counters to match the chosen status.
  function setStatus(state, id, status, cfg) {
    cfg = cfgOf(cfg);
    var rec = state.words[id];
    if (status === "new") { delete state.words[id]; return; }
    if (!rec) rec = state.words[id] = { exp: 0, clean: 0, looks: 0 };
    rec.exp = Math.max(rec.exp, 1);
    rec.clean = status === "seen" ? 0 : status === "familiar" ? cfg.familiarAt : cfg.secureAt;
    delete rec.base;   // an explicit choice is real information, not an assumption
  }
  function bulkSet(state, ids, status, cfg) { ids.forEach(function (id) { setStatus(state, id, status, cfg); }); }

  // Starting level: assume the learner knows every word up to `level`. Words assumed this way carry
  // base:true until real activity (a lookup, a finished text, a manual choice) clears it. Changing the level
  // later raises or lowers only those assumed words, so real progress is never undone.
  function applyBaseline(state, words, level, cfg) {
    cfg = cfgOf(cfg);
    words.forEach(function (w) {
      var rec = state.words[w.id], s = statusOf(rec, cfg);
      if (w.level <= level) {
        if (s === "new" || s === "seen") { setStatus(state, w.id, "familiar", cfg); state.words[w.id].base = true; }
      } else if (rec && rec.base) {
        delete state.words[w.id];
      }
    });
    state.settings.startLevel = level;
  }

  // ---------- Reading sessions ----------
  // session = { looked: {} } maps id -> previous record (or null) for words tapped in this reading.
  function newSession() { return { looked: {} }; }

  // Tapping a word counts as a lookup, once per word per reading. Returns true if it counted.
  function lookup(state, id, session) {
    if (Object.prototype.hasOwnProperty.call(session.looked, id)) return false;
    var prev = state.words[id] ? Object.assign({}, state.words[id]) : null;
    var rec = state.words[id] || (state.words[id] = { exp: 0, clean: 0, looks: 0 });
    rec.looks++;
    rec.clean = Math.floor(rec.clean / 2);
    rec.exp = Math.max(rec.exp, 1);
    delete rec.base;
    session.looked[id] = prev;
    return true;
  }

  // "I knew this": undo the lookup made earlier in this reading.
  function undoLookup(state, id, session) {
    if (!Object.prototype.hasOwnProperty.call(session.looked, id)) return false;
    var prev = session.looked[id];
    if (prev) state.words[id] = prev; else delete state.words[id];
    delete session.looked[id];
    return true;
  }

  function uniqueWordIds(tokens) {
    var seen = {}, out = [];
    tokens.forEach(function (t) { if (t.t === "w" && !seen[t.id]) { seen[t.id] = 1; out.push(t.id); } });
    return out;
  }

  // Finishing a text: each unique word gets exp+1, and clean+1 unless it was looked up.
  // A text only counts once per day. Returns { counted, changes: [{id, from, to}] }.
  function finishText(state, textId, tokens, session, cfg, today) {
    var r = state.reads[textId];
    if (r && r.last === today) return { counted: false, changes: [] };
    var ids = uniqueWordIds(tokens), changes = [];
    ids.forEach(function (id) {
      var before = statusById(state, id, cfg);
      var rec = state.words[id] || (state.words[id] = { exp: 0, clean: 0, looks: 0 });
      rec.exp++;
      delete rec.base;
      if (!Object.prototype.hasOwnProperty.call(session.looked, id)) rec.clean++;
      var after = statusById(state, id, cfg);
      if (before !== after) changes.push({ id: id, from: before, to: after });
    });
    state.reads[textId] = { n: (r ? r.n : 0) + 1, last: today };
    var d = state.days[today] || (state.days[today] = { texts: 0, words: 0 });
    d.texts++;
    d.words += ids.length;
    return { counted: true, changes: changes };
  }

  // ---------- Coverage and bands ----------
  // Share of word tokens (repeats count) that the learner knows. Names/punctuation/labels are excluded.
  function coverage(tokens, knownFn) {
    var total = 0, known = 0, unk = {};
    tokens.forEach(function (t) {
      if (t.t !== "w") return;
      total++;
      if (knownFn(t.id)) known++; else unk[t.id] = (unk[t.id] || 0) + 1;
    });
    var pct = total ? (known / total) * 100 : 100;
    var ids = Object.keys(unk);
    return { total: total, known: known, pct: pct, shown: Math.floor(pct), unknownIds: ids, unknownCount: ids.length };
  }

  function bandOf(shownPct) {
    for (var i = 0; i < BANDS.length; i++) if (shownPct >= BANDS[i].min) return BANDS[i];
    return BANDS[BANDS.length - 1];
  }

  // ---------- Dates and streaks ----------
  function ymd(d) {
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }
  // Consecutive days (ending today, or yesterday if nothing read yet today) with a finished text.
  function streak(state, todayStr) {
    var p = todayStr.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var has = function (dt) { var x = state.days[ymd(dt)]; return x && x.texts > 0; };
    if (!has(d)) d.setDate(d.getDate() - 1);
    var n = 0;
    while (has(d)) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  var api = {
    PUNCT: PUNCT, DEFAULT_CFG: DEFAULT_CFG, BANDS: BANDS, CATS: CATS, STATUSES: STATUSES,
    parseLexicon: parseLexicon, levelLabel: levelLabel, tokenize: tokenize,
    buildCharDict: buildCharDict, charReadings: charReadings, wordsContaining: wordsContaining,
    statusOf: statusOf, isKnownStatus: isKnownStatus, newState: newState, parseSavedState: parseSavedState, changeThresholds: changeThresholds, statusById: statusById, isKnown: isKnown,
    setStatus: setStatus, bulkSet: bulkSet, applyBaseline: applyBaseline, newSession: newSession, lookup: lookup, undoLookup: undoLookup,
    uniqueWordIds: uniqueWordIds, finishText: finishText, coverage: coverage, bandOf: bandOf, ymd: ymd, streak: streak,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.HSKCore = api;
})(typeof window !== "undefined" ? window : this);
