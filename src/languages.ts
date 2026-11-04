import type { Language } from './types';
import languages from '../resources/languages.yml';

type LinguistLanguage = {
  type?: string;
  color?: string;
  extensions?: string[];
};

const EXCLUDED_LANGUAGES = new Set(['GCC Machine Description', 'Standard ML']);

export const loadLanguages = async (): Promise<Language[]> => {
  const data = languages as Record<string, LinguistLanguage>;
  const byExtension = new Map<string, Language>();

  for (const [name, definition] of Object.entries(data)) {
    const type = name === 'Jupyter Notebook' ? 'programming' : definition.type;

    if (
      type !== 'programming' ||
      EXCLUDED_LANGUAGES.has(name) ||
      !definition.color ||
      !/^#[0-9a-f]{6}$/i.test(definition.color)
    ) {
      continue;
    }

    for (const extension of definition.extensions ?? []) {
      const normalised = extension.toLowerCase();

      byExtension.set(normalised, {
        extension: normalised,
        name,
        colour: definition.color,
      });
    }
  }

  return [...byExtension.values()].sort(
    (a, b) =>
      b.extension.length - a.extension.length ||
      a.extension.localeCompare(b.extension),
  );
};
