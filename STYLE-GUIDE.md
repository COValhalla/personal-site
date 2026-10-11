# Style guide

This guide keeps every act, sprite and animation looking like it came from the same game. Give it to an AI coding agent together with an act's recipe when you ask for a new act, a new item or a new scene.

## Sizes

| Thing | Size in pixels | Shown at |
| --- | --- | --- |
| Item sprite | 16 × 16 | 4× in slots, 8× on story cards |
| Hero sprite | 16 × 24 | 1 scene pixel per sprite pixel; 4× on the sheet |
| Act scene | 160 × 72, ground at y = 64 | As big as fits the screen above the skills row |
| Hammer and discus field | 200 × 150, with a 64 × 64 close-up of the circle | Scaled to fit the game window |
| BMX race | 200 × 100, ground at y = 84, lanes 5 pixels apart, overhead view in each berm | Scaled to fit the game window |
| World map | 320 × 120, a stop per act | The width of the sheet |
| BMX rider | drawn on a 32 × 32 canvas, then turned with the slope | 1 game pixel per sprite pixel |
| Pixel text | 3 × 5 per letter, 1 pixel apart | `Pixel.text` draws digits, capital letters and `- ! ? : / + $` |

- Only whole-number scales. Pixels are never smoothed: every `img` and `canvas` showing pixel art carries the `px` class (`image-rendering: pixelated`).
- Items were planned at 8 × 8. At that size the BMX bike and the calipers could not be read, so items are 16 × 16.

## Writing a sprite

Sprites live in `js/pixel.js` as a grid of strings, one character per pixel:

| Character | Color |
| --- | --- |
| `.` | transparent |
| `o` | outline `#1d1b22` |
| `1` `2` `3` | the act's light, base and shade color |
| `w` | white `#f6f4ef` |
| `m` `n` | metal, light `#c3c6cc` and dark `#7d808a` |
| `s` `S` | skin and skin shade |
| `h` | hair |
| `k` `K` | trousers and trousers light |

Rules:

1. Every solid shape has a 1-pixel `o` outline. Thin parts one pixel wide, such as the hammer's wire, use `n` or `3` with no outline.
2. Light comes from the top left: `1` on top-left edges, `3` on bottom-right edges, `2` everywhere else. One `w` pixel can be a highlight.
3. An item uses only its act's three colors plus the neutrals above. No other colors, no gradients, no half-transparent pixels.
4. Leave at least one transparent pixel around the edge where the shape allows.
5. Check the sprite on a light slot (`#fffdf9`) and a dark slot (`#34313d`). Act I's slots are dark.

The same sprite drawn in a different act takes that act's colors automatically.

## The hero

The hero is `HERO_BASE` in `js/pixel.js` with one gear overlay per act in `HERO_GEAR`. An overlay row replaces the base pixel wherever it has a character other than `.`. The shirt uses the act's colors, so it changes color by itself.

- The base is drawn from Joe's photos: blue eyes (`e`), a wide smile, and hair with lighter streaks (`H`). Keep the face rows (6 to 9) unchanged so the hero stays recognizable.
- Gear so far: `backpack` (Tutorial), `helmet` (Act I), `cap` (II), `headband` (III), `hardhat` with a reflective vest stripe (IV), `beanie` (V), `headphones` around the bun (VI), `badge` on the shirt with no hat (VII).

The colors come from `look` in `recipes/site.js`, and each act's `hero` in its recipe picks the hair and beard for that part of the story:

| Field | Values |
| --- | --- |
| `skin`, `skinShade`, `hair`, `hairLight`, `eyes` | Any color, used for `s`, `S`, `h`, `H` and `e` |
| `hairStyle` (today), or `hair` in an act | `short`, `bald` or `bun` (overlays in `HAIR`) |
| `beard` | `none`, `goatee`, `stubble`, `short`, `full` or `long` (overlays in `BEARD`) |
| `glasses` | `true` or `false` |

