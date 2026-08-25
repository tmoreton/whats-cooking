# TestFlight builds via EAS + GitHub Actions

This repo ships **What's Cooking?** (Expo SDK 52, expo-router) to iOS
TestFlight using [EAS Build](https://docs.expo.dev/build/introduction/).
The native build runs on Expo's servers, so **no macOS runner is required** —
GitHub Actions just triggers EAS and lets it submit to App Store Connect.

The Expo app lives in the `whats-cooking/` subfolder. All `eas` commands below
must be run from inside that folder.

---

## Prerequisites (already satisfied)

- An Expo / EAS account.
- An Apple Developer Program membership.
- An App Store Connect API key: the `.p8` file, plus its **Key ID** and
  **Issuer ID**.

---

## One-time setup on a fresh machine

```bash
# 1. Install the EAS CLI
npm i -g eas-cli

# 2. Log in to your Expo account
eas login

# 3. Initialize the project (from the app subfolder)
cd whats-cooking
eas init
```

`eas init` links this project to your Expo account and prints a **project ID**.
Paste that value into `whats-cooking/app.json` at
`expo.extra.eas.projectId`, replacing the placeholder:

```jsonc
"extra": {
  "eas": {
    "projectId": "REPLACE_WITH_EAS_PROJECT_ID"  // <- paste your real ID here
  }
}
```

Then let EAS manage iOS signing and store your App Store Connect API key:

```bash
eas credentials
```

In the interactive menu:
- Choose **iOS** → let EAS create/manage the **Distribution Certificate** and
  **Provisioning Profile** (EAS-managed signing is recommended).
- Choose the **App Store Connect API Key** option and upload your `.p8`,
  entering the **Key ID** and **Issuer ID** when prompted.

Once the ASC API key is stored in EAS, CI only needs `EXPO_TOKEN` — EAS supplies
the ASC key automatically during `--auto-submit`. This is the **default** path
used by the workflow.

---

## GitHub secrets to add

Go to **Settings → Secrets and variables → Actions → New repository secret**.

### Required

| Secret | Where to get it |
|--------|-----------------|
| `EXPO_TOKEN` | expo.dev → **Account** → **Access Tokens** → create a token |

That is the **only** secret needed when the ASC API key is stored in EAS
(default path above).

### Optional — only if you do NOT store the ASC key in EAS

Use these if you prefer to keep the ASC API key in GitHub instead of uploading
it to EAS. You must also switch to the alternative steps in
`.github/workflows/ios-testflight.yml` (they are present but commented out).

| Secret | Value |
|--------|-------|
| `ASC_API_KEY_P8` | Base64 of the `.p8` file: `base64 -i AuthKey_XXXX.p8 \| pbcopy` |
| `ASC_API_KEY_ID` | The App Store Connect API **Key ID** |
| `ASC_API_KEY_ISSUER_ID` | The App Store Connect API **Issuer ID** |

The workflow decodes `ASC_API_KEY_P8` to `whats-cooking/asc-api-key.p8`, and
`eas.json`'s `submit.production.ios` block references that file plus the two env
vars.

---

## How to trigger a build

- **Push a version tag** (recommended for releases):

  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

- **Or run it manually**: GitHub → **Actions** → **iOS TestFlight** →
  **Run workflow**.

Either trigger runs `eas build --platform ios --profile production
--non-interactive --auto-submit`. EAS builds the app, bumps the build number
(`autoIncrement` with remote `appVersionSource`), then submits the `.ipa` to
App Store Connect. The build shows up in TestFlight after Apple finishes
processing.

---

## Note on runtime environment variables

Runtime config prefixed with `EXPO_PUBLIC_*` comes from the committed
`whats-cooking/.env` file (already in the repo). Expo **inlines** these values
into the JS bundle at build time, so they do **not** need to be added as GitHub
secrets. Nothing app-config-wise needs to be a repository secret beyond the ones
listed above.
