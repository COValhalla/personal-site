/*
 * Site-wide settings. Every word here is a placeholder to replace.
 */
Story.site({
  name: 'Joe',
  tagline: 'A life in six acts. Scroll down and watch the character sheet fill in.',
  // When true, item cards say their one-liners are draft words.
  draft: true,
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
