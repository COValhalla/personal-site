# GoatCounter

`count.js` is GoatCounter's counting script, copied unchanged from https://gc.zgo.at/count.js on 2026-10-14 (SHA-256 `792b7abd26c1fb6ae62906833e09a301251e2641816e69e4f95aba518f3fe3f0`). It is released under the ISC license, as its first lines say.

Keeping it here means the counter's own server is the only outside address the page talks to. `engine/addons/visits.js` loads it, and only on the published site ([ADR 0007](../../docs/decisions/0007-visit-counts.md)).
