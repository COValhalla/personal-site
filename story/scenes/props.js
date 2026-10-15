/*
 * Props several scenes share: peaks, pines, clouds, speech bubbles, doors,
 * people and the BMX rider. A scene takes the ones it draws from Props.
 * Needs: Pixel, Draw, Scenes
 */
(function () {
  'use strict';

  const { GROUND } = Scenes;
  const N = Pixel.NEUTRALS;
  const { rect, text, textWidth, outline } = Draw;

  // A mountain from top down to the ground, half wide at its foot, with an optional snow cap.
  function peak(ctx, color, cx, top, half, snow) {
    for (let y = top; y < GROUND; y++) {
      const w = Math.round(((y - top) / (GROUND - top)) * half * 2) + 1;
      rect(ctx, snow && y < top + 5 ? snow : color, cx - Math.floor(w / 2), y, w, 1);
    }
  }

  // A pine tree h tall on a short trunk, standing on base.
  function pine(ctx, color, shade, x, base, h) {
    rect(ctx, N.h, x, base - 2, 1, 2);
    for (let i = 0; i < h; i++) {
      const w = 1 + 2 * Math.floor(i / 2);
      rect(ctx, i % 4 === 3 ? shade : color, x - Math.floor(w / 2), base - 2 - h + i, w, 1);
    }
  }

  // A small cloud, 11 wide.
  function cloud(ctx, x, y, color) {
    rect(ctx, color, x + 2, y, 6, 1);
    rect(ctx, color, x, y + 1, 11, 2);
    rect(ctx, color, x + 4, y - 1, 3, 1);
  }

  // A speech bubble with a line of pixel text, its tail at the bottom left.
  function bubble(ctx, x, y, str, ink) {
    const w = textWidth(str) + 4;
    rect(ctx, N.o, x - 1, y - 1, w + 2, 9);
    rect(ctx, N.w, x, y, w, 7);
    rect(ctx, N.o, x + 2, y + 8, 2, 1);
    rect(ctx, N.o, x + 2, y + 9, 1, 1);
    text(ctx, str, x + 2, y + 1, ink || N.o);
  }

  // A door 14 wide and 28 tall, standing on the bottom line it is given.
  function doorway(ctx, x, bottom) {
    const left = x - 7;
    const top = bottom - 28;
    rect(ctx, N.o, left - 1, top - 1, 16, 29);
    rect(ctx, '#5b4636', left, top, 14, 28);
    outline(ctx, left + 2, top + 3, 10, 22, '#7a5e48');
    rect(ctx, '#e8c77a', left + 10, top + 14, 1, 2);
  }

  // A person drawn from the hero's base, in someone else's shirt and hair. Scenes may borrow a look's colors.
  const PERSON_LOOKS = [
    { h: '#2b1d14', s: '#c98f66', S: '#9b6a48' },
    { h: '#d8a548', s: '#f3c9a6', S: '#cf9d79' },
    { h: '#1d1b22', s: '#8d5a3b', S: '#6a412a' },
    { h: '#a3462a', s: '#f0c29a', S: '#c98f66' },
    { h: '#7d808a', s: '#e8b48c', S: '#c08a62' },
  ];
  function person(ctx, x, feetY, ramp, k, flip) {
    Pixel.paint(ctx, Pixel.PERSON_BASE, ramp, x, feetY - 22, 1, flip, PERSON_LOOKS[k % PERSON_LOOKS.length]);
  }

  // Tiny BMX rider, 9 x 8, for scenes. Rider in the given jersey color.
  const RIDER = [
    '...hh....',
    '...hjj...',
    '....jjm..',
    '...jj.m..',
    '..oookmo.',
    '.o.ok.o.o',
    '.o.o..o.o',
    '..o....o.',
  ];

  window.Props = { peak, pine, cloud, bubble, doorway, person, PERSON_LOOKS, RIDER };
})();
