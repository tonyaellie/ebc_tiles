import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Language, NumberedDirectory, Part, Solution } from './types';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.venv',
  '__pycache__',
  'node_modules',
  'target',
  'vendor',
]);

const detectPart = (filename: string, extension: string): Part | null => {
  const stem = filename.slice(0, -extension.length).toLowerCase();

  const matches: Record<string, Part> = {
    a: 1,
    b: 2,
    c: 3,
    '1': 1,
    '2': 2,
    '3': 3,
    part1: 1,
    part2: 2,
    part3: 3,
    'part-1': 1,
    'part-2': 2,
    'part-3': 3,
    part_1: 1,
    part_2: 2,
    part_3: 3,
    p1: 1,
    p2: 2,
    p3: 3,
  };

  return matches[stem] ?? null;
};

export const discoverDirectories = async (
  directory: string,
  pattern: RegExp,
): Promise<NumberedDirectory[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const directories: NumberedDirectory[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const match = entry.name.match(pattern);

    if (!match?.[1]) {
      continue;
    }

    const number = Number(match[1]);

    if (number < 1) {
      continue;
    }

    directories.push({
      name: entry.name,
      number,
      path: join(directory, entry.name),
    });
  }

  const numbers = new Set(directories.map((entry) => entry.number));

  if (numbers.size !== directories.length) {
    throw new Error(`Duplicate numeric directory names in ${directory}`);
  }

  return directories.sort((a, b) => a.number - b.number);
};

export const findSolutions = async (
  directory: string,
  languages: Language[],
): Promise<Solution[]> => {
  const solutions: Solution[] = [];

  const visit = async (current: string): Promise<void> => {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(current, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          await visit(path);
        }

        continue;
      }

      // Symlinks are not followed.
      if (!entry.isFile()) {
        continue;
      }

      const filename = entry.name.toLowerCase();
      const language = languages.find((item) =>
        filename.endsWith(item.extension),
      );

      if (!language) {
        continue;
      }

      solutions.push({
        path,
        language,
        part: detectPart(filename, language.extension),
      });
    }
  };

  await visit(directory);

  return solutions.sort((a, b) => a.path.localeCompare(b.path));
};
