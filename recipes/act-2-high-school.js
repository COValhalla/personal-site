/*
 * Act II recipe. See README.md, "Recipes", for every field.
 */
Story.addAct({
  id: 'high-school',
  numeral: 'II',
  title: 'Finding my party',
  years: 'High school',
  // Varsity colors: red with a navy accent, under the stadium lights.
  color: { name: 'Varsity red', light: '#f08a75', base: '#e0533d', shade: '#a3352a', accent: '#24366b' },
  theme: 'light',
  scene: 'field',
  // The first two moments on the football field, then the summer jobs, where the level-up plays too.
  stages: ['field', 'field', 'summer-jobs', 'summer-jobs'],
  // Short hair under a cap, and no beard yet.
  hero: { gear: 'cap', title: 'Team captain', hair: 'short', beard: 'none' },
  beats: [
    { tag: 'life', text: "In high school I found friends who made me better. They played football, so I joined them, and by senior year I was the team's captain.", item: 'captain-patch', cue: 'captain' },
    { tag: 'life', text: 'A local coach, a former college athlete, taught me how to train. I set the school discus record: 176 feet.', item: 'discus', cue: 'discus' },
    { tag: 'work', text: 'Summers I worked. I built forms and poured concrete basements, where the pour is only as good as the forms you build first. Then I ran painting and shipping at a machine factory, the last hands on every machine before a customer.', item: 'level', cue: 'pour' },
  ],
  unlock: { banner: 'Level 2', say: 'New class: Team captain' },
  items: [
    {
      id: 'captain-patch', name: "Captain's patch", sprite: 'patch', tag: 'life',
      line: 'The C on my jersey, earned one practice at a time.',
      adds: { grit: 1, product: 1 },
      photo: null,
    },
    {
      id: 'discus', name: 'Discus', sprite: 'discus', tag: 'life',
      line: 'Stay low, spin, and let it fly flat.',
      adds: { grit: 2, outdoors: 1 },
      photo: null,
    },
    {
      id: 'level', name: 'Level', sprite: 'level', tag: 'work',
      line: 'Check the forms twice. The concrete only pours once.',
      adds: { engineering: 1, grit: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'teamwork', name: 'Teamwork', parents: [], moment: 1, line: 'Pick people who make you better, then pull your weight for them.' },
    { id: 'throwing', name: 'Throwing', parents: ['riding'], moment: 2, line: 'Timing, rhythm and one clean release.' },
    { id: 'planning', name: 'Planning', parents: ['process'], moment: 3, line: "Getting the forms right first, because a pour can't be undone." },
    { id: 'leading', name: 'Leading', parents: ['teaching', 'teamwork'], line: 'Earning the C by doing the work first.' },
  ],
  game: null,
  photos: [],
});
