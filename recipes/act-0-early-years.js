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
  title: 'Early years',
  years: 'Ages 0 to 8',
  summary: 'Growing up, and typing races in the school computer lab.',
  color: { name: 'Crayon teal', light: '#7fe0d4', base: '#22b3a3', shade: '#157a70' },
  theme: 'light',
  scene: 'early-home',
  stages: ['early-home', 'computer-lab', 'lab-board'],
  hero: { gear: 'backpack', title: 'Keyboard kid', hair: 'short', beard: 'none' },
  beats: [
    { tag: 'life', text: 'Reading books: the Accelerated Reader program was a fun way to get kids reading. It worked on me, and I still love learning and stories.', cue: 'grow' },
    { tag: 'life', text: 'Typing class in the computer lab: the whole room raced to see who could type the most words a minute. I was competitive, and I was the fastest.', item: 'keyboard', cue: 'type' },
  ],
  unlock: { banner: 'Tutorial complete', say: 'New class: Keyboard kid', pop: 'Tutorial complete!' },
  items: [
    {
      id: 'keyboard', name: 'Keyboard', sprite: 'keyboard', tag: 'life',
      line: 'Home row first. Eyes on the screen, never on your hands.',
      adds: { code: 1, grit: 1 },
      photo: null,
      game: 'typing',
    },
    {
      id: 'floppy', name: 'Floppy disk', sprite: 'floppy', tag: 'life',
      line: 'My first save file.',
      adds: { code: 1 },
      photo: null,
    },
  ],
  skills: [
    { id: 'reading', name: 'Reading', parents: [], moment: 1, line: 'Stories first, then the manual.' },
    { id: 'typing', name: 'Typing', parents: [], moment: 2, line: 'Fast fingers: every later skill was typed with them.' },
  ],
  game: 'typing',
  photos: [],
});
