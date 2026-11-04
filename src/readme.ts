import { sep } from 'node:path';

const BEGIN = '<!-- EBC TILES BEGIN -->';
const END = '<!-- EBC TILES END -->';

export const toUrlPath = (path: string): string =>
  path
    .split(sep)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export const replaceReadmeSection = (
  readme: string,
  content: string,
): string => {
  const beginIndex = readme.indexOf(BEGIN);
  const endIndex = readme.indexOf(END);

  if (
    beginIndex === -1 ||
    endIndex === -1 ||
    endIndex < beginIndex + BEGIN.length ||
    readme.indexOf(BEGIN, beginIndex + BEGIN.length) !== -1 ||
    readme.indexOf(END, endIndex + END.length) !== -1
  ) {
    throw new Error(
      'README must contain exactly one ordered pair of EBC TILES markers',
    );
  }

  return (
    readme.slice(0, beginIndex + BEGIN.length) +
    `\n\n${content}\n\n` +
    readme.slice(endIndex)
  );
};
