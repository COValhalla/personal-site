/*
 * Act III recipe. See README.md, "Recipes", for every field.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'first-jobs',
  numeral: 'III',
  title: 'First jobs',
  years: 'Kansas City, then Sioux City',
  summary: 'Materials engineer in Kansas City, then plant engineer in Sioux City, Iowa.',
  color: { name: 'Blueprint blue', light: '#7fb0ee', base: '#3b7dd8', shade: '#24539c' },
  theme: 'light',
  scene: 'plant',
  hero: { gear: 'hardhat', title: 'Plant engineer', hair: 'bald', beard: 'goatee' },
  beats: [
    { tag: 'work', text: 'Materials engineer in Kansas City.', item: 'calipers', cue: 'measure' },
    { tag: 'work', text: 'Plant engineer in Sioux City, Iowa.', item: 'hard-hat', cue: 'plant' },
    { tag: 'life', text: 'Traveled a lot and learned on the road.', cue: 'road' },
  ],
  unlock: { banner: 'Level 3', say: 'New class: Plant engineer' },
  items: [
    {
      id: 'calipers', name: 'Calipers', sprite: 'calipers', tag: 'work',
      line: 'Measure twice. Then check the thing you measured with.',
      adds: { engineering: 2 },
      photo: null,
    },
    {
      id: 'hard-hat', name: 'Hard hat', sprite: 'hardhat', tag: 'work',
      line: 'The plant floor is where the drawings meet reality.',
      adds: { engineering: 1, grit: 1, wanderlust: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'materials', name: 'Materials', parents: ['chemistry'], line: 'Why parts bend, crack or hold.' },
    { id: 'plant-ops', name: 'Plant ops', parents: ['fixing', 'chemistry'], line: 'Keeping a line running, shift after shift.' },
  ],
  game: null,
  photos: [],
});
