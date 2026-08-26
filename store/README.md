# App Store assets

## Metadata (`metadata/en-US/`)

The English (U.S.) App Store name, subtitle, keywords, promotional text, and
description live here so the public listing copy remains version-controlled.

## Screenshots (`screenshots/`)

The store assets are split by Apple's required display classes:

- `screenshots/iphone-6.5/`: **1284 × 2778** portrait screenshots for the
  6.5-inch iPhone slot currently shown by App Store Connect.
- `screenshots/ipad-13/`: **2064 × 2752** portrait screenshots for the 13-inch
  iPad slot. These use a wider tablet frame and tablet-specific content layouts,
  rather than stretched iPhone artwork.

App Store Connect scales these highest-resolution sets for smaller iPhone and
iPad display classes.

| File | Caption |
|------|---------|
| `01-know-what-to-cook.png` | Know what to cook. |
| `02-reads-your-fridge.png` | AI reads your whole fridge. |
| `03-real-recipes.png` | Real recipes from what you have. |
| `04-fridge-pantry-spice.png` | Fridge, pantry & spice rack. |

### Regenerate

Both sets are generated from vector SVG, so they stay crisp and on-brand:

```bash
python3 store/generate-screenshots.py
for f in /tmp/shots/iphone/shot-*.svg; do
  b=$(basename "$f" .svg | sed 's/^shot-//')
  rsvg-convert -w 1284 -h 2778 "$f" -o "store/screenshots/iphone-6.5/$b.png"
done
for f in /tmp/shots/ipad/shot-*.svg; do
  b=$(basename "$f" .svg | sed 's/^shot-//')
  rsvg-convert -w 2064 -h 2752 "$f" -o "store/screenshots/ipad-13/$b.png"
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
