# Everybody Codes Tiles

Generate tiles for your Everybody Codes solutions, showing completion times, ranks and languages in your README.

Currently this only supports events, stories support is planned for the future.

**This project is inspired by and based on [AoC Tiles](https://github.com/LiquidFun/aoc_tiles) by LiquidFun**, rewritten for Everybody Codes.

## Installation

Download the executable for your operating system and architecture from this repository's **Releases** page.

On Linux and macOS, make the downloaded file executable:

```bash
chmod +x /path/to/ebc-tiles-linux-x64
```

Replace the filename with the one you downloaded. On Windows, use the `.exe` file instead.

## Setup

### 1. Add README markers

Add these markers to your repository's `README.md` where you want the tiles:

```md
<!-- EBC TILES BEGIN -->
<!-- EBC TILES END -->
```

The content between the markers is replaced each time you run the executable.

### 2. Add your cookie

Add `.env` to your repository's `.gitignore`:

```gitignore
.env
```

Then create a `.env` file in the repository root:

```dotenv
EBC_COOKIE=your-cookie-value
```

Replace `your-cookie-value` with the value of the `everybody-codes` cookie from your browser. Don't include `everybody-codes=` in the value.

**Treat this cookie like a password.** Don't commit or share it. Adding `.env` to `.gitignore` won't stop Git tracking it if it has already been committed.

Alternatively, you can set the cookie as an environment variable instead of using a `.env` file.

### 3. Check your solution layout

These are some of the supported layouts for your solutions:

```text
2026/
  01/
    a.ts
    b.ts
    c.ts
```

```text
ebc/
  2026/
    01/
      part-1.py
      part-2.py
      part-3.py
```

If an `ebc` directory exists, the script uses it; otherwise, it uses the repository root. Quest directories can be named `1`, `quest-01` or `day_01`. Solution files can be nested within a quest directory, e.g. `2026/01/a/index.ts`. Common part filenames such as `a.ts`, `1.py`, `part-2.go` and `p3.rs` are recognised.

## Usage

Run the executable **from your solutions repository root**, using the path to your downloaded file:

```bash
/path/to/ebc-tiles-linux-x64
```

On Windows, run the downloaded `.exe` from the same directory.

The script updates `README.md` and saves the generated tiles in `.ebc-tiles/`. Commit both the README and `.ebc-tiles/` to display the tiles in your repository. Run the executable again whenever you want to update them.

## Configuration

Add any optional settings to your `.env` file:

```dotenv
EBC_COOKIE=your-cookie-value

# Optional: override the user ID extracted from the cookie.
EBC_USER_ID=4539

# Optional: override the solutions directory.
EBC_SOLUTIONS_DIR=ebc
```

Paths are relative to the repository root unless an absolute path is provided.

## Notes

- Only quests with local directories get tiles and count towards the displayed yearly star total.
- The leaderboard determines which parts are solved; files determine the displayed languages.
- Rankings are fetched on every run.
- Old generated tiles are not removed automatically.

## Credits

- [AoC Tiles by LiquidFun](https://github.com/LiquidFun/aoc_tiles) - the
  inspiration and basis for this project.
- [GitHub Linguist](https://github.com/github-linguist/linguist) - language
  extensions and colours.
- [Everybody Codes](https://everybody.codes/) - quest and ranking data.
