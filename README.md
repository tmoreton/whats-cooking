# What's Cooking? 🍳

Snap a photo (or a few) of your fridge, pantry, and spice cabinet — a Strands
agent on Amazon Bedrock AgentCore identifies the ingredients and invents recipes
you can actually make.

```
┌──────────────────────┐   HTTPS + JWT   ┌───────────────────┐   SigV4   ┌────────────────────────┐
│ Expo iOS app         │ ──────────────► │ API Gateway +     │ ────────► │ AgentCore runtime       │
│ (whats-cooking/)     │                 │ Lambda proxy      │           │ Strands + Claude vision │
│ camera → images[]    │ ◄────────────── │ (proxy/)          │ ◄──────── │ (backend/)              │
│ recipe cards         │  RecipeResponse │ Cognito authorizer│           │ generates recipes       │
└──────────────────────┘                 └───────────────────┘           └────────────────────────┘
```

## Repo layout

| Path | What it is |
|------|-----------|
| `backend/` | Strands agent + AgentCore entrypoint (`main.py`). Vision → ingredients → AI-generated recipes. |
| `proxy/` | SAM app: HTTP API + Lambda that SigV4-signs to the runtime, protected by a Cognito JWT authorizer. |
| `whats-cooking/` | Expo (SDK 52, expo-router) iOS app. **All `npm`/`eas` commands run from here.** |
| `docs/TESTFLIGHT.md` | Deep-dive on the CI/TestFlight setup. |
| `.github/workflows/ios-testflight.yml` | GitHub Actions → EAS Build → TestFlight. |

## What's already deployed

The backend and proxy are **already live** in AWS (us-east-1), and their
connection details are committed to `whats-cooking/.env`. So to make a TestFlight
build on another computer you normally **only touch the frontend** — you do
*not* need AWS access unless you want to redeploy the backend/proxy.

| Resource | Value |
|----------|-------|
| AgentCore runtime | `arn:aws:bedrock-agentcore:us-east-1:253170388727:runtime/whats_cooking-iik9UNDwCW` |
| Proxy API | `https://odrc67iamk.execute-api.us-east-1.amazonaws.com/invocations` |
| Auth | Cognito user pool (machine-to-machine `client_credentials`) |

---

## 🚀 Run on another computer → TestFlight

**Prerequisites** (accounts you must already have — these can't be scripted):
an Expo/EAS account, an Apple Developer Program membership, and an App Store
Connect API key (`.p8` + Key ID + Issuer ID).

### 1. Clone and install

```bash
git clone https://github.com/tmoreton/whats-cooking.git
cd whats-cooking/whats-cooking      # the Expo app subfolder
npm ci
npx tsc --noEmit                    # optional sanity check
```

The committed `.env` already carries the API URL + Cognito config; Expo inlines
those `EXPO_PUBLIC_*` values at build time, so there's nothing else to configure
for the app to reach the backend.

### 2. One-time EAS setup

```bash
npm i -g eas-cli
eas login
eas init                            # links to your Expo account, prints a project ID
```

`eas init` prints a **project ID**. The quickest way to wire it everywhere is:

```bash
eas update:configure     # fills expo.extra.eas.projectId AND expo.updates.url
```

That replaces the two `REPLACE_WITH_EAS_PROJECT_ID` placeholders in `app.json`
(`expo.extra.eas.projectId` and `expo.updates.url`) — **the build fails until
these are real**. Then let EAS manage signing and store your ASC API key:

```bash
eas credentials
# iOS → let EAS create/manage the Distribution Certificate + Provisioning Profile
# → App Store Connect API Key → upload your .p8, enter Key ID + Issuer ID
```

With the ASC key stored in EAS, CI needs only `EXPO_TOKEN`.

### 3. Add the GitHub secret

Create an Expo access token at **expo.dev → Account → Access Tokens**, then:

```bash
gh secret set EXPO_TOKEN --repo tmoreton/whats-cooking
# (or GitHub UI: Settings → Secrets and variables → Actions → New repository secret)
```

`EXPO_TOKEN` is the **only** required secret on the default path. (An alternative
path that keeps the ASC key in GitHub secrets instead of EAS is documented in
[`docs/TESTFLIGHT.md`](docs/TESTFLIGHT.md).)

### 4. Build & submit

- **Tag a release** (recommended):

  ```bash
  git tag v1.0.0 && git push origin v1.0.0
  ```

- **Or** GitHub → **Actions** → **iOS TestFlight** → **Run workflow**.

Either triggers `eas build -p ios --profile production --non-interactive
--auto-submit` on Expo's servers (no Mac needed). EAS builds the `.ipa`, bumps
the build number, and submits to App Store Connect — it appears in TestFlight
once Apple finishes processing.

### Build locally instead (no GitHub Actions)

From `whats-cooking/`: `eas build -p ios --profile production --auto-submit`.

---

## 📡 Over-the-air updates (EAS Update)

The app ships with `expo-updates` and is wired for [EAS Update](https://docs.expo.dev/eas-update/introduction/),
so you can push **JS/asset** changes to already-installed builds without a new
TestFlight submission. Production builds subscribe to the `production` channel
(`eas.json`); `runtimeVersion` uses the `appVersion` policy.

```bash
cd whats-cooking
eas update --branch production --message "Tweak copy / fix bug"
```

Installed apps on a matching runtime version pick up the update on next launch.

**Caveat:** OTA updates only cover JavaScript and assets. Anything that changes
native code — adding/upgrading a native module, bumping the Expo SDK, or editing
`app.json` native config — requires a **new build** (bump `version`, so the
`runtimeVersion` changes, and re-run the TestFlight flow above).

---

## Optional: redeploy the backend / proxy

Only needed if you change `backend/` or `proxy/`. Requires AWS credentials for
the account above (us-east-1).

**Backend (AgentCore runtime):**
```bash
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt bedrock-agentcore-starter-toolkit
.venv/bin/agentcore deploy          # config is in .bedrock_agentcore.yaml
.venv/bin/agentcore status          # wait for endpoint READY
```

**Proxy (SAM):** requires SAM CLI + a container runtime. This machine is
configured to use **Finch** (start it first: `finch vm start`).
```bash
cd proxy
sam build && sam deploy             # profiles/tags in samconfig.toml
```
If you redeploy the proxy and the API URL or Cognito values change, update
`whats-cooking/.env` accordingly and commit.

## Teardown

```bash
cd proxy   && sam delete --stack-name whats-cooking-proxy
cd backend && .venv/bin/agentcore destroy
```

## Security notes

- The proxy endpoint is **not** public/unauthenticated — it's behind a Cognito
  JWT authorizer (AWS/Isengard standard). Least-privilege IAM, access logging,
  and log retention are configured in `proxy/template.yaml`.
- The Cognito **client secret** ships in `whats-cooking/.env` for this private
  repo / TestFlight demo. For a public App Store release, move token issuance
  server-side or switch to per-user Cognito auth so no secret is bundled.
