/*
 * Act III recipe. See README.md, "Recipes", for every field.
 */
Story.addAct({
  id: 'college',
  numeral: 'III',
  title: 'Training arc',
  years: 'College, 2011 to 2015',
  // Magenta for college; the track's stands keep their navy.
  color: { name: 'Magenta', light: '#f29ad0', base: '#d6449a', shade: '#962d6b' },
  theme: 'light',
  scene: 'track',
  stages: ['track', 'track', 'track', 'sheet'],
  // Bald with a goatee in college.
  hero: { gear: 'headband', title: 'Hammer thrower', hair: 'bald', beard: 'goatee' },
  beats: [
    { tag: 'life', text: 'Between high school and college I learned a new event, the hammer throw. It became my main event: four years of early lifts and afternoon practice.', item: 'hammer', cue: 'throw' },
    { tag: 'work', text: 'I chose chemical engineering at Missouri S&T because it was the harder road. My teammates were my study group on long bus rides, and I graduated an Academic All-American.', item: 'flask', cue: 'study' },
    { tag: 'work', text: 'Two summers interning in oil and gas in Texas taught me how engineers really work: solve a real problem, then sell the fix with cost and ROI models. Each summer ended with a talk to about 50 executives.', cue: 'texas' },
  ],
  unlock: { banner: 'Level 3', say: 'New class: Hammer thrower' },
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
    { id: 'harder-thing', name: 'Harder thing', parents: ['throwing'], moment: 2, line: 'Picking the harder road on purpose, then putting in the reps.' },
    { id: 'chemistry', name: 'Chemistry', parents: ['process'], line: 'How things react, and how to make them react on purpose.' },
    { id: 'pitching', name: 'Pitching', parents: ['leading', 'chemistry'], moment: 3, line: 'Solving the problem, then selling the fix to the room.' },
  ],
  game: 'hammer',
  photos: [],
});
