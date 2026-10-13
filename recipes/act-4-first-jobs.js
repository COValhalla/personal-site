/*
 * Act IV recipe. See README.md, "Recipes", for every field.
 */
Story.addAct({
  id: 'first-jobs',
  numeral: 'IV',
  title: 'High stakes',
  years: 'First jobs, 2015 to 2018',
  quests: [
    { what: 'Materials Engineer', where: 'Honeywell FM&T, Kansas City National Security Campus', when: 'Jun 2015 to Jul 2016' },
    { what: 'Process Engineer', where: 'Gelita USA, Sioux City', when: 'Jul 2016 to Mar 2018' },
  ],
  color: { name: 'Blueprint blue', light: '#7fb0ee', base: '#3b7dd8', shade: '#24539c' },
  theme: 'light',
  scene: 'plant',
  hero: { gear: 'hardhat', title: 'Process engineer', hair: 'bald', beard: 'goatee' },
  beats: [
    { tag: 'work', text: 'My first job out of school: materials engineer at the Kansas City National Security Campus, making sure parts were strong enough for the systems they went into. The work needed a security clearance.', item: 'calipers', cue: 'measure' },
    { tag: 'work', text: "That's where I started coding: 3D models and analysis in MATLAB, and my first machine learning model." },
    { tag: 'work', text: 'My clearance stalled, so rather than wait I took a detour to Sioux City as a process engineer at Gelita. It paid off: I trained over 250 operators, and my root-cause study saved a $200,000 equipment project.', item: 'hard-hat', cue: 'plant' },
  ],
  unlock: { banner: 'Level 4', say: 'New class: Process engineer' },
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
    { id: 'plant-ops', name: 'Plant ops', parents: ['teaching', 'chemistry', 'harder-thing'], line: 'Keeping a line running, shift after shift.' },
    { id: 'code', name: 'Code', parents: ['gaming', 'typing', 'materials'], moment: 2, line: 'Making the computer do the boring part.' },
    { id: 'adapting', name: 'Adapting', parents: ['riding'], moment: 3, line: 'Learned on the road: a new town and a new crew, the same job.' },
  ],
  game: null,
  photos: [],
});
