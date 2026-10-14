# A life in a tutorial and seven acts

A proof of concept for a playful personal website: Joe's life story told as a game character sheet. Each act fills the screen and tells its story as you scroll: every moment drops an item into your inventory, and the act ends with a level-up and new skills.

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

1. Press start on the title screen (or press Enter), and the page glides to the Tutorial. Scrolling works too. Each act starts in gray. As it comes into view a chapter card sweeps across, the color comes in and your character walks on.
2. Keep scrolling. The act holds still and tells its story one moment at a time: each moment types itself out, plays a little scene (boxes packed in the holiday rush, a race, the stadium lights coming on, concrete poured into forms, a plane to Vietnam, a team walking in), and once the words are whole its item pops in, its skill lights and the item flies into the inventory belt along the bottom. Each moment ends on a row of its own for the item it gave and the skill it lit. The story panel beside the scene ends under its last moment, and in a window taller than the act needs, the act sits in the middle of the screen. As you scroll your character walks across the scene and the progress rail under it fills ("Moment 2 of 3"), so every bit of scrolling moves something. Each moment has its own stop: when you pause between them the page settles on the nearest one, so a fast flick still lands on a whole moment.
3. After the last moment your character levels up and changes gear, the new skills light up with the skills they grew from, and Open sheet appears. A pulsing Next tag points to the next act.
4. Select any item in the belt or in a moment to read its story card. Select a lit skill card, or a skill on its moment, to read its story card too: its line and the skills it grew from. Open the sheet for your stats, the full inventory and the map: one road through the Tutorial and the seven acts, with your character at the furthest stop reached. Select a stop to walk there, read its class and skills, and go to that act.
5. Play the BMX race in Act I: wait for the gate, hold Pedal (or the right arrow) for speed, and tap Jump (or Space) while your front wheel is over the lit strip before each roller, or on a jump strip to wheelie over it. Hold Jump longer to fly bigger, and let go to roll over a jump at 90% speed. Beat the two other riders over six straights, five berms and 13 jumps.
6. Play the hammer throw in Act III: hold to spin (or hold Space). You get one wind and four turns, and the last two are fast; let go while the hammer glows. A good release on turn 3 or 4 hits with a freeze, a shake and a flash, and a throw of 70 m or more plays a slow-motion throw camera (tap to skip). Hold on past the fourth turn and it is a foul.
7. Play the typing race in the Tutorial: type the three lines as fast as you can to beat KIM (20 words a minute) and MAX (35 words a minute). Typing is the Tutorial's game, the one you would play in typing class.
8. Scroll back above an act and it rewinds, together with every act after it, then plays again as you scroll down. Scrolling inside an act never un-tells what you have already seen.
9. Use the chapter buttons (0 to VII) to jump to an act. The page ends on what Joe builds next, with Say hello and the links to reach him under it; for real titles, employers and dates, "Short on time?" on the title screen goes to his work history on LinkedIn. Say hello in the top bar opens a small menu of the same links.

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
| `js/sheet.js` | The character sheet and story cards. |
| `js/map.js` | The world map on the sheet. |
| `js/games/` | The hammer throw, the BMX race, the typing race and their sounds. |
| `js/story.js` | Collects the recipes and checks them for mistakes. |
| `js/main.js` | The top bar, the intro, the ending with Say hello, and start-up. |
| `vendor/gsap/` | GSAP 3.15.0 and ScrollTrigger, kept here so the page works offline. |
| `tests/smoke.mjs` | An end-to-end check in Chrome. |

## Recipes

Each act is one file in `recipes/`. The fields:

