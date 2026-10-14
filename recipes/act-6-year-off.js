/*
 * Act VI recipe. See README.md, "Recipes", for every field.
 * The year off is its own act and the turning point of the story.
 */
Story.addAct({
  id: 'year-off',
  numeral: 'VI',
  title: 'The leap',
  years: 'Year off, 2022',
  color: { name: 'Amber', light: '#f5cf66', base: '#e5ac1f', shade: '#a57712' },
  theme: 'light',
  scene: 'library',
  stages: ['library', 'library', 'library', 'sheet'],
  // The beard and the long hair came with the year off: they grow moment by moment (look).
  hero: { gear: 'headphones', title: 'Self-taught developer', hair: 'bun', beard: 'long' },
  beats: [
    { tag: 'life', text: 'By 2022 I was a senior engineer at a medical-device maker, on a safe path up. But the code I wrote on the side had become the best part of every job. So I quit, with no job lined up, and took the leap: a year to rebuild my skills around code.', cue: 'fun', look: { hair: 'short', beard: 'stubble' } },
    { tag: 'work', text: 'From May to December I taught myself full-stack JavaScript with The Odin Project: a library app, a weather app, a battleship game and a blog API. No boss, no paycheck, just whether it ran.', item: 'laptop', cue: 'code', look: { beard: 'full' } },
    { tag: 'work', text: "Had I stayed, I'd probably have moved into engineering leadership: manager, then director. I don't regret the trade: I learned to explain every bug out loud, and to build the thing myself.", item: 'rubber-duck', cue: 'duck', look: { hair: 'bun', beard: 'long' } },
  ],
  unlock: { banner: 'Level 6', say: 'Turning point: Self-taught developer', pop: 'Turning point!' },
  items: [
    {
      id: 'laptop', name: 'Laptop', sprite: 'laptop', tag: 'work',
      line: 'I had written small scripts for years. This year I learned to build.',
      adds: { code: 2 },
      photo: null,
    },
    {
      id: 'rubber-duck', name: 'Rubber duck', sprite: 'duck', tag: 'work',
      line: 'Explain the bug to the duck. The duck always knows.',
      adds: { code: 1, grit: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'debugging', name: 'Debugging', parents: ['code', 'plant-ops'], line: 'Troubleshooting, the same way as on the plant floor.' },
    { id: 'curiosity', name: 'Curiosity', parents: [], moment: 1, line: 'A whole year of following what I wanted to learn.' },
  ],
  game: null,
  photos: [],
});
