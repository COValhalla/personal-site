/*
 * Site-wide settings. Every word here is a placeholder to replace.
 */
Story.site({
  name: 'Joe',
  tagline: 'A life in six acts. Scroll down and watch the character sheet fill in.',
  // When true, item cards say their one-liners are draft words.
  draft: true,
  // How the pixel hero looks. A placeholder until Joe sends a photo or a description.
  // hairStyle: 'short', 'buzz', 'swoop' or 'long'. beard: 'none', 'stubble' or 'full'.
  look: {
    skin: '#f0c29a',
    skinShade: '#c98f66',
    hair: '#5a3b22',
    hairStyle: 'short',
    beard: 'none',
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
