/*
 * Act VI recipe. See README.md, "Recipes", for every field.
 * Purple is for this act's own items; the sheet ends in every color.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'now',
  numeral: 'VI',
  title: 'Party leader',
  years: 'Since 2023',
  summary: 'First dedicated software engineer at Wavelynx, builder of the LEAF Verified credential platform, now a senior product manager.',
  color: { name: 'Purple', light: '#b69af0', base: '#8a63d2', shade: '#5d3f9a' },
  theme: 'light',
  scene: 'studio',
  // No hat now, so the bun shows; a badge on the shirt.
  hero: { gear: 'badge', title: 'Product engineer', hair: 'bun', beard: 'long' },
  beats: [
    { tag: 'work', text: 'In January 2023, Wavelynx hired me as its first dedicated software engineer. I took the founders\' undocumented systems and built them into a stable, recoverable platform.', item: 'compass', cue: 'listen' },
    { tag: 'work', text: 'I built the LEAF Verified credential platform on my own, end to end. It won a SIA New Products and Solutions award at ISC West, and its patents are pending.', item: 'roadmap', cue: 'loop' },
    { tag: 'work', text: 'Promoted twice in three years, to senior product manager. I coached our team and executives on a new way to build products, and I still build: a Java Card prototype reached an enterprise customer a week after I made it.', item: 'two-hats', cue: 'team' },
    { tag: 'life', text: 'The kid who raced the typing game in the computer lab now builds the product, and leads the team that ships it.', cue: 'shine' },
  ],
  unlock: { banner: 'Level 6', say: 'New class: Product engineer' },
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
