# App Store assets

## Metadata (`metadata/en-US/`)

The English (U.S.) App Store name, subtitle, keywords, promotional text, and
description live here so the public listing copy remains version-controlled.

## Screenshots (`screenshots/`)

Four branded marketing screenshots at **1290 × 2796** — the iPhone 6.7"
display class accepted by App Store Connect (also displays for 6.9"). Upload
this set under the 6.7" slot; App Store Connect scales it to the other required
sizes.

| File | Caption |
|------|---------|
| `01-know-what-to-cook.png` | Know what to cook. |
| `02-reads-your-fridge.png` | AI reads your whole fridge. |
| `03-real-recipes.png` | Real recipes from what you have. |
| `04-fridge-pantry-spice.png` | Fridge, pantry & spice rack. |

### Regenerate

They're generated from vector SVG (no screen recording needed), so they stay
crisp and on-brand:

```bash
python3 store/generate-screenshots.py      # writes SVGs to /tmp
for f in /tmp/shot-*.svg; do
  b=$(basename "$f" .svg | sed 's/^shot-//')
  rsvg-convert -w 1290 -h 2796 "$f" -o "store/screenshots/$b.png"
done
```

Requires `rsvg-convert` (`brew install librsvg`). Edit captions/content in
`generate-screenshots.py`.

## Notification icon

`whats-cooking/assets/notification-icon.png` is a flat white egg silhouette on
transparent — Android tints status-bar notification icons, so it must be
monochrome. Wired via the `expo-notifications` plugin in `app.json` (with the
brand orange accent color). iOS uses the app icon for notifications, so no
separate iOS asset is needed.
