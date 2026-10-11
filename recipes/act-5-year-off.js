/*
 * Act V recipe. See README.md, "Recipes", for every field.
 * The year off is its own act and the turning point of the story.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'year-off',
  numeral: 'V',
  title: 'The respec',
  years: 'Year off, 2022',
  summary: 'Left a safe senior engineering path to learn full-stack JavaScript with The Odin Project.',
  color: { name: 'Amber', light: '#f5cf66', base: '#e5ac1f', shade: '#a57712' },
  theme: 'light',
  scene: 'library',
  // The beard and the long hair came with the year off: they grow moment by moment (look).
  hero: { gear: 'headphones', title: 'Self-taught developer', hair: 'bun', beard: 'long' },
  beats: [
    { tag: 'life', text: 'In 2022 I was a senior engineer on a safe path. I left it to respec: in games, that means taking back your skill points and spending them on a new build.', cue: 'fun', look: { hair: 'short', beard: 'stubble' } },
    { tag: 'work', text: 'From May to December, to focus fully on learning new skills, I taught myself full-stack JavaScript with The Odin Project, building a library app, a weather app, a battleship game and a blog API.', item: 'laptop', cue: 'code', look: { beard: 'full' } },
    { tag: 'work', text: 'And I learned to explain every bug out loud.', item: 'rubber-duck', cue: 'duck', look: { hair: 'bun', beard: 'long' } },
  ],
  unlock: { banner: 'Level 5', say: 'Turning point: Self-taught developer', pop: 'Turning point!' },
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
