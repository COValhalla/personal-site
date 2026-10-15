# Fork it: tell your own life in acts

This site is Joe's life as a game: a title screen, a tutorial and seven acts, each with its own place, items and skills, ending on a character sheet. You can fork it and tell your own life the same way. You rewrite the story and keep the engine, and you need no build tools: the page still opens by double-clicking `index.html`.

## What is yours and what you keep

| Folder | What it is | In your fork |
| --- | --- | --- |
| `story/recipes/` | The words and facts: `site.js`, then one file per act | Rewrite |
| `story/sprites.js` | The item sprites, one 16 × 16 grid per item | Rewrite |
| `story/scenes/` | The places, one file per scene, and `props.js`, the props they share | Rewrite, or keep the ones that fit |
| `engine/` | The code that draws any story: acts, belt, sheet, map, hero, games, boot | Keep |
| `css/`, `vendor/` | The look of the page, and GSAP for the motion | Keep |

Every word a visitor reads that belongs to Joe is in `story/recipes/site.js` or an act's recipe. The engine only says the game's own words, such as Press start, Open sheet and Level up. [ADR 0009](docs/decisions/0009-engine-and-story-folders.md) records why the folders are split this way.

## 1. Fork and open it

Fork the repository on GitHub, clone your fork, and open `index.html` in a browser. Keep `workshop.html` open beside it: it draws every scene, animation, item sprite and piece of hero gear on its own, so you can check your art without scrolling through the story.

## 2. Rewrite `site.js`

`story/recipes/site.js` holds your name, the welcome on the title screen, the link under Press start for a reader short on time, the ending and the last act's Next tag, the Say hello line and your contact links, the stats your items add to, and your hero's `look`: skin, hair and eye colors, hair style and beard. The comments in the file explain each field.

## 3. Rewrite the acts

Each act is one file in `story/recipes/`. Copy one of Joe's, then change its title, years, color ramp, moments, items and skills. The README's "Recipes" table lists every field. An act can have any number of moments; each one can give an item and play an animation in its scene.

To add or remove an act, add or remove its file and its script tag in both `index.html` and `workshop.html`, in the order the acts are told. The first act can be a tutorial, with `tutorial: true` and a `label` such as Tutorial.

## 4. Draw your art

- **Items.** Draw each item's sprite in `story/sprites.js` under the name its recipe gives as `sprite`. Use 1, 2 and 3 for the act's colors, so an item takes the color of the act that gives it. The rules are in [`STYLE-GUIDE.md`](STYLE-GUIDE.md).
- **Places.** Each scene is a file in `story/scenes/` that calls `Scenes.add(name, scene)` once. Start from one of Joe's: `draw` paints the still background, `frame` draws the moving parts, and each cue is a short animation a moment can play. Add its script tag to both pages, after `story/scenes/props.js` and before `engine/scenes/character-sheet.js`. A recipe names the scene by the name it registers.
- **The level-up.** An act can level up on the shared character screen by naming `sheet` as its last stage. It draws any act's class, items and skills, so it needs no art from you.
- **Your hero.** Set the colors, hair and beard in `look`, then pick each act's `gear`, `hair` and `beard` in its recipe from the kit in `engine/pixel.js`. New gear is the one piece of art that goes in the engine.

## 5. Check it

The page lists any recipe mistake near its top and in the browser console, such as an item with no sprite or a moment playing an animation its scene does not have. Then run the unit tests, which check your recipes against your scenes, sprites and games:

```sh
npm install
npm run test:unit
```

`npm test` also runs the smoke test, which reads Joe's story: his words, his acts and his games. It fails on your story until you rewrite those checks in `tests/smoke/`.

## 6. Change what the page says before it runs

Link previews and search engines read `index.html` before any script runs, so a few things live there rather than in a recipe:

- the `<title>`, the description and the `og:` tags, with your own address in `og:url` and `og:image`;
- `share.png`, the 1200 × 627 picture a link preview shows;
- the letter in the icon, and the name in the footer.

## 7. The games and the visit counter

- **Games.** The BMX race, the hammer throw and the typing race are Joe's. An act or item opens one through its `game` field. Set `game: null` to leave them out, or keep one that fits your story.
- **Visit counts.** `engine/addons/visits.js` counts visits with GoatCounter only on Joe's address, so your fork counts nothing. To count your own visits, make a GoatCounter account and change `SITE` and `COUNTER` at the top of that file, and the published address in `tests/unit/visits.test.mjs`. To drop the counter, remove its script tag; the story works the same without it.

## 8. Publish it

`.github/workflows/pages.yml` publishes the site to GitHub Pages on every merge to `main`. In your fork, turn on the repository's Actions, and set Settings, Pages, Source to GitHub Actions. Your site appears at `https://<your-name>.github.io/<repository>/`.

## Taking later changes from Joe's engine

Add Joe's repository as a second remote and merge its `main` from time to time. When your changes stay in `story/`, the engine's changes come in without touching them; the script tags in the two pages are the one place you may have to choose between both versions.
