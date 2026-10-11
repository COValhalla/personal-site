/*
 * Site-wide settings. Every word here is a placeholder to replace.
 */
Story.site({
  name: 'Joe',
  // The welcome on the title screen: one to four sentences that lead to Press start.
  welcome: "Hi, I'm Joe Vellella, a product engineer. I learn it like a game and build it with a team. Press start to play my story. You may find a few levels you played too.",
  // The line above the Say hello links, which asks the reader to answer back.
  hello: 'Your turn: trade me a story. What was your typing class?',
  // Say hello links. A blank address leaves its link out.
  contact: {
    linkedin: 'https://www.linkedin.com/in/josephvellella/',
    email: 'connect-with-joe.next036@passmail.net',
    github: 'https://github.com/COValhalla',
  },
  // How the pixel hero looks, drawn from Joe's photos: skin, hair with
  // lighter streaks, blue eyes, and today's top bun and long beard. Each act's
  // recipe sets the hair and beard for that part of the story.
  // hairStyle: 'short', 'bald' or 'bun'. beard: 'none', 'goatee', 'stubble', 'short', 'full' or 'long'.
  look: {
    skin: '#f4c7a6',
    skinShade: '#d9937a',
    hair: '#8c4527',
    hairLight: '#c0703c',
    eyes: '#2c5a8c',
    hairStyle: 'bun',
    beard: 'long',
    glasses: false,
  },
  // Stats show as bars with no numbers. Items add to them in recipes.
  stats: [
    { id: 'grit', name: 'Grit' },
    { id: 'engineering', name: 'Engineering' },
    { id: 'wanderlust', name: 'Wanderlust' },
    { id: 'outdoors', name: 'Outdoors' },
    { id: 'code', name: 'Code' },
    { id: 'product', name: 'Product' },
  ],
});
