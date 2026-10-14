/*
 * Act V recipe. See README.md, "Recipes", for every field.
 */
Story.addAct({
  id: 'denver',
  numeral: 'V',
  title: 'Mountains and factories',
  years: 'Denver, 2018 to 2022',
  color: { name: 'Pine green', light: '#7fd09c', base: '#3fa66b', shade: '#286f46' },
  theme: 'light',
  scene: 'mountains',
  stages: ['mountains', 'mountains', 'mountains', 'sheet'],
  hero: { gear: 'beanie', title: 'Project engineer', hair: 'bald', beard: 'goatee' },
  beats: [
    { tag: 'life', text: 'In 2018 I moved again, following friends to Denver for the mountains. Skiing and climbing taught me to read terrain and weather, and to turn around in time.', item: 'skis', cue: 'ski' },
    { tag: 'work', text: 'At Terumo BCT, a medical-device maker, our capital projects team filled an empty new plant in Vietnam with production lines. I led over $7 million of equipment projects, on time and on budget.', item: 'passport', cue: 'plane' },
    { tag: 'work', text: 'Promoted into new product introduction, I became the bridge between design and the factory floor, and led 10 engineers moving hundreds of products to new materials.', item: 'prototype', cue: 'line' },
  ],
  unlock: { banner: 'Level 5', say: 'New class: Project engineer' },
  items: [
    {
      id: 'skis', name: 'Skis', sprite: 'skis', tag: 'life',
      line: 'Powder days are the best meetings I never scheduled.',
      adds: { outdoors: 2, wanderlust: 1 },
      photo: null,
    },
    {
      id: 'passport', name: 'Passport', sprite: 'passport', tag: 'work',
      line: 'A new plant on the other side of the world, built one site visit at a time.',
      adds: { wanderlust: 2, engineering: 1 },
      photo: null,
    },
    {
      id: 'prototype', name: 'Prototype', sprite: 'device', tag: 'work',
      line: 'The first one off the line is never the last version.',
      adds: { engineering: 1, product: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'mountains', name: 'Mountains', parents: ['riding', 'throwing'], moment: 1, line: 'Reading terrain and weather, and turning around in time.' },
    { id: 'capital-projects', name: 'Capital projects', parents: ['plant-ops', 'materials'], moment: 2, line: 'Building a plant from an empty lot, across an ocean.' },
    { id: 'new-products', name: 'New products', parents: ['capital-projects', 'materials', 'pitching'], moment: 3, line: 'Getting a new device from the bench to the line.' },
  ],
  game: null,
  photos: [],
});
