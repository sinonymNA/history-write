// Data constants extracted from historywrite.html (lines 859–1202)
// These will be imported by components

export const ESSAY_TYPES = {
  SAQ: 'saq',
  LEQ: 'leq',
  DBQ: 'dbq'
}

// Block templates extracted from HTML lines 860-911
export const BLOCK_TEMPLATES = {
  saq: (prompt, parts = 3) => {
    const labels = ['a','b','c','d'];
    const emojis = ['🔍','💡','🔗','🎯'];
    const guides = [
      'Identify the key concept or event described in the prompt.',
      'Explain the significance — why did this matter?',
      'Make a connection to a broader historical pattern or another event.',
      'Analyze the long-term impact or legacy.'
    ];
    return Array.from({length: Math.min(parts, 4)}, (_, i) => ({
      id: `saq-${labels[i]}`,
      label: `Part ${labels[i].toUpperCase()}`,
      emoji: emojis[i],
      question: guides[i],
      hint: `Think about specific historical evidence you can cite. Use names, dates, and places.`,
      minWords: 30
    }));
  },
  leq: (prompt) => [
    { id: 'leq-ctx', label: 'Set the Scene', emoji: '🌍', question: 'What was happening in the world at this time? Set the historical context — describe the big picture before your argument.', hint: 'Think about political, economic, social, or cultural conditions that existed before or during the topic.', minWords: 40 },
    { id: 'leq-thesis', label: 'Your Argument', emoji: '⚔️', question: 'What\'s your main argument? State a clear, defensible claim with a line of reasoning.', hint: 'A strong thesis uses "because" and previews 2-3 supporting points. Take a stance!', minWords: 25 },
    { id: 'leq-ev1', label: 'Evidence #1', emoji: '📜', question: 'Give your first piece of specific historical evidence that supports your argument. Explain how it proves your point.', hint: 'Name a specific event, person, policy, or development. Then explain WHY it supports your thesis.', minWords: 50 },
    { id: 'leq-ev2', label: 'Evidence #2', emoji: '📖', question: 'Now give a second piece of evidence. Pick something different from your first — show range!', hint: 'Try a different category: if your first was political, go economic or social. Connect it back to your thesis.', minWords: 50 },
    { id: 'leq-analysis', label: 'So What?', emoji: '🧠', question: 'Analyze HOW your evidence supports your argument. What patterns or comparisons do you see?', hint: 'Use words like "this demonstrates," "as a result," "this pattern shows." Compare, contrast, or show cause/effect.', minWords: 40 },
    { id: 'leq-complex', label: 'Level Up', emoji: '🏆', question: 'Show complexity! Acknowledge a counterargument, different perspective, or connect to another time period.', hint: 'Start with "However," or "While this is true," to show you can think beyond your main argument.', minWords: 30 }
  ],
  dbq: (prompt, sources = []) => {
    const docPicks = sources.slice(0, Math.min(sources.length, 4));
    const prompts = [
      (s) => `Read ${s.label} below. What is the author's MAIN ARGUMENT? In 2-3 sentences, explain what they are saying and how it connects to the thesis above.`,
      (s) => `Read ${s.label} below. Analyze the author's POINT OF VIEW. How does who they are (their job, nationality, or social position) shape what they wrote? What does this reveal?`,
      (s) => `Read ${s.label} below. What was the author's PURPOSE for writing this? Who was their AUDIENCE? How does knowing this change how we should read the document?`,
      (s) => `Read ${s.label} below. Identify ONE specific claim or detail from this document. Explain how the HISTORICAL SITUATION at the time helps us understand why this was written.`
    ];
    const hints = [
      'Focus on the key point the author is making. Use a specific detail or quote from the text.',
      'Think: WHY does this person see things this way? Their identity shapes their perspective.',
      'Was this meant to persuade, inform, protest, or report? That changes everything about how we read it.',
      'Connect the document to specific events or conditions happening during this time period.'
    ];
    const emojis = ['🔎','📑','🔍','📋'];
    const blocks = [
      { id: 'dbq-ctx', label: 'Set the Scene', emoji: '🌍', question: 'In 2-3 sentences, describe the historical context. What was happening BEFORE or DURING this time period that helps explain the topic?', hint: 'Don\'t reference any documents — use your outside knowledge. Think big picture: political, economic, or social conditions.', minWords: 25 }
    ];
    docPicks.forEach((s, i) => {
      blocks.push({ id: `dbq-doc${i+1}`, label: `Analyze ${s.label}`, emoji: emojis[i], question: prompts[i % prompts.length](s), hint: hints[i % hints.length], minWords: 25, docIndex: i });
    });
    blocks.push({ id: 'dbq-finish', label: 'Finish Strong', emoji: '🏆', question: 'Do TWO things: (1) Name ONE specific piece of outside evidence (not from any document) that supports the thesis. (2) In 1-2 sentences, explain why the thesis might be more complicated than it seems — what\'s a counterargument?', hint: 'Be SPECIFIC with outside evidence — name a person, event, or policy with a date. For complexity, start with "However..." or "While this is true..."', minWords: 30 });
    return blocks;
  }
}

