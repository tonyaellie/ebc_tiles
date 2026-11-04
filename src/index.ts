import { stat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { loadLanguages } from './languages';
import { fetchRankings, getUserId } from './rankings';
import { replaceReadmeSection, toUrlPath } from './readme';
import { discoverDirectories, findSolutions } from './solutions';
import { renderTile } from './tile';
import { PARTS } from './types';

const isDirectory = async (path: string): Promise<boolean> => {
  try {
    return (await stat(path)).isDirectory();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }

    throw error;
  }
};

const getSolutionsDirectory = async (root: string): Promise<string> => {
  if (process.env.EBC_SOLUTIONS_DIR) {
    return resolve(root, process.env.EBC_SOLUTIONS_DIR);
  }

  const ebcDirectory = join(root, 'ebc');

  return (await isDirectory(ebcDirectory)) ? ebcDirectory : root;
};

const main = async (): Promise<void> => {
  const root = process.cwd();
  const token = process.env.EBC_COOKIE;

  if (!token) {
    throw new Error('Set EBC_COOKIE to your Everybody Codes JWT value');
  }

  const userId = getUserId(token);
  const solutionsDirectory = await getSolutionsDirectory(root);
  const outputDirectory = join(root, '.ebc-tiles');
  const readmePath = join(root, 'README.md');

  const languages = await loadLanguages();

  const readme = await readFile(readmePath, 'utf8');

  // validate markers before fetching data or writing tiles.
  replaceReadmeSection(readme, '');

  const years = await discoverDirectories(solutionsDirectory, /^(20\d{2})$/);

  if (years.length === 0) {
    throw new Error(`No year directories found in ${solutionsDirectory}`);
  }

  console.log(`Solutions directory: ${solutionsDirectory}`);
  console.log(`User ID: ${userId}`);

  const sections: string[] = [];
  const generatedTiles: Array<{ path: string; content: string }> = [];

  let totalStars = 0;
  const firstYear = 2024;
  const questsPerYear = 20;
  const starsPerYear = questsPerYear * PARTS.length;
  const currentYear = new Date().getUTCFullYear();
  const totalPossibleStars =
    Math.max(0, currentYear - firstYear + 1) * starsPerYear;

  for (const year of years.reverse()) {
    console.log(`Fetching rankings for ${year.number}...`);

    const rankings = await fetchRankings(year.number, userId, token);
    const quests = await discoverDirectories(
      year.path,
      /^(?:(?:quest|day)[-_ ]?)?0*(\d{1,2})$/i,
    );

    let yearStars = 0;
    const images: string[] = [];

    for (const quest of quests) {
      const parts = rankings.get(quest.number) ?? {};
      const solutions = await findSolutions(quest.path, languages);

      yearStars += PARTS.filter((part) => parts[part]).length;

      const tilePath = join(outputDirectory, year.name, `${quest.name}.svg`);

      generatedTiles.push({
        path: tilePath,
        content: renderTile(quest.number, parts, solutions),
      });

      const imageUrl = toUrlPath(relative(root, tilePath));
      const questUrl = toUrlPath(relative(root, quest.path));
      const alt = `Quest ${quest.number}`;

      images.push(
        `  <a href="${questUrl}"><img src="${imageUrl}" alt="${alt}" width="220"></a>`,
      );
    }

    const possibleStars = starsPerYear;
    totalStars += yearStars;

    const yearLabel =
      yearStars === possibleStars
        ? `${year.number} - ${yearStars} ⭐`
        : `${year.number} - ${yearStars}/${possibleStars} ⭐`;

    sections.push(
      [
        '<h1 align="center">',
        yearLabel,
        '</h1>',
        '<p align="center">',
        ...images,
        '</p>',
      ].join('\n'),
    );
  }

  const totalLabel =
    totalStars === totalPossibleStars
      ? `${totalStars}`
      : `${totalStars}/${totalPossibleStars}`;

  const header = [
    '<h1 align="center">',
    `  Everybody Codes - ${totalLabel} ⭐`,
    '</h1>',
  ].join('\n');

  const content = [header, ...sections].join('\n\n');
  const updatedReadme = replaceReadmeSection(readme, content);

  for (const tile of generatedTiles) {
    await mkdir(dirname(tile.path), { recursive: true });
    await writeFile(tile.path, tile.content);
  }

  await writeFile(readmePath, updatedReadme);

  console.log(`Generated ${generatedTiles.length} tiles`);
  console.log('Updated README.md');
};

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
