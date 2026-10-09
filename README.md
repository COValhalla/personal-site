# A life in six acts

A proof of concept for a playful personal website: Joe's life story told as a game character sheet. Each act fills the screen and tells its story as you scroll: every moment drops an item into your inventory, and the act ends with a level-up and new skills.

Every word on the page is a placeholder for you to replace.

This repository tracks the site from its first version on. Everything the page needs sits at the top level, so a clone of it is a working site.

## Open it

Double-click `index.html`, or from a terminal:

```sh
git clone https://github.com/COValhalla/personal-site.git
cd personal-site
open index.html
```

It runs straight from the file. No server, no build step and no internet connection.

## See it live

The site is public at **https://covalhalla.github.io/personal-site/**.

Every merge to `main` publishes it there within a minute or two, through GitHub Pages. The workflow in `.github/workflows/pages.yml` does it: it puts the committed files online as they are, because there is nothing to build. On a pull request the same workflow only packages the site, as a check, and publishes nothing. To publish again without a change, run "Publish to GitHub Pages" from the repository's Actions tab.

## What to try

1. Scroll. Each act starts in gray. As it comes into view a chapter card sweeps across, the color comes in and your character walks on.
2. Keep scrolling. The act holds still and tells its story one moment at a time: each moment types itself out, plays a little scene (a race, a plane to Vietnam, a team walking in) and drops its item, which flies into the inventory belt along the bottom.
3. After the last moment your character levels up and changes gear, the new skills light up with the skills they grew from, and Open sheet appears. Then the next act scrolls in.
4. Select any item in the belt or in a moment to read its story card. Open the sheet for your stats, the full inventory and the skill tree.
5. Play the BMX race in Act I: wait for the gate, hold Pedal (or the right arrow) for speed, and tap Pump (or Space) just before each roller and at the lip of each jump. Beat the three other riders.
6. Play the hammer throw in Act II: hold to spin (or hold Space). You get one wind and four turns; let go while the hammer glows. Hold on past the fourth turn and it is a foul.
7. Use the chapter buttons (I to VI) to jump to an act, or the quick facts at the end for the short version.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The page. It loads everything below in order. |
| `recipes/` | The story: `site.js` plus one recipe per act. Edit these to change the words. |
| `STYLE-GUIDE.md` | Sprite sizes, palettes, outline rules and animation timing. |
| `js/pixel.js` | Item sprites, the hero and his gear per act. |
| `js/scenes.js` | One pixel scene per act, with its animations (cues). |
| `js/acts.js` | Builds each act and tells its story in steps as you scroll. |
| `js/belt.js` | The inventory belt and experience bar along the bottom. |
| `js/sheet.js` | The character sheet, skill tree and story cards. |
| `js/look.js` | The draft look picker on the sheet. |
| `js/games/` | The hammer throw, the BMX race and their sounds. |
| `js/story.js` | Collects the recipes and checks them for mistakes. |
| `js/main.js` | The top bar, the intro, the quick facts and start-up. |
| `vendor/gsap/` | GSAP 3.15.0 and ScrollTrigger, kept here so the page works offline. |
| `tests/smoke.mjs` | An end-to-end check in Chrome. |

## Recipes

Each act is one file in `recipes/`. The fields:

| Field | Meaning |
| --- | --- |
| `id`, `numeral`, `title`, `years` | The act's name and when it happened |
| `summary` | One line for the quick facts |
| `color` | `name` plus `light`, `base` and `shade` colors, and an optional `accent` for the scene |
| `theme` | `light`, or `dark` for a dark act screen |
| `scene` | Which scene in `js/scenes.js` to draw |
| `hero` | `gear` from `js/pixel.js` and the class `title` shown on level up |
| `beats` | The moments of the act, in order. Each has a `tag` (`life` or `work`) and `text`, and optionally the `item` it gives (an item id from this act) and a scene `cue` to play |
| `unlock` | `banner` (such as Level 2), `say` (the line beside it) and an optional `pop` (the word over the hero, Level up! by default) |
| `items` | Two or three items: `id`, `name`, `sprite`, `tag`, `line`, `adds` (stats), `photo` (a path or `null`) and an optional `game` |
| `skills` | Two or three skills: `id`, `name`, `parents` (ids from this or an earlier act) and `line` |
| `game` | The game this act offers, or `null` |
| `photos` | Spare photos for later |

To add a photo, put the file in a `photos/` folder next to `index.html` and set the item's `photo` to `'photos/hammer.jpg'`.

`recipes/site.js` holds the name, the tagline, the stats and `look`: the hero's skin, hair color, hair style, beard and glasses, so the character can look like you. The easiest way to choose: open the sheet, open "Make the character look like you", try the options, and copy the line it shows into `recipes/site.js`. The picker only shows while `draft` is `true`.

If a recipe has a mistake, such as a skill growing from one that does not exist or a moment giving an item from another act, the page lists it near the top and in the browser console.

## Building more with AI

Ask an AI coding agent for one act at a time. A prompt that works:

> Read `STYLE-GUIDE.md` and `recipes/act-2-school.js`. Update `recipes/act-4-denver.js` with these words: … Add a 16 × 16 sprite for a new item called … to `js/pixel.js`, following the sprite rules, and give it to the moment it belongs to. Add a cue to the `mountains` scene in `js/scenes.js` that shows … when that moment plays. Then run `npm test` and fix anything that fails.

## Tests

The smoke test opens the page in Google Chrome and does what a reader does: it scrolls through every act step by step, opens the sheet, reads a story card, throws the hammer (a fair throw, a fifth-turn foul and a foul in the wind) and races the BMX track with a bot that pumps the rollers, with motion on, with motion off and on a phone-sized screen.

```sh
npm install
npm test
```

Set `CHROME_PATH` to use a different Chrome or Chromium.

## Credits

Motion uses [GSAP](https://gsap.com) and ScrollTrigger, free under GSAP's standard license (`vendor/gsap/README.md`). All art is drawn fresh for this site.
