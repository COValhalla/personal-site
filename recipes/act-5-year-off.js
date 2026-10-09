/*
 * Act V recipe. See README.md, "Recipes", for every field.
 * The year off is its own act and the turning point of the story.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'year-off',
  numeral: 'V',
  title: 'Year off',
  years: 'The turning point',
  summary: 'A fun year away from work, long days studying at the library, and a software bootcamp.',
  color: { name: 'Amber', light: '#f5cf66', base: '#e5ac1f', shade: '#a57712' },
  theme: 'light',
  scene: 'library',
  // The beard and the long hair came with the year off: they grow moment by moment (look).
  hero: { gear: 'headphones', title: 'Bootcamper', hair: 'bun', beard: 'long' },
  beats: [
    { tag: 'life', text: 'Took a year off work, and it was a fun one.', cue: 'fun', look: { hair: 'short', beard: 'stubble' } },
    { tag: 'work', text: 'Spent long days at the library, studying.', item: 'library-books', cue: 'study', look: { beard: 'short' } },
    { tag: 'work', text: 'Went through a software bootcamp and turned years of side scripts into a craft.', item: 'laptop', cue: 'code', look: { beard: 'full' } },
    { tag: 'work', text: 'Learned to explain every bug out loud.', item: 'rubber-duck', cue: 'duck', look: { hair: 'bun', beard: 'long' } },
  ],
  unlock: { banner: 'Level 5', say: 'Turning point: Bootcamper', pop: 'Turning point!' },
  items: [
    {
      id: 'library-books', name: 'Library books', sprite: 'books', tag: 'work',
      line: 'The quiet floor of the library was my first office in software.',
      adds: { code: 1, grit: 1 },
      photo: null,
    },
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
    { id: 'code', name: 'Code', parents: ['fixing', 'plant-ops'], line: 'Making the computer do the boring part.' },
    { id: 'debugging', name: 'Debugging', parents: ['code', 'plant-ops'], line: 'Troubleshooting, the same way as on the plant floor.' },
  ],
  game: null,
  photos: [],
});
