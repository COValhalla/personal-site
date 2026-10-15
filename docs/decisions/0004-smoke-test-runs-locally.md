# 0004. The smoke test runs locally

Status: Accepted, 2026-10-14

## Context

`npm test` opens the page in an installed Chrome and runs about four minutes of scrolling, layout and game checks. The site's owner chose to keep it as a check run on a developer's machine rather than in CI.

## Decision

The smoke test is a local check. The publish workflow in `.github/workflows/pages.yml` packages the site on each pull request and publishes on each merge to `main`, and it does not run `npm test`.

## Consequences

- A pull request can merge without the smoke test having run on it, so the author runs `npm test` before opening it and states the result in the pull request.
- CI stays fast and does not depend on a browser version.
- Revisit this if more than one person changes the site or if a merge breaks the page without anyone noticing.