The story so far: short hair in Act I and under the cap in II, bald with a goatee in III to V, and in VI the beard grows moment by moment (a moment's `look`) into the long beard and top bun of VI and VII. Hair is drawn under the gear, and under a hat a bun tucks in as short hair; the beard and glasses are drawn over it, so a hat never hides the face. Other people in scenes (the shop crew, the football team, the business, the team) are `PERSON_BASE`, a plain face, in other shirts, hair and skin.

## Act colors

Color is added act by act: an act is drawn in grays until it unlocks, then its color comes in and stays.

| Act | Name | Light | Base | Shade |
| --- | --- | --- | --- | --- |
| I · Open world | Sunny orange, sky-blue accent `#3fa9f5` | `#ffc46b` | `#ff8a1f` | `#c25a0a` |
| II · Finding my party | Varsity red, navy accent `#24366b` | `#f08a75` | `#e0533d` | `#a3352a` |
| III · Training arc | Magenta | `#f29ad0` | `#d6449a` | `#962d6b` |
| IV · High stakes | Blueprint blue | `#7fb0ee` | `#3b7dd8` | `#24539c` |
| V · Mountains and factories | Pine green | `#7fd09c` | `#3fa66b` | `#286f46` |
| VI · The respec | Amber | `#f5cf66` | `#e5ac1f` | `#a57712` |
| VII · Party leader | Purple | `#b69af0` | `#8a63d2` | `#5d3f9a` |

Act VII's own items are purple; its scene and the end of the page use every act's color.

An optional `accent` is a second color for the scene and the title underline: Act I's sky and Act II's school color. Sprites never use it. Act III has none, so its stands keep the navy.

Open world is bright on purpose: a Saturday at the track, then the white-tiled family shop in deer season. The Diablo II nod opens the Tutorial, when night falls and an inventory glows on the computer, and comes back in Act I's dark character sheet. No game art, names or logos.

## Scenes

A scene lives in `js/scenes.js` and has four parts:

| Part | What it does |
| --- | --- |
| `draw(ctx, c, acts)` | Paints the still background once, with whole-pixel rectangles only |
| `init()` | Returns the scene's state: plain numbers, all starting at 0 (or -1 for "not yet") |
| `frame(ctx, c, state, t, acts)` | Draws the moving parts over the background, every frame, from the state and the time `t` in seconds |
| `cues` | One function per animation: `name: state => gsap.timeline()` that tweens the state |

- The ground is at y = 64. `heroX` says where the hero stands; keep the area around it clear.
- Use the act's three colors, the neutrals, and tints mixed from them with `Scenes.mix`.
- Use `Scenes.rng(seed)` for crowds, stars and code lines, so a scene looks the same every time.
- A moment in a recipe names a cue (`cue: 'plane'`). Played to its end, a cue must leave the scene in its final state: with motion turned off the page jumps every cue to its end.
- Move things in whole pixels or GSAP `steps()` eases, so motion stays chunky like the art.
- Cues so far: Tutorial `night`, `type`, `grow`, and `equip` (the level-up, on the high-score board); Act I `race`, `crew`, and `equip` (on the character screen); II `skip`, `party`, `discus`, `captain` (the football field: night falls, the lights come on, the discus lands, the team walks on); III `throw`, `study`, `texas`; IV `measure`, `plant`, `road`; V `ski`, `plane`, `line`; VI `fun`, `study`, `code`, `duck`; VII `listen`, `loop`, `team`, `shine`.
- An act can have `stages`: one scene per moment, then one for the level-up (the Tutorial has four: the bedroom at night, the computer lab, home and the high-score board; Act I has three: the track, the shop and the character screen). Moment 1 plays in stage 1, moment 2 in stage 2, and so on; a moment's cue must belong to its own stage. Going from one stage to the next, the hero walks to the door it leaves by, the camera dives through it, and the next scene zooms in. A dive takes about 1.5 seconds. Acts without `stages` keep one scene.
- The scene only draws while its act is on screen.

## The story steps

Every act fills one screen. It tells its story in steps, and each step plays once; scrolling back never replays it.

1. **Chapter.** When the act's top is a little past the middle of the screen, a chapter card sweeps across the scene, the title slides in, the color comes in and the hero walks on in the last act's gear.
2. **Moments.** At the top of the screen the act holds still (it is pinned). Every further 60% of a screen of scrolling tells the next moment, and each moment has its own stop: when scrolling pauses between stops the page glides to the nearest one (after 0.16 s; a nudge of about 30% of a moment past a stop goes on to the next). A moment: it types itself out, plays its scene cue, and its item pops out above the hero and flies into the inventory belt. In between, the scroll itself moves things: the hero walks 34 scene pixels across the scene to `heroX` (in an act with `stages`, across each scene), and the progress rail under the scene fills, with a node per moment and one for the level-up ("Moment 2 of 3").
3. **Level up.** After the last moment the hero jumps, changes gear and bursts in the act's color; then the new skills light one by one, each with the skills it grew from; then Open sheet appears. The act holds still for 70% of a screen more, and a pulsing Next tag points to the next act. On a phone the Next tag, like the scroll hint before it, sits in a row of its own under the buttons.

| Step | Starts at | Length | Ease |
| --- | --- | --- | --- |
| Chapter card in | 0 s | 0.45 s | `power3.out` |
| Color comes in | 0.2 s | 0.9 s | `power1.inOut` |
| Hero walks on | 0.3 s | 0.8 s | `steps(10)` |
| Chapter card out | 1.0 s | 0.35 s | `power2.in` |
| Moment types out | 0.1 s | its length ÷ 70 letters a second | linear |
| Item pops out, then flies to the belt | 0.35 s, flight about 1.25 s later | 0.4 s, then 0.75 s | `back.out(3)`, then `power2.in` |
| Hero jumps and changes gear | 0 s, gear at 0.25 s | 0.25 s up, 0.45 s down | `power2.out`, `bounce.out` |
| Skills light | 0.75 s, then 0.28 s apart | 0.35 s each | `back.out(2.5)` |
| Open sheet appears | after the last skill, plus 0.25 s | 0.3 s | `back.out(2)` |

- Steps queue up. If you scroll past moments faster than they play, the waiting ones play at 1.5x (`CATCH_UP`), and leaving an act finishes it at 3x (`LEAVE_SPEED`).
- The timings live in `BEATS`, `STEP_SCROLL`, `LEVEL_HOLD`, `CATCH_UP`, `LEAVE_SPEED`, `SETTLE_DELAY`, `SETTLE_BIAS` and `WALK` in `js/acts.js`. Change them there, not per act.
- An item a moment does not give arrives with the level-up.
- The hero idles with a 1-pixel bob, two frames, 1.4 s per cycle, and walks with the same bob, faster.
- With motion turned off, every act shows already told and unlocked, and the games stay playable.
- On a laptop the hero turns to face the pointer.

## The inventory belt

Along the bottom of a laptop screen sits the belt: one slot per item, grouped by act, under an experience bar. The bar fills as an act's story is told and the level number goes up with each level-up. Items fly into their slot; select one to read its story. On a phone the belt is hidden and items fly into the Sheet button instead.

## Games

- Short, one screen, and skippable at any time with Skip or Escape.
- Drawn on a small canvas in the act's colors, scaled up with pixels kept sharp.
- At most two controls, each with a button and a key. The hammer and the discus are one: hold to spin (Space). The BMX race is two: Pedal (hold, or the right arrow) and Jump (tap, or Space; hold to fly bigger).
- A game should be able to go wrong. The hammer fouls after a fifth turn, the discus after a third, and both on a release in the wind or away from the glow; a BMX rider can case a jump, overshoot it or come up short and crash.
- Show the timing a game judges. The BMX lit strip draws the real windows from `WINDOWS` in `js/games/bmx.js`: green for perfect, amber for good. The roller calls are Perfect pump, Good - a bit early, Good - a bit late, Too early and No pump. A tap on a jump wheelies over it, and a press pulls the front wheel up 22 degrees around the rear wheel (`LIFT`). The hold meter shows, before each jump, the charges that land clean.
- The hammer's turns run at 4.4, 5.2, 7.2 and 9.2 radians a second (`turnSpeed`), and the glow widens on a fast turn so it never lasts under 0.1 s (`MIN_WINDOW`). A fair release on turn 3 or 4 freezes for 0.08 s (0.11 s for a perfect one), then shakes and flashes; a throw of 70 m or more plays the side-on throw camera at a dusk stadium.
- The discus throw shares the hammer's code in `js/games/hammer.js`; `MODES` holds what differs. It turns twice, at 5.0 and 7.8 radians a second, and a fair release on the second turn hits. Marks are in feet, rounded down to the tenth, so 176.0 ties Joe's 176-foot school record (`RECORD_FT`) without beating it. The record is a gold line across the sector and a gold flag in the throw camera, which plays from 165 feet.
- Each game puts its live state on its stage element (`stage.bmx`, `stage.hammer`, `stage.discus`) for tests and playtesting, and the BMX physics is exported as `Games.get('bmx').sim` so it can be tuned without drawing.
- Register with `Games.register(name, { title, help, mount })` in `js/games/`; `mount` returns a function that stops the game.

## Words

Every word in the recipes is a placeholder until you replace it.

- Each moment and item is tagged `life` or `work`.
- On a laptop, an act's moments all show in its story panel without scrolling. The panel runs the full height of the act beside the scene, and its moments tighten on screens under 780 px and 700 px tall. The longest act today, Party leader, has four moments and about 650 letters with three items, and it fits down to 1280 × 680, the smallest size `npm test` checks. If new words fail that check, shorten them. On a phone the panel scrolls to the newest moment.
- An item's line is one sentence in your own voice.
- Employers and schools are named, with real titles and dates from Joe's resume, in each act's `quests` for the quest log at the end of the page. For anything more exact, the quest log points to LinkedIn.
