# Luxtronic Portal

Internal landing page with quick links to Luxtronic's tools, plus fuel and hardware price pages. Served as static HTML/CSS by a small Node script, managed with pm2.

## Pages

- `index.html` — main portal with links to internal tools and services
- `fuel.html` — fuel prices
- `hw.html` — hardware prices

## Requirements

- Node.js
- [pm2](https://pm2.keymetrics.io/) (`npm install -g pm2`)

## Setup

```
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable                 | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------- |
| `MASTEX_PRICE_LIST_URL`   | Supplier catalog URL. Kept out of the HTML source, served via a redirect route (`/links/mastex-price-list`) instead. |
| `PORT`                    | Port the server listens on (default `80`).                              |

`.env` is git-ignored — it stays local to each machine that runs the portal.

## Running

Directly:

```
npm start
```

With pm2:

```
pm2 start ecosystem.config.js
```

Other pm2 commands:

```
pm2 status
pm2 logs luxtronic-portal
pm2 restart luxtronic-portal
pm2 stop luxtronic-portal
```

## How it works

`portal.js` is a dependency-free Node HTTP server that serves the files in this repo as static assets (`/` maps to `index.html`). It also loads `.env` on startup and exposes any configured redirect routes (currently `/links/mastex-price-list`) so secrets/links that shouldn't be public never appear in the served HTML.
