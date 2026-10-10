/*
 * Act VI recipe. See README.md, "Recipes", for every field.
 * Purple is for this act's own items; the sheet ends in every color.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'now',
  numeral: 'VI',
  title: 'Now',
  years: '2.5 years in software',
  summary: 'A product engineer who found what the business needed and built it, now a senior product manager guiding the team.',
  color: { name: 'Purple', light: '#b69af0', base: '#8a63d2', shade: '#5d3f9a' },
  theme: 'light',
  scene: 'studio',
  // No hat now, so the bun shows; a badge on the shirt.
  hero: { gear: 'badge', title: 'Senior product manager', hair: 'bun', beard: 'long' },
  beats: [
    { tag: 'work', text: 'Product engineer: sat with the business to learn what it really needed.', item: 'two-hats', cue: 'listen' },
    { tag: 'work', text: 'Then built it myself: decide, build, ship, and go round again.', item: 'compass', cue: 'loop' },
    { tag: 'work', text: 'Senior product manager: now I set direction and guide the rest of the team.', item: 'roadmap', cue: 'team' },
    { tag: 'life', text: 'Two and a half years in software, still adding to the toolbox.', cue: 'shine' },
  ],
  unlock: { banner: 'Level 6', say: 'New class: Senior product manager' },
  items: [
    {
      id: 'two-hats', name: 'Two hats', sprite: 'hats', tag: 'work',
      line: 'Product person in the morning, engineer in the afternoon.',
      adds: { product: 1, code: 1 },
      photo: null,
    },
    {
      id: 'compass', name: 'Compass', sprite: 'compass', tag: 'work',
      line: 'Nobody handed me a spec. I found the direction and built toward it.',
      adds: { product: 2, wanderlust: 1 },
      photo: null,
    },
    {
      id: 'roadmap', name: 'Roadmap', sprite: 'roadmap', tag: 'work',
      line: 'A roadmap is a promise about the order of things, not the dates.',
      adds: { product: 2, engineering: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'product-engineering', name: 'Product engineering', parents: ['code', 'new-products', 'curiosity'], line: 'Finding what the business needs, then building it.' },
    { id: 'product', name: 'Product', parents: ['throwing', 'capital-projects', 'mountains', 'debugging', 'reading'], line: 'Ties every branch together.' },
    { id: 'guiding', name: 'Guiding a team', parents: ['product', 'plant-ops', 'adapting'], moment: 4, line: 'Setting a direction the whole team can build toward.' },
  ],
  game: null,
  photos: [],
});
