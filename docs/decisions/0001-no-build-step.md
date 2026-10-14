# 0001. No build step

Status: Accepted, 2026-10-14

## Context

The site is a personal page that a reader should be able to inspect and run without tooling. Its first version opened by double-clicking `index.html`, and a clone of the repository is a working site.

## Decision

The site has no bundler, transpiler or runtime package. The files that are committed are the files the browser runs, and GSAP lives in `vendor/gsap/` so the page works offline. Publishing copies the committed files to GitHub Pages as they are.

## Consequences

- Anyone can read the running code in the repository, and a fork can be opened with a double-click.
- Scripts are loaded with plain script tags in a fixed order, which is the cost of the next two decisions.
- Tooling is limited to the browser test's dev dependency, `playwright-core`.
- Revisit this only if the site must run behind a server or needs a feature that plain scripts cannot give.
