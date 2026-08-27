# What's Cooking? 🍳

Snap a photo (or a few) of your fridge, pantry, and spice cabinet — a Strands
agent on Amazon Bedrock AgentCore identifies the ingredients and invents recipes
you can actually make.

```
┌──────────────────────┐   HTTPS + JWT   ┌───────────────────┐   SigV4   ┌────────────────────────┐
│ Expo iOS app         │ ──────────────► │ API Gateway +     │ ────────► │ AgentCore runtime       │
│ (whats-cooking/)     │                 │ Lambda proxy      │           │ Strands + Claude vision │
│ camera → images[]    │ ◄────────────── │ Cognito User Pool │ ◄──────── │ (backend/)              │
│ recipe cards         │  RecipeResponse │ JWT authorizer    │           │ generates recipes       │
└──────────────────────┘                 └───────────────────┘           └────────────────────────┘
```

## Repo layout

| Path | What it is |
|------|-----------|
| `backend/` | Strands agent + AgentCore entrypoint (`main.py`). Vision → ingredients → AI-generated recipes. |
| `proxy/` | SAM app: Cognito User Pool + JWT-protected HTTP API + Lambda that SigV4-signs requests to the runtime. |
| `whats-cooking/` | Expo (SDK 52, expo-router) iOS app. **All `npm`/`eas` commands run from here.** |
| `store/` | App Store metadata and correctly sized iPhone/iPad screenshots. |
| `docs/` | GitHub Pages marketing, support, and privacy site. |
| `docs/TESTFLIGHT.md` | Deep-dive on the EAS build/update setup. |
| `docs/PRIVACY.md` | Privacy policy (host it and use the URL in App Store Connect). |
| `whats-cooking/.eas/workflows/` | EAS Workflows: auto OTA on push + build/submit to TestFlight. |

## What's already deployed

The backend and proxy are **already live** in AWS (us-east-1), and their
connection details are committed to `whats-cooking/.env`. So to make a TestFlight
build on another computer you normally **only touch the frontend** — you do
*not* need AWS access unless you want to redeploy the backend/proxy.

| Resource | Value |
|----------|-------|
| AgentCore runtime | `arn:aws:bedrock-agentcore:us-east-1:253170388727:runtime/whats_cooking-iik9UNDwCW` |
| Proxy API | `https://odrc67iamk.execute-api.us-east-1.amazonaws.com/invocations` |
| Auth | Cognito **User Pool** (email + password); app sends the ID token as `Authorization: Bearer <token>` to the API's JWT authorizer |

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

### 2. Log in to EAS

The Expo project is already linked (`app.json` has the real `extra.eas.projectId`
and `owner`), so there's no `eas init` step — just authenticate as the project
owner (or a collaborator):

```bash
npm i -g eas-cli
eas login
```

One-time, let EAS manage iOS signing and store your App Store Connect API key
(only needed if it isn't already set up on the Expo account):

```bash
eas credentials
# iOS → let EAS manage the Distribution Certificate + Provisioning Profile
# → App Store Connect API Key → upload your .p8, enter Key ID + Issuer ID
```

### 3. Build & submit to TestFlight

CI runs on **EAS Workflows** (`whats-cooking/.eas/workflows/`) — on Expo's
infrastructure, no Mac and no GitHub secrets required.

```bash
cd whats-cooking
eas workflow:run submit-ios.yml     # builds + distributes to TestFlight
```

You can also run it from **expo.dev → your project → Workflows**. EAS builds the
`.ipa` (bumping the build number via `autoIncrement`), submits to App Store
Connect, and it appears in TestFlight once Apple finishes processing.

> Prefer a one-off without the workflow?
> `eas build -p ios --profile production --auto-submit` from `whats-cooking/`.

### 4. Before the first public submission

In **App Store Connect**, use the public marketing, support, and privacy URLs
tracked in [`store/metadata/en-US`](store/metadata/en-US), complete the **App
Privacy** questionnaire, and set a category and age rating. Photos are processed
transiently for the real-time request and are not intentionally retained;
technical connection data, including IP addresses, may remain in operational
logs for up to 14 days. Export compliance is already answered via
`ios.config.usesNonExemptEncryption: false` in `app.json`.

---

## 📡 Over-the-air updates (EAS Update)

The app ships with `expo-updates` and is wired for [EAS Update](https://docs.expo.dev/eas-update/introduction/),
so you can push **JS/asset** changes to already-installed builds without a new
TestFlight submission. Production builds subscribe to the `production` channel
(`eas.json`); `runtimeVersion` uses the `appVersion` policy.

**Automatic:** a push to `main` that touches `whats-cooking/**` publishes a
production OTA via the `publish-production-update.yml` EAS Workflow (requires the
Expo GitHub App connected to the repo).

**Manual:**

```bash
cd whats-cooking
eas update --branch production --message "Tweak copy / fix bug"
```

Installed apps on a matching runtime version pick up the update on next launch
(fully quit and reopen twice).

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

- **New builds** call `POST /v1/invocations`, protected by a **Cognito User Pool
  JWT authorizer** — every request must carry a valid ID token as
  `Authorization: Bearer <token>` (unauthenticated requests get 401). Users sign
  up (email + password, verified by an emailed code) and sign in; the app stores
  the returned tokens and refreshes them transparently.
- **Legacy route (`POST /invocations`, AWS_IAM + Cognito Identity Pool guest
  creds)** is retained during the migration for previously-shipped builds. Note:
  the original Identity Pool was replaced during the auth migration, so pre-existing
  installs are actually migrated to the JWT flow via an OTA update (`eas update`),
  not the guest route. **Remove the legacy route + Identity Pool once all installs
  have updated.**
- The API is throttled (5 req/s, burst 10). **No long-lived secret ships in the
  app:** the User Pool app client is a public client with no secret, and the ID
  token is short-lived (1h) with a refresh token.
- Least-privilege IAM, access logging, and 14-day log retention (API, Lambda, and
  the AgentCore runtime log group) are configured.
- Cognito's built-in email sender has a low daily quota — fine for testing. For a
  broad public launch, switch the User Pool `EmailConfiguration` to SES.

## License

Released under the [MIT License](LICENSE).
