# GitHub Activity Dashboard

A cinematic dark dashboard for CameronCodesStuff that tracks GitHub activity in real time.

## Setup

Open `index.html` in a browser. You'll see a token prompt on first load.

Paste a GitHub personal access token to unlock 5,000 req/hr. The token is stored in `sessionStorage` — it stays for the current browser session only and is never sent anywhere except GitHub's API.

To skip, click "Skip" — the dashboard works without a token but is limited to 60 req/hr.

To change the token later, click "Change token" in the top right.

## Generating a token

GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token

`public_repo` read scope is enough for public repositories.

## Features

- Token prompt on first load with session storage
- Live repo feed sorted by most recently pushed
- Latest commit message per repo
- GitHub stats: repos, stars, followers, streak, languages, pushed today
- Contribution activity graph
- GitHub stats card
- Streak stats card
- Language filter chips
- Auto-refresh every 60 seconds with countdown ring
- Teal + purple particle field
- Highlights repos updated since last poll
- Fully responsive

## Customisation

| Key | File | Description |
|---|---|---|
| `CONFIG.username` | `app.js` | GitHub username to track |
| `CONFIG.refreshInterval` | `app.js` | Seconds between polls |
| `CONFIG.repoLimit` | `app.js` | Max repos to fetch |
| `CONFIG.commitFetchLimit` | `app.js` | Repos to fetch latest commit for |
| `--teal` | `style.css` | Primary accent colour |
| `--purple` | `style.css` | Secondary accent colour |
| `--bg` | `style.css` | Background colour |
