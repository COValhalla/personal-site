/*
 * The story registry. Recipe files in recipes/ call Story.site(...) once and
 * Story.addAct(...) once per act. The page is built from what they register.
 */
(function () {
  'use strict';

  const story = {
    config: null,
    acts: [],
    problems: [],
    // Which acts have levelled up, which items and skills the story has given so far,
    // and which items the visitor has already seen on the sheet.
    state: { unlocked: new Set(), owned: new Set(), skills: new Set(), seen: new Set() },
    listeners: {},
    on(event, fn) { (story.listeners[event] = story.listeners[event] || []).push(fn); },
    emit(event, data) { (story.listeners[event] || []).forEach(fn => fn(data)); },
    site(config) { story.config = config; },
    addAct(recipe) { story.acts.push(recipe); },
    items() { return story.acts.flatMap((act, i) => act.items.map(item => ({ ...item, act: i }))); },
    skills() { return story.acts.flatMap((act, i) => act.skills.map(skill => ({ ...skill, act: i }))); },
    skill(id) { return story.skills().find(s => s.id === id); },
    item(id) { return story.items().find(it => it.id === id); },
    // What an act is called on the page: "Act II", or its own label, such as Tutorial.
    name(act) { return act.label || `Act ${act.numeral}`; },
    // The level reached: a tutorial completes without a level.
    level() { return [...story.state.unlocked].filter(i => !story.acts[i].tutorial).length; },
    levelOf(i) { return story.acts.slice(0, i + 1).filter(a => !a.tutorial).length; },
    // The beats of an act in order, each with the item it gives. Items no beat
    // gives arrive with the level-up at the end of the act.
    beatsOf(act) { return (act.beats || []).map(b => ({ ...b, give: b.item ? act.items.find(it => it.id === b.item) : null })); },
    leftoverItems(act) {
      const given = new Set((act.beats || []).map(b => b.item).filter(Boolean));
      return act.items.filter(it => !given.has(it.id));
    },
    validate(known) {
      const problems = [];
      const need = (ok, msg) => { if (!ok) problems.push(msg); };
      need(story.config, 'recipes/site.js did not call Story.site().');
      const statIds = new Set(((story.config && story.config.stats) || []).map(s => s.id));
      const seen = new Set();
      const skillAct = new Map();
      story.acts.forEach((act, i) => {
        const where = `Act ${act.numeral || i + 1}`;
        need(act.title, `${where} has no title.`);
        need(act.color && act.color.light && act.color.base && act.color.shade, `${where} needs color.light, color.base and color.shade.`);
        need(known.scenes.includes(act.scene), `${where} uses scene "${act.scene}", which scenes.js does not draw.`);
        const stageNames = act.stages || [act.scene];
        if (act.stages) {
          need(act.stages.length === (act.beats || []).length + 1, `${where} needs ${(act.beats || []).length + 1} stages: one for each moment, then one for the level-up.`);
          act.stages.forEach(name => need(known.scenes.includes(name), `${where} uses stage scene "${name}", which scenes.js does not draw.`));
        }
        need(known.gear.includes(act.hero && act.hero.gear), `${where} uses hero gear "${act.hero && act.hero.gear}", which pixel.js does not have.`);
        const looks = [act.hero || {}, ...(act.beats || []).map(b => b.look).filter(Boolean)];
        looks.forEach(l => {
          if (l.hair && known.hair) need(known.hair.includes(l.hair), `${where} uses hair "${l.hair}", which pixel.js does not have.`);
          if (l.beard && known.beards) need(known.beards.includes(l.beard), `${where} uses beard "${l.beard}", which pixel.js does not have.`);
        });
        (act.items || []).forEach(item => {
          need(!seen.has(item.id), `${where}: item id "${item.id}" is used twice.`);
          seen.add(item.id);
          need(known.sprites.includes(item.sprite), `${where}: item "${item.id}" uses sprite "${item.sprite}", which pixel.js does not have.`);
          need(item.tag === 'life' || item.tag === 'work', `${where}: item "${item.id}" needs tag "life" or "work".`);
          Object.keys(item.adds || {}).forEach(stat => need(statIds.has(stat), `${where}: item "${item.id}" adds unknown stat "${stat}".`));
          if (item.game) need(known.games.includes(item.game), `${where}: item "${item.id}" opens game "${item.game}", which is not registered.`);
        });
        const own = new Set((act.items || []).map(it => it.id));
        const given = new Set();
        (act.beats || []).forEach((beat, k) => {
          need(beat.tag === 'life' || beat.tag === 'work', `${where}, moment ${k + 1}: tag must be "life" or "work".`);
          if (beat.item) {
            need(own.has(beat.item), `${where}, moment ${k + 1}: gives item "${beat.item}", which is not one of this act's items.`);
            need(!given.has(beat.item), `${where}: item "${beat.item}" is given by two moments.`);
            given.add(beat.item);
          }
          if (beat.cue && known.cues) need(known.cues(stageNames[k] || act.scene).includes(beat.cue), `${where}, moment ${k + 1}: scene "${stageNames[k] || act.scene}" has no animation called "${beat.cue}".`);
        });
        (act.skills || []).forEach(skill => {
          skillAct.set(skill.id, i);
          if (skill.moment !== undefined) need(Number.isInteger(skill.moment) && skill.moment >= 1 && skill.moment <= (act.beats || []).length, `${where}: skill "${skill.id}" lights after moment ${skill.moment}, which is not one of this act's moments.`);
        });
      });
      story.acts.forEach((act, i) => (act.skills || []).forEach(skill => (skill.parents || []).forEach(parent => {
        need(skillAct.has(parent), `Skill "${skill.id}" grows from "${parent}", which no act defines.`);
        need(!skillAct.has(parent) || skillAct.get(parent) <= i, `Skill "${skill.id}" grows from "${parent}", which comes from a later act.`);
      })));
      story.problems = problems;
      problems.forEach(p => console.error('[recipe] ' + p));
      return problems;
    },
  };

  window.Story = story;
})();
