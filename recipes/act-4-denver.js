/*
 * Act IV recipe. See README.md, "Recipes", for every field.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'denver',
  numeral: 'IV',
  title: 'Denver',
  years: 'Mountains and medical devices',
  summary: 'Moved for the mountains; capital projects at a medical-device company, a new plant in Vietnam, then new product introduction.',
  color: { name: 'Pine green', light: '#7fd09c', base: '#3fa66b', shade: '#286f46' },
  theme: 'light',
  scene: 'mountains',
  hero: { gear: 'beanie', title: 'Project engineer', hair: 'bald', beard: 'goatee' },
  beats: [
    { tag: 'life', text: 'Followed friends to Denver for the mountains: skiing and climbing.', item: 'skis', cue: 'ski' },
    { tag: 'work', text: 'Joined a medical-device company in capital projects and helped build a new plant in Vietnam.', item: 'passport', cue: 'plane' },
    { tag: 'work', text: 'Moved into new product introduction: new devices from prototype to production line.', item: 'prototype', cue: 'line' },
  ],
  unlock: { banner: 'Level 4', say: 'New class: Project engineer' },
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
    { id: 'mountains', name: 'Mountains', parents: ['riding', 'throwing'], line: 'Reading terrain and weather, and turning around in time.' },
    { id: 'capital-projects', name: 'Capital projects', parents: ['plant-ops', 'materials'], line: 'Building a plant from an empty lot, across an ocean.' },
    { id: 'new-products', name: 'New products', parents: ['capital-projects', 'materials'], line: 'Getting a new device from the bench to the line.' },
  ],
  game: null,
  photos: [],
});
