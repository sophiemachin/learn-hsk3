# HSK 3 Reader: build plan

Static site for GitHub Pages (plain HTML/CSS/JS, no build). Reading-first practice: graded texts, a live "% of words you know" on each text, word tracking, pinyin toggle, tap-for-dictionary, underlined names, category filters.

## How to work through this (rules for Claude)

1. Read this file first. Do ONLY the next unchecked step. Never start from scratch.
2. Each step is sized for about 5 minutes. When it's done: tick the box here, send the changed files with SendUserFile, and stop. Don't roll on into the next step unless asked.
3. If time or usage runs out mid-step, send whatever exists and note in "Status" what's half-done.
4. Do not rewrite files from earlier steps unless the step says so. Extend them.
5. Keep replies short: what changed, how to check it, what the next step is.

## Status

Last updated: 2026-10-20. Steps 1 to 6 done. Built so far:
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

- [x] **1. Vocabulary.** Write `data/hsk1.js` (~150), `data/hsk2.js` (~150), add the missing ~20 words to `data/hsk3.js`, create empty `data/extra.js`. Format check: syllable count matches characters (erhua 儿 is the only exception). Send the data folder.
- [x] **2. Core logic.** Write `core.js` (lexicon parser, tokenizer, coverage, bands, word status, lookup, finish, manual set) plus `tools/test-core.js`. Run the tests. Send both.
- [x] **3. First 5 texts + validator.** Write `tools/validate.js` and 5 texts in `data/texts.js` (diary 1 and 2, dialogue 1, story 1, news 1). Run the validator and add every missing word to `extra.js` or the right HSK file. Send data and tools.
- [x] **4. Minimal working app.** `index.html`, `style.css`, `app.js`: text list with live % and band, reader with tappable words, a basic word sheet (meaning and pinyin), pinyin toggle. Everything stored in memory only. Check it loads in headless Chromium with no console errors. Send all files. At this point the user can try it.
- [x] **5. Progress tracking.** localStorage state, lookup and finish logic wired in, status buttons in the sheet, "I knew this", highlights, onboarding card, "Finish reading" summary.
- [x] **6. Character dictionary.** Run the validator to list missing characters, write `data/chars.js` (in two halves if long), add the character breakdown and "also in" lists to the sheet.
- [ ] **7. Names and filters.** Underlined names (check the underline renders with pinyin on), category and band chips, unread only, sort, Surprise me, filter settings saved.
- [ ] **8. Texts batch 2.** 5 more texts (dialogue 2 and 3, story 2, news 2, culture 1). Validate.
- [ ] **9. Texts batch 3.** 5 more texts (diary 3, story 3, culture 2, news 3, dialogue 4). Validate.
- [ ] **10. Texts batch 4.** The 5 hardest (diary 4, story 4, culture 3 and 4, news 4). Validate. Check the spread of bands for someone at HSK 2: roughly 4 easy, 6 comfortable, 6 stretch, 4 challenge.
- [ ] **11. Words and Progress tabs.** Word list with search, status and level filters, bulk-set. Progress with per-level bars, streak, texts read, export / import / reset, threshold settings.
- [ ] **12. Polish and ship.** Playwright click-through of every screen at phone width and desktop, fix issues, rewrite README (GitHub Pages steps, how to add a text and run `node tools/validate.js`, data attribution note), final send.

## Known caveats to repeat in the README

- Word lists were written from memory and are not official. Levels are approximate (HSK 2.0 style).
- The texts are written by Claude; flag anything that sounds unnatural.
- Common function words (的, 了, 是) count in the percentage like any other word.
