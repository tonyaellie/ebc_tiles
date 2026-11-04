export type Part = 1 | 2 | 3;

export type PartResult = {
  globalTime: number;
  localTime: number;
  globalRank: number;
};

export type QuestResults = Partial<Record<Part, PartResult>>;

export type Language = {
  extension: string;
  name: string;
  colour: string;
};

export type Solution = {
  path: string;
  language: Language;
  part: Part | null;
};

export type NumberedDirectory = {
  name: string;
  number: number;
  path: string;
};

export const PARTS: Part[] = [1, 2, 3];
