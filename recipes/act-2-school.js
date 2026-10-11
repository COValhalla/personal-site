/*
 * Act II recipe. See README.md, "Recipes", for every field.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'school',
  numeral: 'II',
  title: 'Training arc',
  years: 'College, 2011 to 2015',
  quests: [
    { what: 'B.S. Chemical Engineering', where: 'Missouri University of Science and Technology', when: 'Aug 2011 to May 2015' },
    { what: 'Academic All-American, hammer throw' },
    { what: 'Two summer internships in oil and gas', where: 'Texas' },
  ],
  // Varsity colors: track red with a navy accent. Placeholders until Joe names his school colors.
  color: { name: 'Track red', light: '#f08a75', base: '#e0533d', shade: '#a3352a', accent: '#24366b' },
  theme: 'light',
  scene: 'track',
  // Bald with a goatee in college.
  hero: { gear: 'headband', title: 'Hammer thrower', hair: 'bald', beard: 'goatee' },
  beats: [
    { tag: 'life', text: 'Between high school and college I learned a new event, the hammer throw. It became my main event: four years of early lifts and afternoon practice.', item: 'hammer', cue: 'throw' },
    { tag: 'work', text: 'I chose chemical engineering at Missouri S&T because it was the harder road. My teammates were my study group on long bus rides, and I graduated an Academic All-American.', item: 'flask', cue: 'study' },
    { tag: 'work', text: 'Two summers interning in oil and gas in Texas taught me how engineers really work: solve a real problem, then sell the fix with cost and ROI models. Each summer ended with a talk to about 50 executives.', cue: 'texas' },
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
