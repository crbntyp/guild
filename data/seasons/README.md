# Season Data Archive

This folder contains captured Mythic+ season leaderboard data.

## Why Capture Season Data?

Blizzard's Battle.net API only provides leaderboard data for the current active season. Once a season ends, all historical leaderboard data becomes inaccessible through the API (returns 404).

To preserve this data and enable historical comparisons, we automatically capture season data before it disappears.

## How It Works

### Automatic Capture

A GitHub Action runs daily at 9 AM UTC (`/.github/workflows/capture-season-data.yml`) to check:
1. If the current season has ended
2. If the season is ending within 7 days
3. If we already have captured data for this season

When a season ends (or is about to end) and we don't have the data yet, the script automatically:
1. Fetches all dungeon leaderboards for the final week
2. Saves the data to `/data/seasons/season-{id}.json`
3. Commits and pushes the data to the repository

### Manual Capture

You can also manually capture season data:

```bash
npm run capture:season
```

This is useful for:
- Testing the capture system
- Manually capturing data when a season end is announced
- Re-capturing data if needed

## Data Structure

Each season file contains:

```json
{
  "seasonId": 15,
  "seasonName": "Mythic+ Dungeons (The War Within Season 3)",
  "startTimestamp": 1736236800000,
  "endTimestamp": null,
  "periodId": 1040,
  "capturedAt": 1234567890000,
  "dungeonCount": 8,
  "dungeons": [
    {
      "dungeonId": 378,
      "dungeonName": "Halls of Atonement",
      "leaderboard": {
        "leading_groups": [...],
        "map": {...},
        ...
      }
    }
  ]
}
```

## Application Integration

The Mythic+ page (`/src/scripts/mythic-plus.js`) automatically:
1. Checks for local season data first
2. Falls back to API if no local data exists
3. Displays a "Historical Data" badge when using captured data
4. Shows the capture date in the status bar

## GitHub Secrets Required

For the GitHub Action to work, you need to set these secrets in your repository:

- `BNET_CLIENT_ID` - Your Battle.net OAuth Client ID
- `BNET_CLIENT_SECRET` - Your Battle.net OAuth Client Secret

Go to: **Settings → Secrets and variables → Actions → New repository secret**

## Manual Trigger

You can manually trigger the GitHub Action:

1. Go to **Actions** tab in GitHub
2. Select "Capture Season Data" workflow
3. Click "Run workflow"

This is useful for testing or if you want to capture data before the automatic schedule runs.
