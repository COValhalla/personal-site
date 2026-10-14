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
  // Short hair under a cap, and no beard yet.
  hero: { gear: 'cap', title: 'Team captain', hair: 'short', beard: 'none' },
  beats: [
    { tag: 'life', text: "Freshman year I ran track, skipped football and spent my evenings raiding in World of Warcraft.", cue: 'skip' },
    { tag: 'life', text: 'Sophomore year I found friends who made me better. They played football, so I went out with them and learned a new sport.', cue: 'party' },
    { tag: 'life', text: 'A local coach, a former college athlete, took me under his wing and taught me how to train. I broke the school discus record.', item: 'discus', cue: 'discus' },
    { tag: 'life', text: "By senior year, the freshman who skipped football was the team's captain.", item: 'captain-patch', cue: 'captain' },
  ],
  unlock: { banner: 'Level 2', say: 'New class: Team captain' },
  items: [
    {
      id: 'discus', name: 'Discus', sprite: 'discus', tag: 'life',
      line: 'Stay low, spin, and let it fly flat.',
      adds: { grit: 2, outdoors: 1 },
      photo: null,
    },
    {
      id: 'captain-patch', name: "Captain's patch", sprite: 'patch', tag: 'life',
      line: 'The C on my jersey, earned one practice at a time.',
      adds: { grit: 1, product: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'teamwork', name: 'Teamwork', parents: [], moment: 2, line: 'Pick people who make you better, then pull your weight for them.' },
    { id: 'throwing', name: 'Throwing', parents: ['riding'], moment: 3, line: 'Timing, rhythm and one clean release.' },
    { id: 'leading', name: 'Leading', parents: ['teaching', 'teamwork'], moment: 4, line: 'Earning the C by doing the work first.' },
  ],
  game: null,
  photos: [],
});
