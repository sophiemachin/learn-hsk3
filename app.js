/* HSK reader UI.
   Step 5: progress saved in localStorage, lookups + finish-reading, status buttons, highlights, onboarding. */
(function () {
  "use strict";
  var C = window.HSKCore;

  // ---------- Data ----------
  var lex = C.parseLexicon([
    { level: 1, lines: HSK1_RAW }, { level: 2, lines: HSK2_RAW },
    { level: 3, lines: HSK3_RAW }, { level: 4, lines: EXTRA_RAW },
  ]);
  var texts = TEXTS.map(function (t) {
    return Object.assign({}, t, { tokens: C.tokenize(t.text, lex).tokens });
  });
  var charDict = C.buildCharDict(lex, window.CHARS_RAW || []).chars;
  var textById = {};
  texts.forEach(function (t) { textById[t.id] = t; });

  // ---------- Saved state ----------
  var KEY = "hsk3-reader-v1";
  var warned = false;
  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.words && s.reads && s.days) { s.settings = s.settings || {}; return s; }
    } catch (e) { /* storage blocked or corrupt: start fresh */ }
    return C.newState();
  }
  var state = loadState();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) {
      if (!warned) { warned = true; toast("Couldn't save your progress (browser storage is blocked). It will be lost when you close this page."); }
    }
  }
  function cfg() {
    var s = state.settings;
    return { familiarAt: s.familiarAt || C.DEFAULT_CFG.familiarAt, secureAt: s.secureAt || C.DEFAULT_CFG.secureAt };
  }
  function statusOf(id) { return C.statusById(state, id, cfg()); }
  function knownFn(id) { return C.isKnown(state, id, cfg()); }

  var st0 = state.settings;
  var ui = { pinyin: st0.pinyin || "on", fs: st0.fs || 1.7, hl: st0.hl !== false, english: false };
  function savePrefs() { state.settings.pinyin = ui.pinyin; state.settings.fs = ui.fs; state.settings.hl = ui.hl; save(); }
  var PINYIN_MODES = [["on", "Pinyin: On"], ["new", "Pinyin: New words"], ["off", "Pinyin: Off"]];

  // ---------- Helpers ----------
  var $ = function (s) { return document.querySelector(s); };
  var view = $("#view"), sheet = $("#sheet"), backdrop = $("#backdrop");
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function coverageOf(t) { return C.coverage(t.tokens, knownFn); }
  function plural(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function statLine(cov) { return '<span class="pct">' + cov.shown + '% known</span> · ' + plural(cov.unknownCount, "new word"); }
  function bandPill(cov) { var b = C.bandOf(cov.shown); return '<span class="pill ' + b.key + '">' + b.label + "</span>"; }
  function today() { return C.ymd(new Date()); }

  function toast(msg) {
    var t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.hidden = true; }, 5000);
  }
  function speak(text) {
    if (!("speechSynthesis" in window)) { toast("Your browser can't read aloud."); return; }
    var u = new SpeechSynthesisUtterance(text); u.lang = "zh-CN"; u.rate = 0.8;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }

  // ---------- Library ----------
  var START = [[0, "I'm a beginner"], [1, "I know HSK 1"], [2, "I know HSK 1–2"], [3, "I know HSK 1–3"]];

  function applyStart(level) {
    C.applyBaseline(state, lex.words, level, cfg());
    state.settings.onboarded = true;
    save(); renderLibrary();
  }

  function onboardingHtml() {
    return '<div class="onboard"><h2>Where are you starting?</h2>' +
      '<p class="muted">Your percentages are worked out from the words you know. Pick the closest level and I\'ll treat those words as familiar. You can change this any time: words you have actually read or marked yourself are never undone.</p>' +
      '<div class="start-row">' + START.map(function (s) {
        var cur = state.settings.startLevel;
        var attr = cur === undefined ? (s[0] === 2 ? ' class="primary"' : "") : ' aria-pressed="' + (s[0] === cur) + '"';
        return '<button data-start="' + s[0] + '"' + attr + ">" + s[1] + "</button>";
      }).join("") + "</div></div>";
  }

  // Category filter: hidden categories are saved in settings.hideCats.
  function hiddenCats() { return state.settings.hideCats || []; }
  function toggleCat(c) {
    var h = hiddenCats().slice(), i = h.indexOf(c);
    if (i >= 0) h.splice(i, 1); else h.push(c);
    state.settings.hideCats = h; save(); renderLibrary();
  }
  function filtersHtml(hide) {
    var cats = Object.keys(C.CATS);
    var chips = cats.map(function (c) {
      var n = texts.filter(function (t) { return t.cat === c; }).length, on = hide.indexOf(c) < 0;
      return '<button class="fchip" data-cat="' + c + '" aria-pressed="' + on + '">' + (on ? "✓ " : "") + esc(C.CATS[c]) + " " + n + "</button>";
    }).join("");
    var nh = cats.filter(function (c) { return hide.indexOf(c) >= 0; }).length;
    var hb = hiddenBands();
    var bandChips = C.BANDS.map(function (b) {
      var n = texts.filter(function (t) { return C.bandOf(coverageOf(t).shown).key === b.key; }).length, on = hb.indexOf(b.key) < 0;
      return '<button class="fchip" data-band="' + b.key + '" aria-pressed="' + on + '">' + (on ? "✓ " : "") + esc(b.label) + " " + n + "</button>";
    }).join("");
    var nb = C.BANDS.filter(function (b) { return hb.indexOf(b.key) >= 0; }).length;
    var unread = !!state.settings.unreadOnly;
    return '<div class="filters"><div class="frow" role="group" aria-label="Show categories">' + chips + "</div>" +
      (nh ? '<p class="muted fnote">' + nh + " of " + cats.length + " categories hidden</p>" : "") +
      '<div class="frow frow2" role="group" aria-label="Show difficulty levels">' + bandChips + "</div>" +
      (nb ? '<p class="muted fnote">' + nb + " of " + C.BANDS.length + " difficulty levels hidden</p>" : "") +
      '<div class="frow frow2"><button class="fchip" data-unread="1" aria-pressed="' + unread + '">' + (unread ? "✓ " : "") + "Unread only</button></div></div>";
  }

  // Difficulty filter (settings.hideBands) and unread-only toggle (settings.unreadOnly).
  function hiddenBands() { return state.settings.hideBands || []; }
  function toggleBand(k) {
    var h = hiddenBands().slice(), i = h.indexOf(k);
    if (i >= 0) h.splice(i, 1); else h.push(k);
    state.settings.hideBands = h; save(); renderLibrary();
  }
  function toggleUnread() { state.settings.unreadOnly = !state.settings.unreadOnly; save(); renderLibrary(); }

  // Sort (settings.sort: "library" | "easiest" | "hardest") and the filtered, sorted list of texts.
  var SORTS = [["library", "Library order"], ["easiest", "Easiest first"], ["hardest", "Hardest first"]];
  function visibleTexts() {
    var hide = hiddenCats(), hb = hiddenBands(), unread = !!state.settings.unreadOnly, sort = state.settings.sort || "library";
    var list = texts.map(function (t, i) { return { t: t, i: i, pct: coverageOf(t).pct }; }).filter(function (x) {
      return hide.indexOf(x.t.cat) < 0 &&
        hb.indexOf(C.bandOf(Math.floor(x.pct)).key) < 0 &&
        !(unread && state.reads[x.t.id]);
    });
    if (sort === "easiest") list.sort(function (a, b) { return b.pct - a.pct || a.i - b.i; });
    else if (sort === "hardest") list.sort(function (a, b) { return a.pct - b.pct || a.i - b.i; });
    return list.map(function (x) { return x.t; });
  }
  function sortHtml() {
    var cur = state.settings.sort || "library";
    return '<div class="frow frow2 sortrow"><label class="muted">Sort <select id="sortSel">' +
      SORTS.map(function (s) { return '<option value="' + s[0] + '"' + (s[0] === cur ? " selected" : "") + ">" + s[1] + "</option>"; }).join("") +
      '</select></label><button class="fchip" id="surprise">🎲 Surprise me</button></div>';
  }

  function renderLibrary() {
    current = null; session = null;
    var hide = hiddenCats();
    var visible = visibleTexts();
    var cards = visible.map(function (t) {
      var cov = coverageOf(t), r = state.reads[t.id];
      return '<a class="card" href="#text/' + t.id + '">' +
        '<div class="title zh" lang="zh">' + esc(t.title) + "</div>" +
        '<div class="sub">' + esc(t.titleEn) + "</div>" +
        '<div class="row">' + bandPill(cov) + '<span class="pill cat">' + esc(C.CATS[t.cat]) + "</span>" +
        "<span>" + statLine(cov) + "</span>" +
        (r ? '<span class="pill cat">Read ×' + r.n + "</span>" : "") + "</div></a>";
    }).join("");
    view.innerHTML =
      (state.settings.onboarded ? "" : onboardingHtml()) +
      '<p class="intro muted">Pick a text. The percentage is how many of its words you already know.</p>' +
      filtersHtml(hide) + sortHtml() +
      '<div class="list">' + (cards || '<p class="muted">No texts match your filters. Tap a chip above to show more.</p>') + "</div>" +
      '<p class="muted foot">' + (state.settings.onboarded ? '<button class="linkbtn" id="redo">Change my starting level</button> · ' : "") +
      '<button class="linkbtn" id="wipe">Erase all my progress</button></p>';
    var redo = $("#redo");
    if (redo) redo.onclick = function () { state.settings.onboarded = false; save(); renderLibrary(); };
    $("#sortSel").onchange = function () { state.settings.sort = this.value; save(); renderLibrary(); };
    $("#surprise").onclick = function () {
      var v = visibleTexts();
      if (!v.length) { toast("No texts match your filters, so there's nothing to pick from."); return; }
      location.hash = "text/" + v[Math.floor(Math.random() * v.length)].id;
    };
    $("#wipe").onclick = function () {
      if (!confirm("Erase ALL your progress on this device? This can't be undone.")) return;
      state = C.newState();
      ui.pinyin = "on"; ui.fs = 1.7; ui.hl = true;
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      renderLibrary();
    };
  }

  view.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-start]") : null;
    if (b) { applyStart(parseInt(b.dataset.start, 10)); return; }
    var c = e.target.closest ? e.target.closest("[data-cat]") : null;
    if (c) { toggleCat(c.dataset.cat); return; }
    var bd = e.target.closest ? e.target.closest("[data-band]") : null;
    if (bd) { toggleBand(bd.dataset.band); return; }
    if (e.target.closest && e.target.closest("[data-unread]")) toggleUnread();
  });

  // ---------- Words tab ----------
  // Filters live in memory only (they reset on reload): none selected in a group means "show all".
  var wf = { q: "", status: [], level: [] }, onWords = false;
  var WLEVELS = [[1, "HSK 1"], [2, "HSK 2"], [3, "HSK 3"], [4, "Beyond"]];
  function plain(s) { return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "").toLowerCase(); }
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

  function filteredWords() {
    var q = wf.q.trim().toLowerCase(), qp = plain(wf.q);
    return lex.words.filter(function (w) {
      if (wf.level.length && wf.level.indexOf(w.level) < 0) return false;
      if (wf.status.length && wf.status.indexOf(statusOf(w.id)) < 0) return false;
      if (!q) return true;
      return w.h.indexOf(q) >= 0 || (qp && plain(w.p).indexOf(qp) >= 0) || w.e.toLowerCase().indexOf(q) >= 0;
    });
  }

  function renderWordList() {
    var box = $("#wlist");
    if (!box) return;
    var list = filteredWords(), MAX = 150;
    var rows = list.slice(0, MAX).map(function (w) {
      var s = statusOf(w.id);
      return '<button class="wrow" data-word="' + esc(w.id) + '">' +
        '<span class="wh zh" lang="zh">' + esc(w.h) + "</span>" +
        '<span class="wmid"><span class="wp">' + esc(w.p) + '</span><span class="we">' + esc(w.e) + "</span></span>" +
        '<span class="wtags"><span class="pill cat">' + esc(w.level <= 3 ? "HSK " + w.level : "Beyond") + '</span><span class="pill st-' + s + '">' + cap(s) + "</span></span></button>";
    }).join("");
    box.innerHTML = rows || '<p class="muted">No words match. Try clearing a filter or the search.</p>';
    var counts = {};
    lex.words.forEach(function (w) { var s = statusOf(w.id); counts[s] = (counts[s] || 0) + 1; });
    var chips = document.querySelectorAll("[data-wstatus]");
    for (var i = 0; i < chips.length; i++) {
      var st = chips[i].dataset.wstatus, on = wf.status.indexOf(st) >= 0;
      chips[i].textContent = (on ? "✓ " : "") + cap(st) + " " + (counts[st] || 0);
    }
    $("#wcount").textContent = list.length === lex.words.length ? plural(list.length, "word") :
      list.length + " of " + plural(lex.words.length, "word");
    $("#wmore").textContent = list.length > MAX ? "Showing the first " + MAX + ". Search or filter to narrow it down." : "";
  }

  function renderWords() {
    current = null; session = null; onWords = true;
    var counts = {};
    lex.words.forEach(function (w) { var s = statusOf(w.id); counts[s] = (counts[s] || 0) + 1; });
    var sch = C.STATUSES.map(function (s) {
      var on = wf.status.indexOf(s) >= 0;
      return '<button class="fchip" data-wstatus="' + s + '" aria-pressed="' + on + '">' + (on ? "✓ " : "") + cap(s) + " " + (counts[s] || 0) + "</button>";
    }).join("");
    var lch = WLEVELS.map(function (l) {
      var on = wf.level.indexOf(l[0]) >= 0;
      return '<button class="fchip" data-wlevel="' + l[0] + '" aria-pressed="' + on + '">' + (on ? "✓ " : "") + l[1] + "</button>";
    }).join("");
    view.innerHTML =
      '<h1 class="ptitle">Words</h1>' +
      '<p class="intro muted">Every word in the texts. Tap one to see it and change how well you know it.</p>' +
      '<input id="wq" class="wsearch" type="search" placeholder="Search hanzi, pinyin or English" aria-label="Search words" value="' + esc(wf.q) + '" autocomplete="off">' +
      '<div class="filters"><div class="frow" role="group" aria-label="Filter by status">' + sch + "</div>" +
      '<div class="frow frow2" role="group" aria-label="Filter by level">' + lch + "</div></div>" +
      '<p class="muted" id="wcount"></p><div class="wlist" id="wlist"></div><p class="muted fnote" id="wmore"></p>';
    renderWordList();
  }

  view.addEventListener("input", function (e) {
    if (e.target.id === "wq") { wf.q = e.target.value; renderWordList(); }
  });
  view.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var ws = t.closest("[data-wstatus]"), wl = t.closest("[data-wlevel]"), wr = t.closest("[data-word]");
    if (ws) { toggleIn(wf.status, ws.dataset.wstatus); renderWords(); }
    else if (wl) { toggleIn(wf.level, parseInt(wl.dataset.wlevel, 10)); renderWords(); }
    else if (wr) showWord(wr.dataset.word);
  });

  // ---------- Reader ----------
  var current = null, session = null;

  function renderTokens(tokens) {
    return tokens.map(function (t) {
      if (t.t === "br") return "<br>";
      if (t.t === "p") return esc(t.h);
      if (t.t === "l") return '<span class="lit">' + esc(t.h) + "</span>";
      if (t.t === "n") {
        var rt = ui.pinyin !== "off" ? "<rt>" + esc(t.py) + "</rt>" : "";
        return '<span class="w name" tabindex="0" data-name="' + esc(t.h) + '" data-py="' + esc(t.py) + '"><ruby>' + esc(t.h) + rt + "</ruby></span>";
      }
      if (t.t === "w") {
        var w = lex.byId[t.id], s = statusOf(t.id);
        var show = ui.pinyin === "on" || (ui.pinyin === "new" && !C.isKnownStatus(s));
        return '<span class="w s-' + s + (t.name ? " name" : "") + '" tabindex="0" data-id="' + esc(t.id) + '"><ruby>' + esc(t.h) + (show ? "<rt>" + esc(w.p) + "</rt>" : "") + "</ruby></span>";
      }
      return esc(t.h || "");
    }).join("");
  }

  function metaHtml() {
    var cov = coverageOf(current), k = Object.keys(session.looked).length;
    return bandPill(cov) + '<span class="pill cat">' + esc(C.CATS[current.cat]) + "</span><span>" + statLine(cov) +
      (k ? " · looked up " + k : "") + "</span>";
  }

  function pinyinLabel() { return PINYIN_MODES.filter(function (m) { return m[0] === ui.pinyin; })[0][1]; }

  function renderReader(id) {
    var t = textById[id];
    if (!t) { location.hash = ""; return; }
    current = t; session = C.newSession();
    view.innerHTML =
      '<a class="back" href="#">← All texts</a>' +
      '<div class="rhead"><div class="title zh" lang="zh">' + esc(t.title) + '</div><div class="sub muted">' + esc(t.titleEn) + "</div></div>" +
      '<div class="rmeta" id="meta"></div>' +
      '<div class="tools">' +
        '<button id="pinyinBtn">' + pinyinLabel() + "</button>" +
        '<button id="hlBtn" aria-pressed="' + ui.hl + '">Highlights: ' + (ui.hl ? "On" : "Off") + "</button>" +
        '<span class="fontbtns"><button id="smaller" aria-label="Smaller text">A−</button><button id="bigger" aria-label="Bigger text">A+</button></span>' +
        '<button id="engBtn">' + (ui.english ? "Hide English" : "Show English") + "</button>" +
      "</div>" +
      '<p class="legend muted" id="legend"></p>' +
      '<div class="reading zh' + (ui.hl ? " hl" : "") + '" id="reading" lang="zh" style="--fs:' + ui.fs + 'rem"></div>' +
      '<div class="english" id="english"' + (ui.english ? "" : " hidden") + ">" + esc(t.en) + "</div>" +
      '<div id="finish" class="finish"><p class="muted">Tapped words count as looked up. Everything you didn\'t tap counts as read cleanly.</p>' +
      '<button class="primary" id="finishBtn">Finish reading ✓</button></div>';
    refreshReader();

    $("#pinyinBtn").onclick = function () {
      var i = PINYIN_MODES.findIndex(function (m) { return m[0] === ui.pinyin; });
      ui.pinyin = PINYIN_MODES[(i + 1) % PINYIN_MODES.length][0];
      this.textContent = pinyinLabel(); savePrefs(); refreshReader();
    };
    $("#hlBtn").onclick = function () {
      ui.hl = !ui.hl; this.textContent = "Highlights: " + (ui.hl ? "On" : "Off"); this.setAttribute("aria-pressed", ui.hl);
      savePrefs(); refreshReader();
    };
    $("#smaller").onclick = function () { setFont(ui.fs - 0.15); };
    $("#bigger").onclick = function () { setFont(ui.fs + 0.15); };
    $("#engBtn").onclick = function () {
      ui.english = !ui.english; $("#english").hidden = !ui.english;
      this.textContent = ui.english ? "Hide English" : "Show English";
    };
    $("#finishBtn").onclick = finishReading;
  }

  function refreshReader() {
    if (!current || !$("#reading")) return;
    $("#meta").innerHTML = metaHtml();
    var r = $("#reading");
    r.innerHTML = renderTokens(current.tokens);
    r.classList.toggle("hl", ui.hl);
    $("#legend").innerHTML = ui.hl ? '<span class="lg s-new">New</span> <span class="lg s-seen">Seen</span> words you\'re still learning are highlighted.' : "";
  }
  function setFont(v) {
    ui.fs = Math.max(1.1, Math.min(2.6, Math.round(v * 100) / 100));
    $("#reading").style.setProperty("--fs", ui.fs + "rem"); savePrefs();
  }

  function finishReading() {
    var before = coverageOf(current).shown, looked = Object.keys(session.looked).length;
    var res = C.finishText(state, current.id, current.tokens, session, cfg(), today());
    session = C.newSession();
    save(); refreshReader();
    var box = $("#finish"), after = coverageOf(current).shown;
    var back = '<p><a class="btn" href="#">← Back to all texts</a></p>';
    if (!res.counted) {
      box.innerHTML = "<h2>Already counted today</h2><p>You finished this text earlier today, so it didn't count again. Try another one, or come back tomorrow.</p>" + back;
      return;
    }
    var list = res.changes.slice(0, 12).map(function (c) {
      return '<li><span class="zh" lang="zh">' + esc(lex.byId[c.id].h) + "</span> " + esc(c.from) + " → <b>" + esc(c.to) + "</b></li>";
    }).join("");
    box.innerHTML = "<h2>Nicely done</h2>" +
      "<p>This text is now <b>" + after + "% known</b> for you" + (after !== before ? " (was " + before + "%)" : "") + ". " +
      (looked ? "You looked up " + plural(looked, "word") + ". " : "No lookups this time. ") + "</p>" +
      (list ? '<p class="muted">Words that moved up:</p><ul class="moved">' + list + "</ul>" +
        (res.changes.length > 12 ? '<p class="muted">…and ' + (res.changes.length - 12) + " more.</p>" : "") : "") +
      back;
  }

  // ---------- Word sheet ----------
  var sheetWord = null;
  function openSheet(html) {
    var wasHidden = sheet.hidden;
    sheet.innerHTML = '<button class="sheet-close" id="sheetClose" aria-label="Close">✕</button>' + html;
    sheet.hidden = false; backdrop.hidden = false;
    $("#sheetClose").onclick = closeSheet;
    if (wasHidden) $("#sheetClose").focus();
  }
  function closeSheet() { sheet.hidden = true; backdrop.hidden = true; sheetWord = null; }
  backdrop.addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });

  // Character breakdown: one row per distinct character, with other words that contain it.
  function chipsHtml(list) {
    return list.map(function (a) {
      return '<button class="chip" data-goto="' + esc(a.id) + '"><span class="zh" lang="zh">' + esc(a.h) + "</span> " + esc(a.e.split(";")[0]) + "</button>";
    }).join("");
  }
  function charsHtml(w) {
    var chs = Array.from(w.h);
    if (chs.length === 1) {
      var more = C.wordsContaining(lex, w.h, w.id, 8);
      return more.length ? '<div class="sheet-sec"><div class="muted">Words with ' + esc(w.h) + '</div><div class="also">' + chipsHtml(more) + "</div></div>" : "";
    }
    var readings = C.charReadings(w), seen = {}, rows = [];
    chs.forEach(function (ch, i) {
      if (seen[ch]) return;
      seen[ch] = true;
      var d = charDict[ch], py = readings ? readings[i] : (d ? d.p : ""), also = C.wordsContaining(lex, ch, w.id, 4);
      rows.push('<div class="crow"><div class="cch zh" lang="zh">' + esc(ch) + '</div><div class="cbody">' +
        '<div><span class="cpy">' + esc(py) + "</span> " + esc(d ? d.e : "") + "</div>" +
        (also.length ? '<div class="also"><span class="muted">also in</span> ' + chipsHtml(also) + "</div>" : "") + "</div></div>");
    });
    return '<div class="sheet-sec"><div class="muted">Characters</div>' + rows.join("") + "</div>";
  }

  function showWord(id) {
    sheetWord = id;
    var w = lex.byId[id], rec = state.words[id], s = statusOf(id), c = cfg();
    var knew = session && has(session.looked, id);
    var btns = C.STATUSES.map(function (x) {
      return '<button data-status="' + x + '" aria-pressed="' + (x === s) + '">' + cap(x) + "</button>";
    }).join("");
    openSheet(
      '<div class="sheet-hanzi zh" lang="zh">' + esc(w.h) + "</div>" +
      '<div class="sheet-py">' + esc(w.p) + ' <button class="small" data-act="say" aria-label="Listen">🔊</button></div>' +
      '<div class="sheet-en">' + esc(w.e) + "</div>" +
      '<div class="muted">' + esc(C.levelLabel(w.level)) + "</div>" +
      '<div class="sheet-sec"><div class="muted">How well do you know it?</div>' +
      '<div class="status-row" role="group" aria-label="Word status">' + btns + "</div>" +
      '<div class="muted small-print">Familiar after ' + c.familiarAt + " readings without a lookup, secure after " + c.secureAt + "." +
      (rec ? " Seen in " + plural(rec.exp, "reading") + ", looked up " + plural(rec.looks, "time") + "." : "") + "</div>" +
      (knew ? '<div class="knew"><p class="muted">Tapping a word counts as looking it up, which lowers its status.</p><button data-act="knew">I already knew it: undo</button></div>' : "") +
      "</div>" + charsHtml(w));
  }
  function showName(h, py) {
    sheetWord = null;
    openSheet(
      '<div class="sheet-hanzi zh" lang="zh">' + esc(h) + "</div>" +
      '<div class="sheet-py">' + esc(py) + "</div>" +
      '<div class="sheet-en">Proper name</div>' +
      '<div class="muted">Names are underlined in the texts and don\'t count towards your percentage.</div>');
  }

  sheet.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button") : null;
    if (b && b.dataset.goto) { showWord(b.dataset.goto); sheet.scrollTop = 0; return; }
    if (!b || !sheetWord) return;
    if (b.dataset.status) {
      C.setStatus(state, sheetWord, b.dataset.status, cfg());
      if (session) delete session.looked[sheetWord];   // an explicit choice overrides the lookup
      save(); refreshReader(); if (onWords) renderWordList(); showWord(sheetWord);
    } else if (b.dataset.act === "knew") {
      C.undoLookup(state, sheetWord, session);
      save(); refreshReader(); if (onWords) renderWordList(); showWord(sheetWord);
    } else if (b.dataset.act === "say") {
      speak(lex.byId[sheetWord].h);
    }
  });

  view.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest(".w") : null;
    if (!el) return;
    if (el.dataset.id) {
      if (session && C.lookup(state, el.dataset.id, session)) { save(); refreshReader(); }
      showWord(el.dataset.id);
    } else showName(el.dataset.name, el.dataset.py);
  });
  view.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("w")) { e.preventDefault(); e.target.click(); }
  });

  // ---------- Router ----------
  function route() {
    closeSheet();
    var h = location.hash.replace(/^#/, "");
    onWords = false;
    if (h.indexOf("text/") === 0) renderReader(h.slice(5));
    else if (h === "words") renderWords();
    else renderLibrary();
    var links = document.querySelectorAll("[data-nav]");
    for (var i = 0; i < links.length; i++) {
      var on = links[i].dataset.nav === (h === "words" ? "words" : "texts");
      if (on) links[i].setAttribute("aria-current", "page"); else links[i].removeAttribute("aria-current");
    }
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
