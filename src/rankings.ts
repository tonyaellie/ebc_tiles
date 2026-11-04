import { PARTS } from './types';
import type { Part, PartResult, QuestResults } from './types';

type RankingRow = [
  quest: number,
  part: Part,
  globalTime: number,
  localTime: number,
  globalRank: number,
];

const parseUserId = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return String(value);
  }

  if (typeof value === 'string' && /^[1-9]\d*$/.test(value)) {
    return value;
  }

  return null;
};

export const getUserId = (token: string): string => {
  const configuredId = process.env.EBC_USER_ID;

  if (configuredId) {
    const userId = parseUserId(configuredId);

    if (!userId) {
      throw new Error('EBC_USER_ID must be a positive integer');
    }

    return userId;
  }

  const segments = token.split('.');

  if (segments.length !== 3) {
    throw new Error('Missing user ID. Set EBC_USER_ID explicitly instead.');
  }

  let payload: unknown;

  try {
    payload = JSON.parse(
      Buffer.from(segments[1], 'base64url').toString('utf8'),
    );
  } catch {
    throw new Error('Could not decode the EBC_COOKIE JWT payload');
  }

  if (typeof payload !== 'object' || payload === null) {
    throw new Error('The JWT payload is not an object');
  }

  const userId = parseUserId((payload as Record<string, unknown>).id);

  if (!userId) {
    throw new Error(
      "No numeric 'id' claim found in the JWT. Set EBC_USER_ID explicitly.",
    );
  }

  return userId;
};

const parseRankings = (data: unknown): RankingRow[] => {
  if (!Array.isArray(data)) {
    throw new Error('Expected rankings to be an array');
  }

  return data.map((row, index) => {
    if (
      !Array.isArray(row) ||
      row.length !== 5 ||
      !row.every((value) => typeof value === 'number' && Number.isFinite(value))
    ) {
      throw new Error(`Invalid rankings row at index ${index}`);
    }

    const [quest, part, globalTime, localTime, globalRank] = row;

    if (
      !Number.isSafeInteger(quest) ||
      quest < 1 ||
      !PARTS.includes(part as Part) ||
      globalTime < 0 ||
      localTime < 0 ||
      !Number.isSafeInteger(globalRank) ||
      globalRank < 1
    ) {
      throw new Error(`Invalid rankings values at index ${index}`);
    }

    return [quest, part as Part, globalTime, localTime, globalRank];
  });
};

export const fetchRankings = async (
  year: number,
  userId: string,
  token: string,
): Promise<Map<number, QuestResults>> => {
  const url = `https://api.everybody.codes/ranking/${year}/user/${userId}`;

  const response = await fetch(url, {
    headers: {
      Cookie: `everybody-codes=${token}`,
      'User-Agent': 'ebc-tiles (https://github.com/tonyaellie/ebc_tiles)',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${year} rankings: HTTP ${response.status}`,
    );
  }

  const rows = parseRankings(await response.json());
  const quests = new Map<number, QuestResults>();

  for (const [quest, part, globalTime, localTime, globalRank] of rows) {
    const parts = quests.get(quest) ?? {};

    if (parts[part]) {
      throw new Error(`Duplicate ranking for quest ${quest}, part ${part}`);
    }

    const result: PartResult = {
      globalTime,
      localTime,
      globalRank,
    };

    parts[part] = result;
    quests.set(quest, parts);
  }

  return quests;
};
