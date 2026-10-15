# 0006. Each script declares what it needs

Status: Accepted, 2026-10-14. Replaces the first two consequences of [0003](0003-plain-scripts-share-globals.md). Its scene `Needs:` lines are replaced by [0008](0008-one-file-per-scene.md).

## Context

The scripts share globals ([0003](0003-plain-scripts-share-globals.md)), so the only record of which script needs which was the order in `index.html`, and a wrong order showed up only as a broken page. The element helper lived in `sheet.js` and eight files borrowed it, and the workshop kept its own copy. The pixel helpers lived inside `scenes.js`, the world map kept its own `rect`, and no scene said which helpers it drew with. `acts.js` and `sheet.js` changed `Story.state` directly, next to the events that announce it.

## Decision

- Every page script opens with a `Needs:` line naming the globals that must load before it, and a `Needs after start-up:` line for those that load after it and are read only once the page runs. Every scene in `js/scenes.js` opens with a `Needs:` line naming the helpers, props and globals it uses.
- `tests/unit/needs.test.mjs` checks every line against both pages' script order and the script's code, both ways: nothing used is left out and nothing named is unused.
- Shared helpers live in their own scripts: `js/dom.js` (`Dom`) builds elements, and `js/draw.js` (`Draw`) is the drawing kit for the scenes and the world map.
- Only `js/story.js` changes the story's state, through `give`, `light`, `unlock`, `seeAll` and `rewind`. Everyone else reads it through read-only views.

## Consequences

- A script or scene can be read on its own: its first lines say what it relies on, and the test keeps them true.
- The order is still written by hand in each page. The lines check it rather than build it, so there is still no loader and no build step ([0001](0001-no-build-step.md)).
- The check reads source text. It knows globals by the `window.Name =` that attaches them, so a script that attached a global some other way would escape it.
- The games are left as they are while game work waits: they keep `Sheet.el`, `Scenes.mix` and `Scenes.rng`, which stay as aliases, and have no Needs lines yet.
