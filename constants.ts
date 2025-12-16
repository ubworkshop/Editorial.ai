import { PublicationStyle } from './types';

export const PUBLICATIONS: PublicationStyle[] = [
  {
    id: 'economist',
    name: 'The Economist',
    description: 'Witty, analytical, dry, authoritative, and concise. Uses British spelling and sophisticated vocabulary.',
    logoInitial: 'E',
    color: 'bg-red-600',
    promptModifier: 'Write in the style of The Economist. Use British spelling. Be witty, dry, and highly analytical. Start with a clever hook. Use a "Leaders" editorial voice. Focus on macro-implications.'
  },
  {
    id: 'nyt',
    name: 'The New York Times',
    description: 'Journalistic, polished, objective yet narrative-driven. Detailed and context-heavy.',
    logoInitial: 'T',
    color: 'bg-black',
    promptModifier: 'Write in the style of The New York Times. Use a sophisticated, journalistic tone. Provide context and nuance. Structure it like a feature article or an op-ed column.'
  },
  {
    id: 'new_yorker',
    name: 'The New Yorker',
    description: 'Long-form, literary, erudite, and deeply narrative. Uses specific details and a sophisticated cadence.',
    logoInitial: 'N',
    color: 'bg-stone-800',
    promptModifier: 'Write in the style of The New York Times Magazine or The New Yorker. Be narrative, literary, and erudite. Focus on the human element and intellectual curiosity. Use long, flowing sentences.'
  },
  {
    id: 'wired',
    name: 'Wired',
    description: 'Tech-forward, punchy, futuristic, and slightly irreverent.',
    logoInitial: 'W',
    color: 'bg-black border-b-2 border-lime-400',
    promptModifier: 'Write in the style of Wired Magazine. Be punchy, tech-forward, and enthusiastic about future implications. Use modern internet-aware vocabulary.'
  },
  {
    id: 'atlantic',
    name: 'The Atlantic',
    description: 'Thought-provoking, cultural commentary, sweeping intellectual arguments.',
    logoInitial: 'A',
    color: 'bg-black',
    promptModifier: 'Write in the style of The Atlantic. Focus on cultural commentary and the "big idea". Be persuasive, intellectual, and slightly contrarian.'
  }
];
