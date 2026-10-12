/*
 * Act I recipe. See README.md, "Recipes", for every field.
 */
Story.addAct({
  id: 'childhood',
  numeral: 'I',
  title: 'Open world',
  years: 'Elementary and middle school',
  quests: [
    { what: 'Ran a crew of new-hire butchers in the family business', when: 'Ages 12 to 16' },
  ],
  // A bright, Saturday-morning scheme: sunny orange with a sky-blue accent.
  color: { name: 'Sunny orange', light: '#ffc46b', base: '#ff8a1f', shade: '#c25a0a', accent: '#3fa9f5' },
  theme: 'light',
  scene: 'bmx-track',
  // One scene per moment, then the level-up: the camera dives through a door into each next place.
  stages: ['bmx-track', 'bmx-shop', 'bmx-sheet'],
  // The hero's hair and beard for this act (styles in js/pixel.js: HAIR and BEARD).
  hero: { gear: 'helmet', title: 'Crew lead', hair: 'short', beard: 'none' },
  // Each moment can give one of this act's items (item) and play a scene animation (cue).
  beats: [
    { tag: 'life', text: 'Baseball and basketball, sure, but mostly I roamed town on my scooter with friends: wheelies, staircase jumps, music playing. On weekends I raced BMX.', item: 'bmx-bike', cue: 'race' },
    { tag: 'work', text: "Middle school: three towns met in one school, and I hadn't found my group yet. At the family shop I had a crew: every busy season from 12 to 16, I ran the butchers, mostly new hires I trained on the fly.", item: 'apron', cue: 'crew' },
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
