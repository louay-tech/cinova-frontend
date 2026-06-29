export type Chapter = { title: string; paragraphs: string[] };
export type Novel = {
  id: string;
  title: string;
  author: string;
  year: string;
  tagline: string;
  coverGradient: string;
  chapters: Chapter[];
  apiNovelId?: string;
  emotionMap?: any[];
};

const lorem1 = [
  "The night air carried the scent of rain and woodsmoke, and Eleanor stood at the window long after the lamps had been extinguished, watching the road unwind into shadow. Somewhere in the dark, a horse moved restlessly in its stall, and the old house creaked the way old houses do when they are remembering.",
  "She had not expected to feel this — a small, sharp ache beneath the ribs, as though something long buried had quietly turned over in its sleep. It was nothing, she told herself. It was the weather, the lateness of the hour, the letter folded twice and tucked beneath the candlestick on the writing desk.",
  "And yet she did not move. The clock in the hall struck the half hour, and then the hour, and still she stood, the cold glass against her forehead, watching the road as if at any moment a figure might emerge from the dark and lift a hand in greeting.",
  "When at last she turned away, the candle had burned low and the letter lay where she had left it, its ink already drying into the shape of a decision she had not yet learned how to make.",
];

const lorem2 = [
  "They came to the city in the blue hour before dawn, when the streetlamps were still burning and the river held the sky inside it like a held breath. Marcus had not slept. He had counted the bridges as the train crossed them, and now he counted the windows lit gold along the embankment, and he thought: somewhere behind one of these is the rest of my life.",
  "The platform smelled of coffee and wet stone. A woman pushed past him with a violin case strapped to her back, and a small boy in a red coat ran ahead of his mother, and a pigeon lifted from the iron rafters and disappeared into the vault of the ceiling.",
  "He stood there a long moment, his suitcase at his feet, and he understood — with a clarity that surprised him — that he was no longer anyone he had been the day before.",
];

const lorem3 = [
  "The lighthouse keeper's daughter learned to read the weather before she learned to read books. She knew the smell of a storm three days out, the particular green the sea turned before a gale, the way the gulls grew loud and then suddenly silent in the hour before the wind arrived.",
  "Her name was Iris, and she was seven years old the summer the stranger washed ashore. He had no boat and no shoes and no memory of his own name, and her father carried him up the cliff path on his back while Iris ran ahead with the lantern, the wind tearing at her hair.",
  "They put him in the small bed under the eaves, and Iris sat at the foot of it and watched him sleep, and she thought: he has come from somewhere none of us has ever been.",
];

export const novels: Novel[] = [
  {
    id: "the-quiet-room",
    title: "The Quiet Room",
    author: "Eleanor Vance",
    year: "1924",
    tagline: "A house remembers what its people forget.",
    coverGradient: "linear-gradient(135deg, oklch(0.32 0.05 25), oklch(0.18 0.04 280))",
    chapters: [
      { title: "I. The Letter", paragraphs: lorem1 },
      { title: "II. The Long Hour", paragraphs: lorem1.slice().reverse() },
      { title: "III. Morning", paragraphs: lorem1 },
    ],
  },
  {
    id: "blue-hour",
    title: "The Blue Hour",
    author: "Marcus Aldine",
    year: "2011",
    tagline: "A city, a stranger, a beginning.",
    coverGradient: "linear-gradient(135deg, oklch(0.28 0.08 240), oklch(0.45 0.12 200))",
    chapters: [
      { title: "I. Arrival", paragraphs: lorem2 },
      { title: "II. The Bridges", paragraphs: lorem2.slice().reverse() },
      { title: "III. A New Name", paragraphs: lorem2 },
    ],
  },
  {
    id: "lighthouse",
    title: "The Lighthouse Keeper's Daughter",
    author: "Iris Calloway",
    year: "1987",
    tagline: "A small life on the edge of an enormous sea.",
    coverGradient: "linear-gradient(135deg, oklch(0.4 0.1 60), oklch(0.22 0.06 30))",
    chapters: [
      { title: "I. The Stranger", paragraphs: lorem3 },
      { title: "II. The Storm", paragraphs: lorem3.slice().reverse() },
      { title: "III. What the Sea Returns", paragraphs: lorem3 },
    ],
  },
];

import { getUploadedNovel } from "./uploadedNovels";
export const getNovel = (id: string): Novel | undefined =>
  novels.find((n) => n.id === id) ?? getUploadedNovel(id);

