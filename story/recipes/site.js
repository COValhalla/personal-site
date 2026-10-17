/*
 * Site-wide settings.
 * Needs: Story
 */
Story.site({
  name: 'Joe',
  fullName: 'Joe Vellella',
  // The line above the title screen's heading: the full name and this role.
  role: 'Product engineer',
  // The big heading on the title screen. The top bar and the sheet use name.
  greeting: "Hi, I'm Joe.",
  // The welcome on the title screen: one to four sentences that lead to Press start.
  welcome: "I build products. I started as a chemical engineer in factories, taught myself to code, and now I'm a product manager who still builds. Press start to play my story. You may find a few levels you played too.",
  // The line above the Say hello links at the end of the page, which asks the reader to answer back.
  hello: "Building something like that? Let's talk. And tell me: what was your typing class?",
  // The link under Press start to the LinkedIn address in contact, for a reader short on time.
  // Leave it out, or leave the LinkedIn address blank, to show no link.
  shortcut: 'Short on time? See my work history on LinkedIn.',
  // The end of the page: a kicker, a heading and the line about what comes next, then Say hello.
  // next finishes the last act's Next tag, "Next: what I build next", which leads here; without it the tag uses the heading.
  ending: {
    kicker: 'Next level',
    heading: 'What I build next',
    next: 'what I build next',
    line: "Every act added a color and new skills, and they all point one way. I'm happiest as a product engineer on a small team, building the tools a business runs on, end to end, for the people who use them every day.",
  },
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
