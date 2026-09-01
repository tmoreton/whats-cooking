# Privacy Policy — What's Cooking?

_Last updated: August 31, 2026_

What's Cooking? ("the app") turns photos of a fridge, pantry, and spice rack
into recipe suggestions. This policy explains what information the app handles,
why it is used, and the choices available to users.

## Information the app processes

- **Account information.** An account is required to use the scan service. The
  app collects an email address and Amazon Cognito assigns an account
  identifier. Authentication tokens are stored on the device so the user can
  remain signed in.
- **Photos selected for a scan.** The app resizes photos on the device and,
  after the user gives explicit consent, sends them securely to the backend so
  an AI model can identify ingredients and create recipes.
- **Dietary preferences submitted with a scan.** Vegetarian, vegan, and
  gluten-free choices are sent with each scan so the requested recipes can
  respect those choices.
- **Preferences and recent results on the device.** Dietary settings and recent
  scan results are stored locally and are not saved to the account or retained
  by the backend.
- **Technical connection data.** The infrastructure retains limited request
  metadata, including an IP address, request identifier, route, status, and
  timing, in operational and security logs for no more than 14 days.

The app does not request a name, contacts, precise location, microphone access,
or photo-library access.

## How photos and AI processing work

Before the first scan upload, the app explains the processing and asks for
explicit permission. Photos and dietary preferences are transmitted over an
encrypted HTTPS connection to Amazon Web Services in the United States.
Anthropic Claude, provided through Amazon Bedrock, processes that information
to identify visible ingredients and generate recipe suggestions.

Photos and scan inputs are processed for the real-time request and are not
intentionally retained by the app backend after the response is returned. They
are not sold, used for advertising, or provided to third parties for their own
marketing.

## Service providers

Amazon Web Services provides account authentication, API, logging, runtime, and
AI infrastructure. Anthropic provides the Claude AI model through Amazon
Bedrock. These providers process information on our behalf to operate the app
and are required to protect it consistently with this policy and applicable
requirements.

## Camera access

The app requests camera access only after the user chooses to start a scan. The
camera is used to photograph food and ingredients. The app does not access the
photo library or record audio.

## Retention, deletion, and privacy choices

- AI photo-processing consent can be withdrawn in **Settings → Privacy**.
  Withdrawing consent prevents future scan uploads unless the user agrees
  again. Because scan photos are not intentionally retained after processing,
  there is no stored photo archive to delete.
- Recent results can be cleared inside the app at any time.
- A signed-in user can permanently delete an account in
  **Settings → Account → Delete account**. This deletes the Cognito account,
  email address, account identifier, authentication tokens, preferences, and
  recent results stored by the app on that device.
- Deleting the app removes its on-device preferences, recent results,
  authentication tokens, and saved consent choice.
- Operational and security logs are automatically deleted after no more than
  14 days.

## Advertising, analytics, and tracking

What's Cooking? contains no advertising or third-party analytics SDKs. The app
does not track users across apps or websites and does not sell personal data.

## Children

The app is not directed to children under 13, and we do not knowingly collect
personal information from children under 13.

## Contact and privacy requests

For a privacy question or request, email
[tmoreton89@gmail.com](mailto:tmoreton89@gmail.com), open a
[GitHub support issue](https://github.com/tmoreton/whats-cooking/issues/new), or
visit the [developer profile](https://github.com/tmoreton).

## Changes

We may update this policy as the app changes. The date at the top of this page
will show the latest revision. If a material change affects AI photo
processing, the app will ask for consent again.