| Field | Meaning |
| --- | --- |
| `id`, `numeral`, `title`, `years` | The act's name and when it happened |
| `color` | `name` plus `light`, `base` and `shade` colors, and an optional `accent` for the scene |
| `theme` | `light`, or `dark` for a dark act screen |
| `scene` | Which scene in `js/scenes.js` to draw |
| `stages` | Optional: one scene per moment, then one for the level-up (so `beats` plus one names), for an act whose background changes as the story goes on. The camera dives into each next scene. Moments in a row can name the same scene to share it, and the story carries on there without a dive. The level-up can be `sheet`, the shared character screen drawn from the act's class, items and skills |
| `hero` | `gear` from `js/pixel.js`, the class `title` shown on level up, and the `hair` and `beard` the hero has in this act |
| `beats` | The moments of the act, in order. Each has a `tag` (`life` or `work`) and `text`, and optionally the `item` it gives (an item id from this act), a scene `cue` to play and a `look` (`hair`, `beard`) that changes the hero at that moment |
| `unlock` | `banner` (such as Level 2), `say` (the line beside it) and an optional `pop` (the word over the hero, Level up! by default) |
| `items` | Two or three items: `id`, `name`, `sprite`, `tag`, `line`, `adds` (stats), `photo` (a path or `null`) and an optional `game` |
| `skills` | Two to four skills: `id`, `name`, `parents` (ids from this or an earlier act), `line` (shown on the skill's story card) and an optional `moment` (the number of the moment it lights with; otherwise the level-up lights it) |
| `game` | The game this act offers, or `null` |
| `photos` | Spare photos for later |

To add a photo, put the file in a `photos/` folder next to `index.html` and set the item's `photo` to `'photos/hammer.jpg'`.

`recipes/site.js` holds the name (in the top bar and on the sheet), the full name (the title screen's heading), the welcome on the title screen, the ending's kicker, heading and line, the Say hello line and `contact` links (a blank address is left out), the stats and `look`: the hero's skin, hair and streak colors, eye color, and today's hair style and beard, drawn from Joe's photos, which are not part of this repository. Each act's `hero` sets the hair and beard for that part of the story: short hair as a kid and under a cap in high school, bald with a goatee from college to Denver, then the beard and the bun grow through the year off. To try other colors, change `look` in `recipes/site.js` and reload.

If a recipe has a mistake, such as a skill growing from one that does not exist or a moment giving an item from another act, the page lists it near the top and in the browser console.

## Building more with AI

Ask an AI coding agent for one act at a time. A prompt that works:

> Read `STYLE-GUIDE.md` and `recipes/act-3-college.js`. Update `recipes/act-5-denver.js` with these words: … Add a 16 × 16 sprite for a new item called … to `js/pixel.js`, following the sprite rules, and give it to the moment it belongs to. Add a cue to the `mountains` scene in `js/scenes.js` that shows … when that moment plays. Then run `npm test` and fix anything that fails.

## Tests

The smoke test opens the page in Google Chrome and does what a reader does: it scrolls through every act step by step (in the Tutorial, packed boxes stack by the shipping door; in high school, the lights come on and the team walks on, the discus lands at 176 feet, and at the summer jobs the forms go up, the concrete pours and a painted machine rolls onto a truck), checks in every act that each moment's item pops in only once its words are whole, then its skill lights, then the item flies to the inventory, and that every skill a moment lights is on before the level-up, opens the sheet, reads a story card, opens a lit skill's story card by click and by keyboard (and a locked one opens nothing), checks that the page ends on one section, What I build next with Say hello inside it and no sheet button, with no quest log and no discus game, checks that scrolling walks the hero and fills the progress rail, walks the map, throws the hammer (a centered fourth-turn release with its hit and throw camera, a skipped camera, a fifth-turn foul and a foul in the wind), checks every pump call, the wheelie, the flight and the wheel lift, and races the BMX track with a bot that pumps the rollers and jumps, with motion on, with motion off and on a phone-sized screen. It also checks that every act's moments fit in its story panel without scrolling, at 1440 × 900 and on shorter laptop screens down to 1280 × 680. At 1184 × 1260 and 1440 × 900 it checks that every story panel ends within 24 px under its last moment, that every moment ends on its own row for its item and skill with the panel no taller once they appear, and, in the tall window, that every act sits in the middle of the screen; it reads the World of Warcraft line in Act II and opens a story card from a skill on its moment. In narrow windows and tablets from 760 × 600 to 1279 × 720 it checks that every act's skills and buttons sit above the inventory belt and that its Next tag covers none of them. On laptops and tablets from 800 × 600 to 1920 × 1080, with motion on, it holds every act's Next tag at the top of its pulse and checks that it sits clear of the skills, the Open sheet and Play buttons and the belt. On an iPhone 13 it taps a lit skill and reads its story card. On an iPhone 13, an iPhone SE (3rd generation), a Galaxy S8 and the first iPhone SE it checks that every act's Next tag sits clear of its buttons and skills. On the first iPhone SE (320 × 568) it also checks that every act's story panel is at least 100 px tall and shows the newest moment's first two lines.

```sh
npm install
npm test
```

Set `CHROME_PATH` to use a different Chrome or Chromium.

## Credits

Motion uses [GSAP](https://gsap.com) and ScrollTrigger, free under GSAP's standard license (`vendor/gsap/README.md`). All art is drawn fresh for this site.
