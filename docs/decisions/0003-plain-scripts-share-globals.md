# 0003. Plain scripts share globals

Status: Accepted, 2026-10-14

## Context

Without modules (see [0002](0002-recipes-as-javascript.md)), scripts cannot import each other. Each one must find the others some other way.

## Decision

Each script attaches one object to `window` (`Story`, `Pixel`, `Scenes`, `Sheet`, `WorldMap`, `Belt`, `Acts`, `Sound`, `Games`, `TypingRace`) and wraps its code in an immediately invoked function, so nothing else leaks. `index.html` lists the scripts in dependency order.

## Consequences

- A script that uses another's global must sit after it in `index.html`, and nothing enforces that order except the page failing when it is wrong.
- `Sheet.el` is shared by eight files as the page's DOM helper.
- The cost is known and recorded in `ARCHITECTURE.md` under "Known limits". Replacing the globals needs either modules or an explicit loader, which would reopen [0001](0001-no-build-step.md) or [0002](0002-recipes-as-javascript.md).
