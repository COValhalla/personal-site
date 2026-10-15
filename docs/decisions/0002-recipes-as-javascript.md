# 0002. Recipes are JavaScript

Status: Accepted, 2026-10-14

## Context

The story lives in `recipes/`. Its natural format would be JSON or ES modules, but a page opened from a `file://` address cannot load modules or fetch JSON. Checked in Chrome: both are refused, so the page would stop working when double-clicked.

## Decision

Each recipe is a plain `.js` file that calls `Story.addAct(...)` (or `Story.site(...)`), so it loads like any other script. Recipes may carry comments that explain each field.

## Consequences

- The recipes run as code. A recipe that does something surprising can change the page, so review them as code.
- The fields are described in the README's "Recipes" table, and `Story.validate` catches a recipe that names something that does not exist.
- Anything that needs a server, such as a CMS or fetching recipes at run time, would need this decision reopened.
