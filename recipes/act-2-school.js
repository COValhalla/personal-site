/*
 * Act II recipe. See README.md, "Recipes", for every field.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'school',
  numeral: 'II',
  title: 'School and college',
  years: 'High school and college',
  summary: 'Hammer throw in track and field, chemical engineering, two oil-and-gas internships in Texas.',
  // Varsity colors: track red with a navy accent. Placeholders until Joe names his school colors.
  color: { name: 'Track red', light: '#f08a75', base: '#e0533d', shade: '#a3352a', accent: '#24366b' },
  theme: 'light',
  scene: 'track',
  hero: { gear: 'headband', title: 'Hammer thrower' },
  beats: [
    { tag: 'life', text: 'Threw the hammer for high school and college track and field.', item: 'hammer', cue: 'throw' },
    { tag: 'work', text: 'Studied chemical engineering.', item: 'flask', cue: 'study' },
    { tag: 'work', text: 'Spent two summers interning in oil and gas in Texas.', cue: 'texas' },
  ],
  unlock: { banner: 'Level 2', say: 'New class: Hammer thrower' },
  items: [
    {
      id: 'hammer', name: 'Hammer', sprite: 'hammer', tag: 'life',
      line: 'Four turns, one release. Everything happens in the last turn.',
      adds: { grit: 2 },
      photo: null,
      game: 'hammer',
    },
    {
      id: 'flask', name: 'Flask', sprite: 'flask', tag: 'work',
      line: 'Chemical engineering: what changes when you add heat, pressure or a deadline.',
      adds: { engineering: 2, wanderlust: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'throwing', name: 'Throwing', parents: ['riding'], line: 'Timing, rhythm and one clean release.' },
    { id: 'chemistry', name: 'Chemistry', parents: ['fixing'], line: 'How things react, and how to make them react on purpose.' },
  ],
  game: 'hammer',
  photos: [],
});
