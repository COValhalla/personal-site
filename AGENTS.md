Book library: when a book informs this project's work, log the use in LIBRARY.md (rules: ~/Documents/book-library/AGENTS.md, Usage log).

# Working on this site

This is Joe's personal site: his life told as a character sheet, drawn by plain browser scripts with no build step. Read [ARCHITECTURE.md](ARCHITECTURE.md) first. Then read the part of the site you will touch:

- Words and facts: the recipe for the act, in `recipes/`, and the fields in the README's "Recipes" table.
- Art: `STYLE-GUIDE.md` before any sprite or scene.
- Decisions: `docs/decisions/`, before you change something that looks deliberate.

## Commands

- `npm install` once, for the test's dev dependency.
- Open `index.html` in a browser to check a change by eye. No server is needed. `workshop.html` shows every scene, cue, sprite and gear on its own, which is quicker for a scene or sprite change.
- `npm run test:unit` checks the recipe rules in a second or so.
- `npm test` runs those unit tests, then the end-to-end check in Chrome, which takes about four minutes. Set `CHROME_PATH` to use another Chrome.

## Rules

- No build step, bundler, transpiler or runtime package. A page opened from disk must keep working ([0001](docs/decisions/0001-no-build-step.md)).
- Recipes stay plain JavaScript loaded by script tags, not JSON or ES modules ([0002](docs/decisions/0002-recipes-as-javascript.md)).
- A new script goes in `index.html` in its dependency order, attaches one global, and opens with a `Needs:` line, as the others do ([0003](docs/decisions/0003-plain-scripts-share-globals.md), [0006](docs/decisions/0006-scripts-declare-what-they-need.md)).
- Words go in `recipes/`, sprites in `js/pixel.js`, drawing helpers in `js/draw.js`, scenes and cues in `js/scenes/`, one file per scene, and the story's state changes only through `Story.give`, `light`, `unlock`, `seeAll` and `rewind` in `js/story.js`.
- Do not add Joe's photos; they are not part of the repository.
- Commit subjects read `type(scope): summary`, with types such as feat, fix, chore, test, refactor, docs and perf.
- Before a pull request: `npm test` passes locally, and the pull request says so. When a change makes README, ARCHITECTURE or a decision stale, update it in the same change. Record a new decision in `docs/decisions/` when a choice is hard to reverse.
- Keep the visitor's page the same unless the change asks for a visible difference, and check any such difference in Chrome at a desktop and a phone size.
