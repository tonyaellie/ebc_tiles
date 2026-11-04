import { PARTS } from './types';
import type { QuestResults, Solution } from './types';

const COLOURS = {
  background: '#333333',
  text: '#ffffff',
  gold: '#ffdd00',
};

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };

    return replacements[character];
  });

const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `>${hours}h`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
};

const darkerColour = (hex: string): string => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Math.max(0, parseInt(channel, 16) - 10));

  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid colour: ${hex}`);
  }

  return `#${channels
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
};

export const renderTile = (
  quest: number,
  parts: QuestResults,
  solutions: Solution[],
): string => {
  const solvedCount = PARTS.filter((part) => parts[part]).length;

  const usedLanguages = [
    ...new Map(
      solutions.map((solution) => [
        solution.language.extension,
        solution.language,
      ]),
    ).values(),
  ].sort((a, b) => a.extension.localeCompare(b.extension));

  const fileLabel = usedLanguages
    .map((language) => language.extension)
    .join(' ');
  const labelFontSize = Math.min(17, 95 / (fileLabel.length * 0.65 || 1));
  const colours = usedLanguages.map((language) => language.colour);

  if (colours.length === 1) {
    colours.push(darkerColour(colours[0]));
  }

  const stripeWidth = 16;
  const patternWidth = Math.max(1, colours.length) * stripeWidth;

  const stripes = colours
    .map(
      (colour, index) =>
        `<rect x="${index * stripeWidth}" width="${stripeWidth}" ` +
        `height="32" fill="${colour}" />`,
    )
    .join('');

  const background =
    colours.length === 0
      ? ''
      : solvedCount === 3
        ? `<rect width="220" height="120" fill="url(#stripes)" />`
        : solvedCount > 0
          ? `<path d="M 0 0 H 220 L 0 120 Z" fill="url(#stripes)" />`
          : '';

  const partRows = PARTS.map((part, index) => {
    const result = parts[part];
    const y = index * 40;

    const details = result
      ? `
        <text x="214" y="${y + 21}" class="time">
          ${escapeXml(formatTime(result.localTime))}
        </text>
        <text x="214" y="${y + 35}" class="rank"${
          result.globalRank <= 100 ? ` fill="${COLOURS.gold}"` : ''
        }>
          #${result.globalRank}
        </text>`
      : `
        <text x="192" y="${y + 29}" class="missing">&#215;</text>`;

    return `
      <text x="111" y="${y + 25}" class="part">P${part}</text>
      ${details}
      ${index < 2 ? `<path d="M 110 ${y + 40} H 215" class="divider" />` : ''}
    `;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="120" viewBox="0 0 220 120">
  <defs>
    <pattern id="stripes" width="${patternWidth}" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      ${stripes}
    </pattern>
  </defs>
  <style>
    text { font-family: sans-serif; }
    .label { font-size: 19px; font-weight: 900; }
    .quest { font-size: 72px; font-weight: 900; }
    .files { font-family: monospace; font-size: 17px; }
    .part { font-size: 23px; font-weight: 900; }
    .time { font-family: monospace; font-size: 18px; text-anchor: end; }
    .rank { font-family: monospace; font-size: 11px; text-anchor: end; }
    .missing { font-size: 25px; text-anchor: middle; }
    .divider { stroke: ${COLOURS.text}; stroke-width: 1; }
  </style>
  <rect width="220" height="120" fill="${COLOURS.background}" />
  ${background}
  <g fill="${COLOURS.text}">
    <text x="5" y="20" class="label">Quest</text>
    <text x="2" y="91" class="quest">${String(quest).padStart(2, '0')}</text>
    <text x="5" y="111" class="files" style="font-size: ${labelFontSize}px">${escapeXml(fileLabel)}</text>
    ${partRows}
  </g>
  <path d="M 105 5 V 115" class="divider" />
</svg>
`;
};
