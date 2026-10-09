/*
 * Act I recipe. See README.md, "Recipes", for every field.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'childhood',
  numeral: 'I',
  title: 'Childhood',
  years: 'Ages 8 to 14',
  summary: 'BMX racing, the family business and Diablo 2.',
  // A bright, Saturday-morning scheme: sunny orange with a sky-blue accent.
  color: { name: 'Sunny orange', light: '#ffc46b', base: '#ff8a1f', shade: '#c25a0a', accent: '#3fa9f5' },
  theme: 'light',
  scene: 'bmx-track',
  // The hero's hair and beard for this act (styles in js/pixel.js: HAIR and BEARD).
  hero: { gear: 'helmet', title: 'BMX kid', hair: 'short', beard: 'none' },
  // Each moment can give one of this act's items (item) and play a scene animation (cue).
  beats: [
    { tag: 'life', text: 'Raced BMX most weekends: gate drops, rollers and scraped knees.', item: 'bmx-bike', cue: 'race' },
    { tag: 'work', text: 'Worked in the family business and learned where every tool lived.', item: 'shop-wrench', cue: 'shop' },
    { tag: 'life', text: 'Stayed up too late playing Diablo 2 and learned what an inventory is for.', cue: 'night' },
  ],
  unlock: { banner: 'Level 1', say: 'New class: BMX kid' },
  items: [
    {
      id: 'bmx-bike', name: 'BMX bike', sprite: 'bike', tag: 'life',
      line: 'The gate drops whether you feel ready or not.',
      adds: { grit: 2, outdoors: 1 },
      photo: null,
      game: 'bmx',
    },
    {
      id: 'shop-wrench', name: 'Shop wrench', sprite: 'wrench', tag: 'work',
      line: 'The family business handed me a wrench before it handed me a paycheck.',
      adds: { engineering: 1, grit: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'riding', name: 'Riding', parents: [], line: 'Balance, speed and getting back on.' },
    { id: 'fixing', name: 'Fixing', parents: [], line: 'Taking things apart and putting them back better.' },
  ],
  game: 'bmx',
  photos: [],
});
