# Architecture

The site tells Joe's story as a character sheet. The story is data in `recipes/`, and a few plain browser scripts draw it. There is no build step: the committed files are the files the browser runs, and they open straight from disk. The reasons are in [`docs/decisions`](docs/decisions/README.md).

## Layers

```
index.html        loads everything below, in this order
recipes/          the words and facts: site.js and one file per act
js/story.js       the registry: collects recipes, checks them, holds the story's state and events
js/pixel.js       sprites, the hero and his gear, colored by each act's color ramp
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

Each script attaches one object to `window`: `Story`, `Pixel`, `Scenes`, `Sheet`, `WorldMap`, `Belt`, `Acts`, `Sound`, `Games` and `TypingRace`. A script can use another's global only if `index.html` loads that one first. The order lives only in `index.html` for now. Scripts are not modules because a page opened from a file cannot load modules (see [ADR 0003](docs/decisions/0003-plain-scripts-share-globals.md)).

`Sheet.el` is the small helper that builds elements. Eight other files use it, so it is the page's shared DOM helper.

## Recipes and the story registry

`recipes/site.js` calls `Story.site(...)` once: the name, the title-screen welcome, the ending, the contact links, the stats and the hero's look. Each `recipes/act-*.js` calls `Story.addAct(...)` once. The fields are listed in the README under "Recipes", and why they are JavaScript is in [ADR 0002](docs/decisions/0002-recipes-as-javascript.md).

At start-up `Story.validate` in `js/story.js` checks that the recipes point at things that exist: scenes, stage scenes, cues, hair and beards, hero gear, sprites, games and stats. It also checks that moments give items from their own act, that each item is given once, that each skill's moment exists and that a skill grows only from an earlier act. Problems are shown on the page and logged to the console.

## State and events

`Story.state` holds the acts unlocked, the items owned, the skills lit and the items seen on the sheet. Changes are announced with `Story.emit`: `unlock`, `item`, `skill`, `seen` and `rewind`. `main.js` is the only listener today, and it refreshes the top bar on each of them.

Today `acts.js` and `sheet.js` also write `Story.state` directly, next to the emits.

## Scenes and cues

A scene paints a still background once and draws its moving parts on every frame while its act is on screen. A cue is a GSAP timeline that tweens the scene's state, and the frame draws whatever the state says. A cue played to its end leaves the scene in its final state, so an act unlocked without motion looks the same. The scene names are the keys of `scenes.js`, with the shared character sheet as `sheet`.

## Art

Sprites are grids of characters, one per pixel, with the rules in [`STYLE-GUIDE.md`](STYLE-GUIDE.md). A color ramp has three shades (light, base and shade), and each act's `color` supplies one. The hero is a base grid with gear laid over it.

## Motion

GSAP 3.15.0 and ScrollTrigger drive the motion. `acts.js` pins each act while its moments play, then releases it. With reduced motion, or without GSAP, the steps settle at once instead.

## Hosting

`.github/workflows/pages.yml` publishes the committed files to GitHub Pages on every merge to `main`. A pull request only packages the site as a check.

## Tests

`npm run test:unit` runs `tests/unit/`, which checks each recipe rule in `js/story.js` with `node:test`, and the shipped recipes against the real scenes, art and games. `npm test` runs those first, then `tests/smoke.mjs`: it opens `index.html` from disk in an installed Chrome and does what a reader does, at several window and phone sizes. It runs on a developer's machine, not in CI ([ADR 0004](docs/decisions/0004-smoke-test-runs-locally.md)).

## Known limits

- The load order is implicit, and it is held only by `index.html`.
- `acts.js` and `sheet.js` change `Story.state` directly rather than through `story.js`.
- Some files hold several parts in one place: `js/scenes.js` (about 1,390 lines, 14 scenes), `tests/smoke.mjs` (811 lines), `css/site.css` (682 lines) and `js/games/bmx.js` (about 1,335 lines).
