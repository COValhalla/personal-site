/*
 * Act I recipe. See README.md, "Recipes", for every field.
 * Needs: Story
 */
Story.addAct({
  id: 'childhood',
  numeral: 'I',
  title: 'Open world',
  years: 'Elementary and middle school',
  // A bright, Saturday-morning scheme: sunny orange with a sky-blue accent.
  color: { name: 'Sunny orange', light: '#ffc46b', base: '#ff8a1f', shade: '#c25a0a', accent: '#3fa9f5' },
  theme: 'light',
  scene: 'bmx-track',
  // One scene per moment, then the level-up: the camera dives through a door into each next place.
  stages: ['bmx-track', 'bmx-shop', 'bmx-sheet'],
  // The hero's hair and beard for this act (styles in engine/pixel.js: HAIR and BEARD).
  hero: { gear: 'helmet', title: 'Crew lead', hair: 'short', beard: 'none' },
  // Each moment can give one of this act's items (item) and play a scene animation (cue).
  beats: [
    { tag: 'life', text: 'I rode my bike all over town with friends. It taught me independence, and every jump and wheelie made me more confident, which carried straight into BMX racing.', item: 'bmx-bike', cue: 'race' },
    { tag: 'work', text: "Every busy season at the family shop, I ran the crew of butchers: mostly new hires and local kids, trained on the fly while the product kept coming in.", item: 'apron', cue: 'crew' },
  ],
  unlock: { banner: 'Level 1', say: 'New class: Crew lead' },
  items: [
    {
      id: 'bmx-bike', name: 'BMX bike', sprite: 'bike', tag: 'life',
      line: 'The gate drops whether you feel ready or not.',
      adds: { grit: 2, outdoors: 1 },
      photo: null,
      game: 'bmx',
    },
    {
      id: 'apron', name: 'Apron', sprite: 'apron', tag: 'work',
      line: 'Every new hire got an apron, a quick lesson and a spot at the table.',
      adds: { grit: 2, product: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'riding', name: 'Riding', parents: [], moment: 1, line: 'Balance, speed and getting back on.' },
    { id: 'teaching', name: 'Teaching', parents: [], moment: 2, line: 'Showing a new hire the job while the work keeps coming in.' },
  ],
  game: 'bmx',
  photos: [],
});
