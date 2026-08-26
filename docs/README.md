# Public website

This folder is the source for the What's Cooking? GitHub Pages site:

- `index.html` — marketing page
- `support/index.html` — App Store support URL
- `privacy/index.html` — App Store privacy policy URL
- `PRIVACY.md` — Markdown copy of the privacy policy for the repository

GitHub Pages should publish from the `docs/` folder on the `main` branch.

## Preview locally

From the repository root:

```bash
python3 -m http.server 8000 --directory docs
```

Then open `http://localhost:8000`.
