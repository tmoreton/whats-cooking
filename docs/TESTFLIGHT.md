# TestFlight & OTA via EAS Workflows

This repo ships **What's Cooking?** (Expo SDK 52, expo-router) to iOS using
[EAS Build](https://docs.expo.dev/build/introduction/) and
[EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/). Builds run on
Expo's servers — **no macOS runner and no GitHub Actions secrets required.**

The Expo app lives in the `whats-cooking/` subfolder; all `eas` commands run
from there.

---

## Prerequisites

- An Expo / EAS account with access to the project (`owner: reactnativenerd`,
  `extra.eas.projectId` are committed in `app.json`).
- An Apple Developer Program membership.
- An App Store Connect API key (`.p8` + Key ID + Issuer ID), stored in EAS via
  `eas credentials` (one-time). `eas.json` references the ASC app id
  (`submit.production.ios.ascAppId`).

---

## The workflows (`whats-cooking/.eas/workflows/`)

| File | Trigger | What it does |
|------|---------|--------------|
| `publish-production-update.yml` | push to `main` touching `whats-cooking/**` | Publishes an OTA JS/asset update to the `production` channel. |
| `submit-ios.yml` | manual (`eas workflow:run`) | Builds the iOS app and distributes it to the **Internal** TestFlight group. |

Automatic triggering requires the **Expo GitHub App** to be connected to this
repo (expo.dev → project → GitHub). Without it, run the workflows manually.

---

## Ship a native build to TestFlight

```bash
cd whats-cooking
eas login
eas workflow:run submit-ios.yml     # or run it from expo.dev → Workflows
```

EAS builds the `.ipa` (build number auto-increments via `appVersionSource:
remote`), submits to App Store Connect, and the build lands in TestFlight after
Apple processing.

One-off alternative (no workflow):

```bash
eas build -p ios --profile production --auto-submit
```

---

## Ship an OTA update (no rebuild)

JS/asset-only changes (copy, styling, logic) can go straight to installed builds:

```bash
cd whats-cooking
eas update --branch production --message "…"
```

…or just push to `main` and let `publish-production-update.yml` do it.

**Caveat:** OTA only covers JavaScript and assets. Adding/upgrading a native
module, bumping the Expo SDK, or changing native `app.json` config requires a new
build — bump `version` (so `runtimeVersion` changes) and re-run `submit-ios.yml`.

---

## Runtime env vars

`EXPO_PUBLIC_*` values come from the committed `whats-cooking/.env` and are
inlined into the JS bundle by Expo at build time — nothing needs to be a CI
secret. None of them are secrets: the API uses `AWS_IAM` auth and the app signs
requests with short-lived Cognito **Identity Pool** guest credentials (the pool
id is public by design), so no long-lived secret is bundled.

---

## App Store submission checklist

- **Privacy Policy URL** — host [`PRIVACY.md`](PRIVACY.md) publicly and set the URL.
- **App Privacy** questionnaire — declare *Photos / User Content* used for app
  functionality, not linked to identity.
- Support URL, category, age rating.
- Export compliance is pre-answered via `ios.config.usesNonExemptEncryption: false`.