// Essay block prompts extracted from HTML lines 913-1020
export const ESSAY_BLOCKS_PROMPTS = [
  { type: 'leq', title: 'Maritime Empires LEQ', prompt: 'Evaluate the extent to which maritime empires in the period 1450–1750 transformed global trade networks.', difficulty: 'Medium' },
  { type: 'leq', title: 'Industrial Revolution LEQ', prompt: 'Evaluate the extent to which the Industrial Revolution (1750–1900) changed social structures in ONE of the following regions: Europe, East Asia, or Latin America.', difficulty: 'Medium' },
  { type: 'saq', title: 'Columbian Exchange SAQ', prompt: 'a) Identify ONE biological exchange that occurred as a result of the Columbian Exchange.\nb) Explain ONE economic effect of the Columbian Exchange on the Americas.\nc) Explain ONE way the Columbian Exchange affected population patterns in Afro-Eurasia.', difficulty: 'Easy', parts: 3 },
  { type: 'saq', title: 'Mongol Empire SAQ', prompt: 'a) Identify ONE way the Mongol Empire facilitated trade across Eurasia.\nb) Explain ONE negative consequence of Mongol expansion.\nc) Explain how the Mongol Empire contributed to cultural exchange between East and West.', difficulty: 'Easy', parts: 3 },
  { type: 'leq', title: 'Imperialism LEQ', prompt: 'Evaluate the extent to which European imperialism in the period 1750–1900 was driven by economic motives versus ideological justifications.', difficulty: 'Hard' },
  { type: 'leq', title: 'Decolonization LEQ', prompt: 'Compare the processes of decolonization in TWO of the following regions: South Asia, Sub-Saharan Africa, or Southeast Asia.', difficulty: 'Hard' }
]

// Thesis judge bank from HTML lines 1022-1038
export const THESIS_JUDGE_BANK = [
  { text: "The Columbian Exchange fundamentally transformed global economies between 1450 and 1750 because it introduced new crops that boosted population growth, created silver-based trade networks, and established coerced labor systems.", verdict: "strong", why: "Clear claim + 'because' with three specific supporting points + time period. This earns the thesis point." },
  { text: "The Columbian Exchange affected many things in the world.", verdict: "weak", why: "Too vague — no defensible claim, no line of reasoning, no specifics. What things? How? This would NOT earn the point." },
  { text: "This essay will discuss the causes and effects of the Industrial Revolution.", verdict: "not_thesis", why: "This is a topic sentence, not a thesis. It announces what you'll talk about but makes no argument or claim." },
  { text: "Although the Mongol Empire caused widespread destruction, it ultimately facilitated unprecedented cultural and commercial exchange across Eurasia by establishing the Pax Mongolica.", verdict: "strong", why: "Starts with a counterpoint ('although'), makes a clear claim, and previews the reasoning. The qualifier shows complexity." },
  { text: "The Mongols were very important in history and changed a lot of things.", verdict: "weak", why: "No specifics, no argument, no time period. 'Important' and 'changed things' are not defensible claims." }
]

// Evidence bank from HTML lines 1040-1051
export const EVIDENCE_BANK = [
  { claim: "Trade networks facilitated cultural exchange in the period 1200-1450.", evidence: "Merchants traveled along trade routes during this time.", verdict: "weak", why: "Too vague — which merchants? Which routes? When exactly? This lacks the specificity needed for AP credit. Name a person, place, or date." },
  { claim: "Trade networks facilitated cultural exchange in the period 1200-1450.", evidence: "Ibn Battuta traveled over 75,000 miles across the Dar al-Islam between 1325 and 1354, documenting the shared Islamic legal and cultural practices he found from Morocco to China.", verdict: "strong", why: "Specific person (Ibn Battuta), specific dates (1325-1354), specific detail (75,000 miles), and directly supports the claim about cultural exchange." },
  { claim: "The Columbian Exchange transformed global economies.", evidence: "New crops were introduced to different parts of the world.", verdict: "weak", why: "Which crops? Where? When? 'New crops' and 'different parts' are too vague. This is a general statement, not specific evidence." },
  { claim: "The Columbian Exchange transformed global economies.", evidence: "The introduction of the potato from the Americas to Europe led to significant population growth — Ireland's population nearly doubled between 1750 and 1840, largely due to potato cultivation.", verdict: "strong", why: "Specific crop (potato), specific place (Ireland), specific dates and data (doubled, 1750-1840). This is concrete, usable evidence." }
]

