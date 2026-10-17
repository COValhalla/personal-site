# 0007. Visit counts with GoatCounter, off unless a person visits the published site

Status: Accepted, 2026-10-14

## Context

The site's owner wants to know how far visitors get: which acts they reach, whether they open the sheet, whether they reach the ending and which contact link they click. A page-view counter alone cannot answer that, and a counter that sets cookies needs a consent banner, which would change the visitor's page. The site is published at `covalhalla.github.io`, and the owner chose to count there now rather than wait for a custom address. The owner chose GoatCounter.

## Decision

`js/addons/visits.js` is the first add-on: a script loaded after the story that listens to it and can be removed without changing it. It counts with GoatCounter, which sets no cookies and keeps no personal data, so the page needs no banner. GoatCounter's own script is kept unchanged in `vendor/goatcounter/`, so the counter's server, `covalhalla.goatcounter.com`, is the only outside address the page reaches.

It counts the page view, each act reached (half its screen in view), the sheet opened (the story's `sheet` event), the ending reached, each contact link clicked and the email address copied. Each is counted once per page view.

It loads nothing and sends nothing unless all of these hold:

- the page is served from `https://covalhalla.github.io`, so a file, a local server or a fork's own copy is never counted;
- the browser is not automated, so the smoke test is never counted;
- the browser does not ask not to be tracked, by Do Not Track or Global Privacy Control.

The dashboard is private to the owner's GoatCounter account; its public view stays off.

## Consequences

- The story page looks the same: the add-on draws nothing.
- The smoke test blocks every outside address and fails if the page asks for one. It also serves the page as if from the published address, stands in for the counter's server, and checks what a visitor sends and that a browser asking not to be tracked sends nothing.
- Counts start only once the owner creates the GoatCounter site with the code `covalhalla`. Until then the page's counts are refused by GoatCounter and nothing else changes.
- Visitors who block GoatCounter, or ask not to be tracked, are not counted, so the numbers are a floor.
- Moving to another web address splits the counts and needs the address in `js/addons/visits.js` changed.
- Revisit this if the owner wants counts that need a cookie or an account, or a second counter.
