/*
 * Tutorial recipe: the act before Act I. See README.md, "Recipes", for every field.
 * label replaces "Act 0" on the page; tutorial: true completes it without a level.
 * All words are placeholders to replace with your own.
 */
Story.addAct({
  id: 'early-years',
  numeral: '0',
  label: 'Tutorial',
  tutorial: true,
  title: 'Press start',
  years: 'Early elementary school',
  // The quest log at the end of the page: this act's titles, places and dates.
  quests: [
    { what: 'Fastest typist in the computer lab' },
    { what: 'Accelerated Reader leaderboards' },
  ],
  color: { name: 'Crayon teal', light: '#7fe0d4', base: '#22b3a3', shade: '#157a70' },
  theme: 'light',
  scene: 'early-night',
  // One scene per moment, then the level-up: a computer at night, the computer lab, home, the high-score board.
  stages: ['early-night', 'computer-lab', 'early-home', 'lab-board'],
  hero: { gear: 'backpack', title: 'Keyboard kid', hair: 'short', beard: 'none' },
  beats: [
    { tag: 'life', text: 'My older cousins got me playing Diablo II. Trading in its chat rewarded whoever typed fastest, and I spent hours getting at ease on a computer.', item: 'floppy', cue: 'night' },
    { tag: 'life', text: 'Typing class in the computer lab: a game threw random sentences at us and timed our words per minute. I was by far the fastest in the room.', item: 'keyboard', cue: 'type' },
    { tag: 'life', text: 'Accelerated Reader turned books into a leaderboard: read one, pass its quiz, earn points. I raced my classmates for the top and became a reader.', item: 'book', cue: 'grow' },
  ],
  unlock: { banner: 'Tutorial complete', say: 'New class: Keyboard kid', pop: 'Tutorial complete!' },
  items: [
    {
      id: 'floppy', name: 'Floppy disk', sprite: 'floppy', tag: 'life',
      line: 'My first save file.',
      adds: { code: 1 },
      photo: null,
    },
    {
      id: 'keyboard', name: 'Keyboard', sprite: 'keyboard', tag: 'life',
      line: 'Home row first. Eyes on the screen, never on your hands.',
      adds: { code: 1, grit: 1 },
      photo: null,
      game: 'typing',
    },
    {
      id: 'book', name: 'Book', sprite: 'books', tag: 'life',
      line: 'Read it, pass the quiz, bank the points, pick the next one.',
      adds: { wanderlust: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'gaming', name: 'Gaming', parents: [], moment: 1, line: 'Learning a system by playing it until it makes sense.' },
    { id: 'typing', name: 'Typing', parents: [], moment: 2, line: 'Fast fingers: every later skill was typed with them.' },
    { id: 'reading', name: 'Reading', parents: [], moment: 3, line: 'Stories first, then the manual.' },
  ],
  game: 'typing',
  photos: [],
});
