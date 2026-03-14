# VISTA

**V**isual **I**nspector of **S**ocial **T**ags & **A**ttributes

A lightweight web tool that previews how any URL will appear when shared across platforms — Google Search, Facebook, X (Twitter), Slack, WhatsApp, LinkedIn, and Discord.

## How it works

1. Enter a URL
2. VISTA fetches the page and extracts metadata (`<title>`, `meta description`, Open Graph, Twitter Cards, JSON-LD)
3. See side-by-side mock previews styled to match each platform's card layout

## Architecture

- **Frontend**: Static HTML/CSS/JS — renders platform-accurate preview cards
- **Backend**: Cloudflare Worker — proxies URL fetches (bypasses CORS) and extracts meta tags

## Development

Coming soon.

## License

MIT
