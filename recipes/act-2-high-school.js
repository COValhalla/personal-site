/*
 * Act II recipe. See README.md, "Recipes", for every field.
 */
Story.addAct({
  id: 'high-school',
  numeral: 'II',
  title: 'Finding my party',
  years: 'High school',
  quests: [
    { what: 'School discus record, 176 ft' },
    { what: 'Football team captain' },
  ],
  // Varsity colors: red with a navy accent, under the stadium lights.
  color: { name: 'Varsity red', light: '#f08a75', base: '#e0533d', shade: '#a3352a', accent: '#24366b' },
  theme: 'light',
  scene: 'field',
  // Short hair under a cap, and no beard yet.
  hero: { gear: 'cap', title: 'Team captain', hair: 'short', beard: 'none' },
  beats: [
    { tag: 'life', text: "Freshman year I skipped football. I wasn't in shape, it wasn't fun, and World of Warcraft had my evenings. I only did track.", cue: 'skip' },
    { tag: 'life', text: 'Then I found my people: kids who cared about doing good in the world and were kind to everyone. Sophomore year I went out for football and got in shape.', cue: 'party' },
    { tag: 'life', text: 'A local coach, a former college athlete, took me under his wing and taught me to train. I broke the school discus record: 176 feet.', item: 'discus', cue: 'discus' },
    { tag: 'life', text: "By senior year, the freshman who skipped football was the team's captain.", item: 'captain-patch', cue: 'captain' },
  ],
  unlock: { banner: 'Level 2', say: 'New class: Team captain' },
  items: [
    {
      id: 'discus', name: 'Discus', sprite: 'discus', tag: 'life',
      line: 'Stay low, spin, and let it fly flat.',
      adds: { grit: 2, outdoors: 1 },
      photo: null,
      game: 'discus',
    },
    {
      id: 'captain-patch', name: "Captain's patch", sprite: 'patch', tag: 'life',
      line: 'The C on my jersey, earned one practice at a time.',
      adds: { grit: 1, product: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'teamwork', name: 'Teamwork', parents: [], moment: 2, line: 'Finding my people, then pulling my weight for them.' },
    { id: 'throwing', name: 'Throwing', parents: ['riding'], moment: 3, line: 'Timing, rhythm and one clean release.' },
    { id: 'leading', name: 'Leading', parents: ['teaching', 'teamwork'], moment: 4, line: 'Earning the C by doing the work first.' },
  ],
  game: 'discus',
  photos: [],
});
