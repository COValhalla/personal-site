/*
 * The page's two small DOM helpers, shared by every part that builds elements.
 * Needs: nothing
 */
(function () {
  'use strict';

  // el('a', { class, text, style, onclick, ...attributes }, ...children): one element.
  // Children may be nodes, strings or arrays of them; null and undefined are skipped.
  function el(tag, attrs, ...kids) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style') node.style.cssText = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    kids.flat().forEach(kid => kid != null && node.append(kid));
    return node;
  }

  // An act's color ramp as the CSS variables the stylesheet reads.
  function colorVars(act) {
    return `--c1:${act.color.light};--c2:${act.color.base};--c3:${act.color.shade}`;
  }

  window.Dom = { el, colorVars };
})();