// Block Blast MCQ bank from HTML lines 1054-1085
export const BB_QUESTIONS = [
  { q:"Which best explains the political success of the Mongol Empire in the 13th century?", c:["Adoption of a single state religion","A meritocratic military structure and psychological warfare","Reliance on naval superiority","Centralized bureaucracy modeled on the Song dynasty"], a:1, cat:"political" },
  { q:"Indian Ocean trade (1200-1450) was most facilitated by:", c:["European joint-stock companies","Collapse of overland Silk Road routes","Monsoon winds and lateen sail technology","Chinese naval dominance after Zheng He"], a:2, cat:"economic" },
  { q:"Mansa Musa's 1324 pilgrimage to Mecca demonstrates:", c:["Mali's isolation from Islamic civilization","Decline of trans-Saharan gold trade","Extraordinary wealth of West African kingdoms integrated into the Islamic world","European economic dominance over Africa"], a:2, cat:"economic" },
  { q:"The caste system in South Asia (1200-1450) primarily functioned to:", c:["Provide social mobility for merchants","Organize society into hereditary occupational groups","Ensure equal political representation","Prevent the spread of Islam"], a:1, cat:"social" },
  { q:"Which best illustrates cultural syncretism along Silk Road routes?", c:["Theravada Buddhism spreading to Japan","Adoption of cuneiform by Persians","Greco-Buddhist artistic styles in Central Asian sculptures","Replacement of Hinduism with Islam in all of Southeast Asia"], a:2, cat:"cultural" },
  { q:"Aztec tribute from conquered city-states most directly served to:", c:["Spread Nahuatl as a universal language","Sustain Tenochtitlan and reinforce hierarchical political structure","Establish a uniform legal code","Promote religious tolerance"], a:1, cat:"political" },
  { q:"Great Zimbabwe's stone enclosures evidence:", c:["Portuguese architectural influence","A prosperous Bantu-speaking state in long-distance trade","Nomadic pastoralist settlements","Egyptian cultural diffusion"], a:1, cat:"cultural" },
  { q:"The Black Death's demographic impact (1347-1400) most directly caused:", c:["Strengthening of feudal obligations","Labor shortage increasing peasant bargaining power","Expansion of Byzantine Empire westward","Decline of Christianity in Europe"], a:1, cat:"social" },
  { q:"The Columbian Exchange most significantly altered demographics through:", c:["Voluntary European migration","Old World diseases devastating indigenous Americans","Maize cultivation in sub-Saharan Africa","Forced relocation of Asian laborers"], a:1, cat:"social" },
  { q:"The encomienda system was most similar to:", c:["European feudal manorialism","Chinese examination system","Ottoman devshirme","Inca mit'a labor system"], a:0, cat:"political" }
]

// Story lessons data from HTML lines 1089-1202
export const STORY_LESSONS = {
  'apwh-6.3': {
    title: 'Industrialization Spreads',
    unit: '6.3',
    period: '1750–1900',
    desc: 'Follow the fire of industry as it leaps from Britain across oceans and continents, forever changing how humans live and work.',
    chapters: [
      {
        title: 'The Forge of Britain',
        date: 'Manchester, England — 1790s',
        bg: 'linear-gradient(135deg,#1a1a2e 0%,#2d1b3d 40%,#4a1c1c 100%)',
        icon: '🏭',
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Cottonopolis1.jpg/800px-Cottonopolis1.jpg',
        text: '<p>The air tastes of iron and coal...</p>',
        quote: { text: 'England is the workshop of the world.', attr: '— British saying, early 1800s' },
        question: 'What specific advantages allowed Britain to industrialize before any other country?'
      }
    ]
  },
  'apwh-6.4': {
    title: 'Trade and the Global Economy',
    unit: '6.4',
    period: '1750–1900',
    desc: 'Trace the flows of cotton, opium, and silver as industrial nations reshape global trade.',
    chapters: [
      {
        title: 'Workshop of the World',
        date: 'The British Empire — 1820s–1870s',
        bg: 'linear-gradient(135deg,#1a1506 0%,#4a3b10 40%,#c49528 100%)',
        icon: '🚢'
      }
    ]
  }
}

// Skill types and progression
export const SKILL_TYPES = {
  THESIS: 'thesis',
  EVIDENCE: 'evidence',
  REASONING: 'reasoning',
  COMPLEXITY: 'complexity',
  ANALYSIS: 'analysis'
}

// Default gamification stats
export function getDefaultStats() {
  return {
    level: 1,
    xp: 0,
    streaks: {},
    mastery: {},
    essays_completed: 0
  }
}
