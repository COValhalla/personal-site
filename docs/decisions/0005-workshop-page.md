# 0005. A workshop page shows each scene, cue, sprite and gear on its own

Status: Accepted, 2026-10-14

## Context

The story draws its scenes, animations, sprites and gear only in the order the story reaches them, so a scene or cue that is hard to reach is hard to check by eye. The site's owner wanted a way to look at every piece alone, and to show a reader how the art is built.

## Decision

`workshop.html` is a second, public page. It loads the same art, scenes and recipes as `index.html`, minus the page's motion, sheet, games and boot scripts, and draws every scene (with a button for each of its cues), every item sprite and every piece of hero gear. It is linked from the README only, not from the story. Its one script, `js/workshop.js`, attaches no global; it is loaded by that page alone.

## Consequences

- The workshop shows the art as it is in the repository, so changing a scene or sprite changes the workshop too. It has no separate copy to keep in step.
- The workshop is published with the rest of the site, so its address is public.
- The workshop is not part of the story: it does not unlock acts, keep state or count visits.
- Revisit this if the workshop starts to need its own data, such as a list of every recipe, rather than the art alone.
