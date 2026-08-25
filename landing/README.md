# Landing page

A single, self-contained `index.html` (no build step, no dependencies) for the
**What's Cooking?** marketing/download page.

## Set the download link

Search-replace `#download` in `index.html` with your public TestFlight invite
URL (e.g. `https://testflight.apple.com/join/XXXXXXXX`). There are three CTA
buttons (nav, hero, bottom band) plus footer links — replacing `#download`
updates the CTAs; leave the in-page `#how` / `#download` anchor links if you
prefer smooth-scroll behavior on the section anchors.

## Deploy (pick one)

- **GitHub Pages:** move/copy `index.html` to a `docs/` folder or a `gh-pages`
  branch, then enable Pages in repo settings.
- **Vercel / Netlify:** drag-and-drop this folder, or point the project at it.
- **S3 + CloudFront:** `aws s3 cp index.html s3://<bucket>/` with static hosting.

## Preview locally

```bash
cd landing && python3 -m http.server 8000   # open http://localhost:8000
```
