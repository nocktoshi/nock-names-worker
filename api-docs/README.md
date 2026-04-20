# NockNames API Docs

This directory is a **standalone static documentation site** for the NockNames API.

## Preview locally

- **Option A (quick)**: open `api-docs/index.html` in a browser.
- **Option B (recommended)**: run a tiny static server:

```bash
node api-docs/serve.mjs
```

Then open `http://localhost:4173`.

## Notes on styling

- The site uses the same **Berkeley Mono** font that `nocknames.com` serves via `@font-face` URLs.
- If you want the docs to work fully offline, add your licensed Berkeley Mono files under `api-docs/fonts/` and update the `@font-face` URLs in `api-docs/styles.css`.


