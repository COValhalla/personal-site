/*
 * Tutorial recipe: the act before Act I. See README.md, "Recipes", for every field.
 * label replaces "Act 0" on the page; tutorial: true completes it without a level.
 */
Story.addAct({
  id: 'early-years',
  numeral: '0',
  label: 'Tutorial',
  tutorial: true,
  title: 'Press start',
  years: 'Early elementary school',
  color: { name: 'Crayon teal', light: '#7fe0d4', base: '#22b3a3', shade: '#157a70' },
  theme: 'light',
  scene: 'early-night',
  // One scene per moment, then the level-up: a computer at night, the computer lab, home, the high-score board.
  stages: ['early-night', 'computer-lab', 'early-home', 'lab-board'],
  hero: { gear: 'backpack', title: 'Keyboard kid', hair: 'short', beard: 'none' },
  beats: [
    { tag: 'life', text: 'My older cousins got me into online games. In their chats the fastest typist made the best trades, so I spent hours typing on our home computer.', item: 'floppy', cue: 'night' },
    { tag: 'life', text: 'Then typing class in the computer lab: a game threw random sentences at us and timed our words per minute. All those hours of chat paid off, and I loved racing the clock.', item: 'keyboard', cue: 'type' },
    { tag: 'life', text: 'Our school turned reading into a game too: read a book, pass its quiz, earn points. I chased the leaderboard and came out a reader for life.', item: 'book', cue: 'grow' },
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
