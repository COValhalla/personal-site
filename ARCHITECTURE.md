# Architecture

The site tells Joe's story as a character sheet. The story is data in `recipes/`, and a few plain browser scripts draw it. There is no build step: the committed files are the files the browser runs, and they open straight from disk. The reasons are in [`docs/decisions`](docs/decisions/README.md).

## Layers

```
index.html        loads everything below, in this order
js/dom.js         el() and colorVars(), the shared helpers that build elements
js/pixel.js       sprites, the hero and his gear, colored by each act's color ramp
js/draw.js        the drawing kit: rect, text, sprite, mix, rng and the other pixel helpers
js/story.js       the registry: collects recipes, checks them, holds the story's state and events
recipes/          the words and facts: site.js and one file per act
js/scenes.js      one pixel scene per act, with its cues (short animations)
js/acts.js        builds each act and tells its story one moment at a time as you scroll
js/belt.js        the inventory belt and the experience bar along the bottom
js/sheet.js       the character sheet and story cards
js/map.js         the world map on the sheet
js/games/         mini-games, registered in games.js
js/main.js        the top bar, the intro, the ending and start-up
vendor/gsap/      GSAP and ScrollTrigger, kept here so the page works offline
```

The recipes are the only source of the story. The page modules read them through `Story` and draw with the art in `pixel.js` and `scenes.js`. Nothing is generated.

`workshop.html` is a second page. It loads the art, the scenes and the recipes, but not the story's motion, sheet, games or boot, and draws each scene, cue, sprite and gear piece alone ([ADR 0005](docs/decisions/0005-workshop-page.md)).

## Load order and globals

Each script attaches one object to `window`: `Dom`, `Pixel`, `Draw`, `Story`, `Scenes`, `Sheet`, `WorldMap`, `Belt`, `Acts`, `Sound`, `Games` and `TypingRace`. A script can use another's global only if the page loads that one first. Scripts are not modules because a page opened from a file cannot load modules (see [ADR 0003](docs/decisions/0003-plain-scripts-share-globals.md)).

Each script says what it needs in its opening comment ([ADR 0006](docs/decisions/0006-scripts-declare-what-they-need.md)):

```
 * Needs: Dom, Pixel, Story
 * Needs after start-up: WorldMap, Games, Acts
```

`Needs:` names the globals the page must load before the script. `Needs after start-up:` names the ones the page loads after it, which the script reads only once the page is running; the sheet and the acts need each other that way. `tests/unit/needs.test.mjs` reads both pages and every script, and fails when a line names a global the page loads too late or not at all, when a script uses a global its lines leave out, or when a line names one it no longer uses. The game files in `js/games/` have no lines yet, while game work waits.

`Dom.el` builds elements and `Dom.colorVars` turns an act's ramp into CSS variables. `Sheet.el` and `Sheet.colorVars` remain as aliases for the games.

## Recipes and the story registry

`recipes/site.js` calls `Story.site(...)` once: the name, the title-screen welcome, the ending, the contact links, the stats and the hero's look. Each `recipes/act-*.js` calls `Story.addAct(...)` once. The fields are listed in the README under "Recipes", and why they are JavaScript is in [ADR 0002](docs/decisions/0002-recipes-as-javascript.md).

At start-up `Story.validate` in `js/story.js` checks that the recipes point at things that exist: scenes, stage scenes, cues, hair and beards, hero gear, sprites, games and stats. It also checks that moments give items from their own act, that each item is given once, that each skill's moment exists and that a skill grows only from an earlier act. Problems are shown on the page and logged to the console.

## State and events

`Story.state` holds the acts unlocked, the items owned, the skills lit and the items seen on the sheet. Only `story.js` changes it, through five calls, and each change sends an event:

| Call | Changes | Event |
| --- | --- | --- |
| `Story.give(itemId)` | adds an owned item | `item` |
| `Story.light(skillId)` | lights a skill | `skill` |
| `Story.unlock(i)` | levels act `i` up | `unlock` |
| `Story.seeAll()` | marks every owned item seen | `seen` |
| `Story.rewind(i)` | takes back act `i`'s items, skills and level | `rewind` |

`give`, `light` and `unlock` do nothing and send nothing when the change is already made. Everyone else reads `Story.state` through views that have `has`, `size` and iteration but no `add` or `delete`, so a stray write fails at once. `main.js` is the only listener today, and it refreshes the top bar on each event.

## Scenes and cues

Every scene draws with the kit in `js/draw.js` and a few props at the top of `js/scenes.js` (peaks, pines, clouds, speech bubbles, doors, people and the BMX rider). Each scene opens with a `Needs:` line naming the kit helpers, props and globals it uses, and the same test checks those lines against the scene's code. The world map draws with the same kit.

A scene paints a still background once and draws its moving parts on every frame while its act is on screen. A cue is a GSAP timeline that tweens the scene's state, and the frame draws whatever the state says. A cue played to its end leaves the scene in its final state, so an act unlocked without motion looks the same. The scene names are the keys of `scenes.js`, with the shared character sheet as `sheet`.

## Art

Sprites are grids of characters, one per pixel, with the rules in [`STYLE-GUIDE.md`](STYLE-GUIDE.md). A color ramp has three shades (light, base and shade), and each act's `color` supplies one. The hero is a base grid with gear laid over it.

## Motion

GSAP 3.15.0 and ScrollTrigger drive the motion. `acts.js` pins each act while its moments play, then releases it. With reduced motion, or without GSAP, the steps settle at once instead.

## Hosting

`.github/workflows/pages.yml` publishes the committed files to GitHub Pages on every merge to `main`. A pull request only packages the site as a check.

## Tests

`npm run test:unit` runs `tests/unit/` with `node:test`. It checks each recipe rule in `js/story.js` and the shipped recipes against the real scenes, art and games, the five state calls, and every Needs line against both pages. `npm test` runs those first, then `tests/smoke.mjs`: it opens `index.html` from disk in an installed Chrome and does what a reader does, at several window and phone sizes. `tests/smoke.mjs` only launches Chrome and runs the surfaces in `tests/smoke/`, one file each: the page around the acts, the acts, the sheet, the games and the layout by window size. Each surface opens its own pages, so it can run alone, and `tests/smoke/helpers.mjs` holds what they share. It runs on a developer's machine, not in CI ([ADR 0004](docs/decisions/0004-smoke-test-runs-locally.md)).

## Known limits

- The load order is still written by hand in each page; the Needs lines and their test only check it.
- The games still use `Sheet.el`, `Scenes.mix` and `Scenes.rng`, and have no Needs lines.
- Some files hold several parts in one place: `js/scenes.js` (about 1,730 lines, 17 scenes), `css/site.css` (682 lines) and `js/games/bmx.js` (about 1,335 lines).
