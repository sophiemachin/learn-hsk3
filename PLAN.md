# HSK 3 Reader: build plan

Static site for GitHub Pages (plain HTML/CSS/JS, no build). Reading-first practice: graded texts, a live "% of words you know" on each text, word tracking, pinyin toggle, tap-for-dictionary, underlined names, category filters.

## How to work through this (rules for Claude)

1. Read this file first. Do ONLY the next unchecked step. Never start from scratch.
2. Each step is tiny: ONE concern, about 5 minutes. If a step looks bigger than that, split it in this file first and do only the first piece. If the user reports a bug, fix ONLY the bug, send files, and stop; never fix a bug and start a step in the same turn (it burned the user's free usage once).
2b. Each step is sized for about 5 minutes. When it's done: tick the box here, send the changed files with SendUserFile, and stop. Don't roll on into the next step unless asked.
3. If time or usage runs out mid-step, send whatever exists and note in "Status" what's half-done.
4. Do not rewrite files from earlier steps unless the step says so. Extend them.
5. Keep replies short: what changed, how to check it, what the next step is.

## Status

Last updated: 2026-10-21. Steps 1 to 8 and 9a done. Built so far:
- 9a: nav bar (Texts / Words) in `index.html` with `data-nav`; route `#words` -> `renderWords()` in app.js (`filteredWords`, `renderWordList`, `wf` filter state kept in memory only, not saved). Search matches hanzi, pinyin (tone marks and spaces ignored, so `dianhua` finds 打电话) and English; status chips (with live counts) and level chips (HSK 1/2/3/Beyond); none selected = show all. List shows the first 150 matches with a note. Tapping a row opens the existing word sheet; changing status there updates the list and chip counts (`onWords` flag; sheet handler calls `renderWordList`). Playwright at 390px: search, filters, status change, nav both ways, no errors. For 9b, add the bulk-set controls to `renderWords`; for 9c, add a Progress tab with a third `data-nav` link.
- 8h: text n4 (运动和身体, 95% Comfortable at HSK 2). An older draft of n4 (运动和健康, 94% Stretch) was already in `data/texts.js` from an interrupted run; it was removed so ids are unique. Also nudged c1 (春节) from 94% to 95% by adding one known-word sentence. FINAL SPREAD at HSK 2 (20 texts): Easy 4, Comfortable 6, Stretch 6, Challenge 4, exactly the target. Validator: All good; 27 tests pass.
- 8g: texts s4 (一个决定, 95% Comfortable at HSK 2) and c4 (北京的胡同, 86% Challenge) added (19 texts). Added 胡同 to `data/extra.js` and 胡 to `data/chars.js`. Note: 可是 is not in the lexicon (use 但是). Bands at HSK 2: Easy 4, Comfortable 4, Stretch 7, Challenge 4. Only n4 (8h) left, then check the spread. Validator: All good.
- 8f: texts g4 (打电话, 94% Stretch at HSK 2) and d4 (我怎么学汉语, 85% Challenge) added (17 texts). No new words or characters. Note: a single character like 早 is not a word in the lexicon; use 早上 or reword. Bands at HSK 2: Easy 4, Comfortable 3, Stretch 7, Challenge 3. Validator: All good.
- 8e: texts n3 (汉语比赛, 95% Comfortable at HSK 2) and c3 (汉字, 95% Comfortable) added (15 texts). Added 汉字 to `data/extra.js`; no new characters needed. Bands at HSK 2: Easy 4, Comfortable 3, Stretch 6, Challenge 2. Validator: All good.
- 8d: texts d3 (新同事, 98% Easy at HSK 2) and s3 (小熊猫北北, 93% Stretch) added (13 texts). Added 竹子 to `data/extra.js`; 竹 and 王 to `data/chars.js`. Bands at HSK 2: Easy 4, Comfortable 1, Stretch 6, Challenge 2. Comfortable (95-97%) is the thin band; aim a few later texts there.
- 8c: texts c1 (春节, 94% Stretch at HSK 2) and c2 (喝茶, 98% Easy) added (11 texts). Added 春节 to `data/extra.js` (first word there). Tip learned: a repeated beyond-HSK word drags the % down fast, so use 它 / 这 after the first mention. Bands at HSK 2: Easy 3, Comfortable 1, Stretch 5, Challenge 2. Validator: All good.
- 8b: texts s2 (小红的帽子, 93% Stretch at HSK 2) and n2 (新地铁明天开始, 91% Stretch) added (9 texts now). No new words or characters needed; validator: All good. Bands at HSK 2: Easy 2, Comfortable 1, Stretch 4, Challenge 2. Later texts should lean Easy/Comfortable.
- 8a: texts g2 (地铁站, 96% Comfortable at HSK 2) and g3 (饭店, 98% Easy) added to `data/texts.js` (7 texts now). Added 你们 to `data/hsk1.js` (was missing). Validator: All good; no new characters needed. Bands at HSK 2 so far: Easy 2, Comfortable 1, Stretch 2, Challenge 2; keep new texts easier where possible.
- 7c: `SORTS`, `visibleTexts()` (filters + sort, used by `renderLibrary` and Surprise me), `sortHtml()` in app.js; sort saved as `state.settings.sort` (library / easiest / hardest, ties keep library order); "🎲 Surprise me" opens a random visible text (toast if none). Syntax-checked only. Library page is now complete.
- 7b: difficulty chips (`hiddenBands`, `toggleBand`, saved as `state.settings.hideBands`; counts are live from the user's own words) and an "Unread only" chip (`toggleUnread`, `state.settings.unreadOnly`) in `filtersHtml`; `renderLibrary` filters by category, band and unread. Handled in the same `view` click listener via `data-band` / `data-unread`; `.frow2` CSS adds spacing. Syntax-checked and unit tests run; not browser-tested. For 7c, add sort + Surprise me in the same filters area.
- 7a: category chips above the library list (`filtersHtml`, `toggleCat`, `hiddenCats` in app.js; saved as `state.settings.hideCats`). Chips show "✓ Name count"; hidden ones lose the tick. "N of 5 categories hidden" note; friendly message if all hidden. Tested in Playwright (hide, persist across reload, restore): no errors. For 7b, reuse the same pattern (`.fchip`, `.filters`, `[data-...]` handled in the existing `view` click listener).
- 5b FIX: choosing a lower starting level used to do nothing (it only ever raised words). `core.js` now has `applyBaseline(state, words, level, cfg)`: words assumed from the starting level carry `base:true` until a lookup, a finished text or a manual status clears it, so changing the level raises/lowers only assumed words and never undoes real progress. The onboarding card marks the current level (aria-pressed). The library footer has "Erase all my progress" (confirm, wipes localStorage key `hsk3-reader-v1`). 27 tests pass; Playwright check: levels 2,3,2,1,0,2 gave 93% / 100% / 93% / 77% / 0% / 93% for text 1. Progress saved by the pre-fix version has no `base` flags, so a user who clicked a high level before the fix must press "Erase all my progress" once.
- STEP 6: `data/chars.js` (`CHARS_RAW`, 368 lines "字|pinyin|meaning"; single-character words in the word lists supply defaults, so chars.js only holds the rest and overrides). `core.js` gained `buildCharDict, charReadings, wordsContaining`; `tools/test-core.js` now has 24 tests (one asserts chars.js covers every lexicon character); `tools/validate.js` lists characters missing from the dictionary (including characters in names), so whenever new words or names are added, run it and add the listed characters to chars.js. In the word sheet: multi-character words show one row per distinct character (pinyin as read in this word, meaning, "also in" word chips, lower HSK levels first); single-character words show "Words with X" chips; tapping a chip opens that word. `index.html` loads `data/chars.js`. Browser test passed, no console errors. Chromium prints harmless refused-connection noise about google.com in this sandbox; ignore it.
- Not yet done: names don't get a character breakdown (deliberate); no Words/Progress tabs; no filters.
- STEP 5 (supersedes the step 4 "in memory only" note below): progress is saved to localStorage key `hsk3-reader-v1` (state = `{v, words, reads, days, settings}`; settings hold `onboarded, startLevel, pinyin, fs, hl`, and optional `familiarAt/secureAt`). Onboarding card on first visit (beginner / HSK 1 / 1-2 / 1-3; only raises words to familiar, never demotes; "Change my starting level" link at the bottom of the library). Tapping a word = lookup (core `lookup`); sheet has New/Seen/Familiar/Secure buttons (an explicit choice overrides the lookup), 🔊 listen button, "I already knew it: undo". Highlights toggle (new = blue tint, seen = amber tint, with legend). "Finish reading ✓" applies `finishText`, shows before/after %, words that moved up; a second finish the same day says "Already counted today". Library cards show "Read ×n". UI test (Playwright, scratchpad `ui-test5.js`, not in repo) passed: onboarding, lookup, undo, manual status, finish, persistence across reload, no console errors.
- Not yet done: no Words/Progress tabs, no export/import (step 11); no filters (step 7); no character breakdown (step 6).
- WORKING APP (open `index.html` directly, no server needed): `index.html`, `style.css`, `app.js`. Library of cards with live "% known · N new words" and band pill; reader with ruby pinyin (On / New words / Off), A-/A+, Show English, underlined names; tap a word for a bottom sheet (hanzi, pinyin, meaning, HSK level; names show "Proper name"). Router is hash-based (`#` library, `#text/<id>`). Tested in headless Chromium at 390px width: no console errors; screenshots checked.
- Step 4 state is IN MEMORY ONLY and hard-codes "knows HSK 1-2" (the `bulkSet ... "familiar"` block near the top of `app.js`). Step 5 replaces this with localStorage and the onboarding card.
- `app.js` structure for later steps: Data / Helpers / Library / Reader (`renderTokens`, `renderReader`) / Word sheet (`openSheet`, `showWord`, `showName`) / Router. UI test script used: Playwright with `executablePath: '/opt/pw-browsers/chromium'`.
- CSS: `.reading .w` has `white-space: nowrap` so words never split across lines.
- `tools/validate.js` (run `node tools/validate.js`, or `--known 3` / `--known 0` to change the assumed level) and 5 texts in `data/texts.js` (d1, d2, g1, s1, n1). Validator reports "All good". With HSK 1-2 known: d1 93% Stretch, d2 83% Challenge, g1 100% Easy, s1 90% Stretch, n1 83% Challenge. Steps 8-10 must add more Easy and Comfortable texts to balance this.
- Step 3 added 7 basic compounds to `data/hsk2.js` (杯, 一些, 吃饭, 每天, 晴天, 出去, 后天: things an HSK 2 learner knows) and 头, 风, 跑 to `data/hsk3.js`. `data/extra.js` is still empty; use it for words beyond HSK 3.
- `core.js` (lexicon parser, tokenizer, coverage, bands, word status, lookup / undo, finishText, streak) and `tools/test-core.js` (19 tests, all passing; run `node tools/test-core.js` from the project root).
  API names the UI should use: `parseLexicon, tokenize, coverage, bandOf, statusOf, statusById, isKnown, setStatus, bulkSet, newSession, lookup, undoLookup, finishText, streak, ymd, levelLabel`, plus constants `BANDS, CATS, STATUSES, DEFAULT_CFG`. Tokens: `w` word, `n` name, `p` punctuation, `l` label, `br` line break, `x` unknown.
- `data/hsk1.js` (150), `data/hsk2.js` (145), `data/hsk3.js` (301), `data/extra.js` (empty, filled in step 3). All pass the format check (syllables match characters, no duplicate ids).
- Two hanzi have two readings: 长 cháng (HSK2) / zhǎng (HSK3), 还 hái (HSK2) / huán (HSK3). The first listed is the default; texts use `长=zhǎng` to pick the other.
- The older flashcard version (index.html, style.css, app.js, README.md) is obsolete and gets replaced in steps 2 to 10.

## Design decisions (settled with the user)

**Files**
- `index.html`, `style.css`, `app.js` (UI), `core.js` (pure logic, testable in node), `README.md`
- `data/hsk1.js`, `hsk2.js`, `hsk3.js`, `extra.js` (words beyond HSK 3 that the texts need), `chars.js` (per-character dictionary), `texts.js`
- `tools/validate.js` (checks every text word is in the lexicon, prints % coverage per text)
- Data files use `var` globals so both browser and node can load them.

**Data formats**
- Word line: `"hanzi|pinyin with spaces|english"`. Level comes from the file (hsk1=1, hsk2=2, hsk3=3, extra=4). Word id = `hanzi|pinyin`.
- Char line: `"字|pinyin|short gloss"`.
- Text: `{id, cat, title, titleEn, text, en}`. `text` is hand-segmented: words separated by spaces, punctuation attached, newline = line break, `A：` style speaker labels are plain Latin letters. Names are `{小明|xiǎo míng}` (pinyin needed on first use only). A `{name}` that is also a lexicon word (北京, 中国) counts as a word and is underlined. `长=zhǎng` picks a non-default reading.
- Categories: story, dialogue, news, diary, culture.

**Word status** (per word id, stored in localStorage): record `{exp, clean, looks}`.
- seen = `exp >= 1`; familiar = `clean >= 3`; secure = `clean >= 8` (thresholds editable in settings).
- Tapping a word = a lookup: `clean = floor(clean/2)`, once per word per reading. A panel button "I knew this" undoes it.
- Finishing a text: every unique word gets `exp+1`, and `clean+1` unless looked up. A text only counts once per day.
- Manual override (New / Seen / Familiar / Secure) sets the counters to the matching threshold.
- Onboarding: "I know HSK 1–2" marks those words familiar.

**Percentage:** token-weighted, so repeats count; names, punctuation and Latin labels are excluded. Known = familiar or secure. Shown as a floored whole number.
Bands: Easy 98%+, Comfortable 95–97%, Stretch 90–94%, Challenge below 90. These are computed live from the user's own words, not the nominal text level.

**Reader:** pinyin Off / On / New words only; highlight words still being learned; A-/A+ font size; show English translation; names underlined with a straight line; tap a word for a bottom sheet (meaning, pinyin, level, status buttons, listen button, per-character breakdown, other known words containing each character).

**Library:** category chips and band chips (hide any), unread only, sort (library order / easiest / hardest), "Surprise me".

**Not included yet (future):** pasting your own text (needs a full dictionary such as CC-CEDICT, which requires attribution), flashcard review of looked-up words, cross-device sync.

## Steps

Done:
- [x] 1. Vocabulary (hsk1/2/3/extra data files)
- [x] 2. Core logic + tests
- [x] 3. First 5 texts + validator
- [x] 4. Minimal working app (library, reader, word sheet, pinyin toggle)
- [x] 5. Progress tracking (localStorage, lookups, finish, highlights, onboarding)
- [x] 5b. Fix: starting level can be lowered; erase-all link
- [x] 6. Character dictionary

Next (each one small; do one at a time):
- [x] 7a. Category chips on the library page: tap a category to hide or show it; saved in `state.settings.hideCats`. Hidden count shown ("2 of 5 categories hidden"). Names underline already works, so no work needed there.
- [x] 7b. Difficulty chips (Easy / Comfortable / Stretch / Challenge, with counts) and an "Unread only" toggle; saved in settings.
- [x] 7c. Sort menu (library order / easiest first / hardest first) and a "Surprise me" button that opens a random visible text.
- [x] 8a. Texts g2 (asking the way) + g3 (restaurant). Validate, add chars.
- [x] 8b. Texts s2 (lost hat) + n2 (new subway line).
- [x] 8c. Texts c1 (Spring Festival) + c2 (tea).
- [x] 8d. Texts d3 (new colleague) + s3 (little panda).
- [x] 8e. Texts n3 (Chinese competition) + c3 (Chinese characters).
- [x] 8f. Texts g4 (phone call) + d4 (how I study Chinese).
- [x] 8g. Texts s4 (a decision) + c4 (hutongs).
- [x] 8h. Text n4 (exercise and health). Then check the band spread for someone at HSK 2: roughly 4 easy, 6 comfortable, 6 stretch, 4 challenge; adjust texts if lopsided.
- [x] 9a. Words tab (nav bar + word list with search and status / level filters; tap a word to open its sheet).
- [ ] 9b. Words tab: bulk-set ("mark all HSK 3 words as ...").
- [ ] 9c. Progress tab: streak, texts read, words per status, per-level bars.
- [ ] 9d. Export / import progress as a JSON file.
- [ ] 9e. Settings: familiar / secure thresholds.
- [ ] 10a. Playwright click-through at phone width and desktop; fix only what is broken.
- [ ] 10b. Rewrite README (GitHub Pages steps, adding a text, `node tools/validate.js`, data caveats). Final send.

## Known caveats to repeat in the README

- Word lists were written from memory and are not official. Levels are approximate (HSK 2.0 style).
- The texts are written by Claude; flag anything that sounds unnatural.
- Common function words (的, 了, 是) count in the percentage like any other word.
