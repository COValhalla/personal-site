# 0009. The engine and the story sit in separate folders

Status: Accepted, 2026-10-15. Moves the paths named in [0002](0002-recipes-as-javascript.md), [0005](0005-workshop-page.md), [0006](0006-scripts-declare-what-they-need.md), [0007](0007-visit-counts.md) and [0008](0008-one-file-per-scene.md); their decisions stand.

## Context

The site's owner wants a friend to be able to fork the site: clone it, rewrite the recipes and the art, and publish their own life in acts. The recipes already had their own folder, but the story's art did not: the item sprites sat in `js/pixel.js` beside the painter and the hero, and Joe's places sat in `js/scenes/` beside the scene registry and the shared character screen. Two lines a visitor reads were written in the code, not the recipes: "Short on time? See my work history on LinkedIn." under Press start, and "Next: what I build next" on the last act. A fork had to read the whole of `js/` to find what was theirs to change.

## Decision

- `engine/` holds the page's code, everything that was in `js/`: the helpers, the painter and the hero, the drawing kit, the story registry, the acts, the belt, the sheet, the map, the games, the boot, the workshop's script and the add-ons. A fork keeps it.
- `story/` holds what a fork rewrites: `story/recipes/` (the old `recipes/`), `story/sprites.js` (the item sprites, which join the painter with `Pixel.addSprites`) and `story/scenes/` (the props and one file per place).
- The scene registry, `engine/scenes/index.js`, and the character screen every act can level up to, `engine/scenes/character-sheet.js`, stay in the engine: they draw any story.
- The hero's base, gear, hair and beards stay in `engine/pixel.js` as a kit. A recipe picks from it, and `look` in `story/recipes/site.js` colors it.
- Every word a visitor reads that belongs to one person comes from `story/recipes/site.js`. The engine keeps only the words of the game itself, such as Press start, Open sheet and Level up.
- `FORKING.md` is the guide for a fork.
- Older decisions keep the paths they were written with. Read `js/` as `engine/`, `recipes/` as `story/recipes/`, and `js/scenes/` as `story/scenes/`, except the registry and the character screen, which are in `engine/scenes/`.

## Consequences

- A fork's own work is one folder, plus the page's title, footer and preview image in `index.html` and its script tags for the story's files.
- The pages load the story's files between the engine's: the recipes and sprites after the registry, the story's scenes after the scene registry and before the character screen. A test still checks every `Needs:` line and the scene order on both pages.
- Updates to the engine can be pulled into a fork without touching its story, apart from the script tags both share in `index.html` and `workshop.html`.
- The games stay in `engine/games/` with their contents unchanged while game work waits. They are Joe's games; a fork can keep them, or leave `game` out of its items and acts.
- The smoke test reads Joe's story, so a fork rewrites it or runs only the unit tests.
