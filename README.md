# HSK 3 Reader

A reading-first Chinese practice site for learners at about HSK 2 to 3. Each text shows a live "% of words you know", so you can pick something that is easy, comfortable, a stretch or a challenge for you today. Tap any word for its meaning, pinyin, a breakdown of its characters and other words that use them.

It is a plain static site: HTML, CSS and JavaScript, with no build step and no server. Your progress is saved in your own browser.

## What it does

- **Texts:** 20 short graded texts (stories, dialogues, news, diaries, culture) with English translations. Filter by category and difficulty, show unread only, sort easiest or hardest first, or press Surprise me.
- **Difficulty is personal.** The percentage is worked out from the words you know, not a fixed level. Easy is 98% or more, Comfortable 95 to 97%, Stretch 90 to 94%, Challenge below 90%.
- **Reader:** pinyin On, New words only, or Off; highlights for words you are still learning; A− / A+ text size; show or hide the English; names are underlined.
- **Word tracking:** tapping a word counts as a lookup. Finishing a text gives every word you did not tap credit for a clean reading. A word is New, Seen, Familiar (3 clean readings) or Secure (8). You can also set any word by hand. A text only counts once per day.
- **Words tab:** every word in the texts, searchable by hanzi, pinyin (tone marks optional) or English, with status and level filters and a bulk "mark all of these as…" control.
- **Progress tab:** day streak, texts read, words known, a bar per HSK level, the familiar and secure thresholds, and export / import of your progress as a JSON file.

## Try it on your computer

Open `index.html` in a browser. That is all; no server is needed.

## Put it on GitHub Pages

1. Create a new repository on GitHub and upload every file and folder from this project, keeping the layout shown below. `index.html` must sit at the top level.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, and save.
4. After a minute or so, the site is live at `https://<your-username>.github.io/<repository-name>/`.

To update the site later, upload the changed files to the repository. GitHub Pages republishes by itself.

## Files

```
index.html        page shell and navigation
style.css         all styling (light and dark mode)
app.js            the interface: library, reader, word sheet, Words and Progress tabs
core.js           the logic with no screen code: lexicon, tokenizer, word status, coverage, bands, streaks
data/hsk1.js      HSK 1 words
data/hsk2.js      HSK 2 words
data/hsk3.js      HSK 3 words
data/extra.js     words the texts need that are beyond HSK 3
data/chars.js     one-line meanings for individual characters
data/texts.js     the reading texts
tools/validate.js checks every text and shows how hard each one is
tools/test-core.js unit tests for core.js
PLAN.md           the build plan and notes (not needed to run the site)
```

## Adding a text

Add an entry to the `TEXTS` list in `data/texts.js`:

```js
{
  id: "g5", cat: "dialogue", title: "在医院", titleEn: "At the hospital",
  text: `A：你好！你 哪儿 不 舒服？
B：我 头 疼。`,
  en: `A: Hello! What's wrong?
B: I have a headache.`
}
```

- `id` must be unique. `cat` is one of `story`, `dialogue`, `news`, `diary`, `culture`.
- **Words are separated by spaces.** Punctuation sits against the word before it. A new line is a line break. Speaker labels such as `A：` are plain letters.
- **Names** are written `{小明|xiǎo míng}`. Give the pinyin the first time a name appears in a text; later uses can be just `{小明}`. A name that is also a normal word (北京, 中国) counts as a word and is underlined.
- **A word with two readings:** the first one listed in the word files is the default. Pick the other with `=`, for example `长=zhǎng`.

Then run the checker (see below). It lists any word that is not in the word lists and any character that is missing from the character dictionary. Add missing words to `data/extra.js` (or the right HSK file) and missing characters to `data/chars.js`, in the same format as the existing lines, and run it again until it says "All good".

### Word and character lines

```
data/hsk*.js, extra.js:   "hanzi|pinyin with spaces between syllables|english"
data/chars.js:            "字|pinyin|short meaning"
```

The level of a word comes from the file it is in (`extra.js` words show as "Beyond HSK 3"). A word id is `hanzi|pinyin`, so the same hanzi with two readings are two separate words.

## Checking your work

You need [Node.js](https://nodejs.org). Run these from the project folder:

```
node tools/validate.js             # assumes you know HSK 1-2
node tools/validate.js --known 3   # assumes you know HSK 1-3
node tools/validate.js --known 0   # assumes you know nothing
node tools/test-core.js            # unit tests for core.js
```

`validate.js` checks the word lists (format, syllables matching characters), the character dictionary, and every text (unknown words, bad names, missing fields), then prints a table of each text's coverage and difficulty band. It ends with "All good" or the number of problems found.

## Your progress

Progress is stored in your browser's local storage on this device only (key `hsk3-reader-v1`). Clearing site data, using a private window or switching browser or device starts you from scratch. To keep it safe or move it, use **Progress → Export progress** and later **Import progress…**. Importing replaces what is on that device. **Erase all my progress** is at the foot of the Texts page.

When you first visit, you are asked where you are starting from. That marks the words up to that level as familiar so the percentages make sense. You can change it any time; words you have actually read or set yourself are never undone by it.

## Please note

- **The word lists were written from memory and are not official.** They follow the HSK 2.0 level style and the levels are approximate. Check against an official list before relying on them for an exam.
- **The texts were written by Claude** (an AI) for this project. Some phrasing may sound stiff or unnatural to a native speaker, so please flag anything that does.
- **Meanings and character glosses** are short and aimed at how a character works inside common words. Double-check anything that matters.
- Common function words (的, 了, 是) count towards the percentage like any other word. Names, punctuation and speaker labels do not.
- The 🔊 button uses your browser's built-in speech voices, so it only works if your device has a Chinese voice installed.
- There is no dictionary for pasting in your own text yet. That would need a full dictionary such as CC-CEDICT, which requires attribution.
