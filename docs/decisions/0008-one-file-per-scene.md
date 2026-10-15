# 0008. One file per scene

Status: Accepted, 2026-10-15. Replaces the scene `Needs:` lines of [0006](0006-scripts-declare-what-they-need.md).

## Context

Every scene lived in `js/scenes.js`: 17 scenes, the shared props, the character sheet and the code that mounts a scene, in about 1,730 lines. A change to one scene was a change to that file, and each scene's `// Needs:` line was a comment a test had to find by its indentation.

## Decision

- Each scene is its own file in `js/scenes/`, named after the scene (the character sheet, `sheet`, is `character-sheet.js`), and calls `Scenes.add(name, scene)` once, the way each recipe calls `Story.addAct`.
- `js/scenes/index.js` is the registry. It attaches `Scenes`, refuses a second scene with a name already taken, draws a plain floor for a name with no scene, and mounts scenes on canvases. A scene that depends on the act, the character sheet, is registered as a function of the act.
- `js/scenes/props.js` attaches `Props`, the props several scenes share.
- Each scene file opens with a page script's `Needs:` line for the globals it uses, and takes each kit helper and prop by name (`const { rect, text } = Draw;`). The test checks those names against the scene's code both ways, in place of the scene `Needs:` comment.
- `index.html` and `workshop.html` list the scene files by hand, the registry and props first, in the same order. A test fails if the two lists differ or leave out a file in `js/scenes/`.

## Consequences

- A change to one scene touches one file of about 35 to 135 lines.
- A new scene is a new file and a new script tag in both pages, as a new recipe is. There is still no loader and no build step ([0001](0001-no-build-step.md)).
- The order of the script tags is the order of `Scenes.names`, which is the order the workshop shows the scenes in.
- `Props` is one more global. The games still read `Scenes.mix` and `Scenes.rng`.
