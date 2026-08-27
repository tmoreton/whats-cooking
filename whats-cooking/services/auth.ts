import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Dependency-free Amazon Cognito User Pool auth.
 *
 * Mirrors the raw-`fetch` approach used in `api.ts` for the Cognito Identity
 * service: we POST JSON to the `cognito-idp` endpoint with the appropriate
 * `x-amz-target`. This avoids bundling the (heavy) Amplify SDK and the fragile
 * SRP crypto polyfills it needs in Expo.
 *
 * Flow: USER_PASSWORD_AUTH (password is protected by TLS). The app stores the
 * returned tokens and sends the **ID token** as `Authorization: Bearer <token>`
 * to the API, whose JWT authorizer validates it (see `proxy/template.yaml`).
 */

const AWS_REGION = process.env.EXPO_PUBLIC_AWS_REGION ?? "us-east-1";
const CLIENT_ID = process.env.EXPO_PUBLIC_USER_POOL_CLIENT_ID ?? "";

const SESSION_KEY = "@whatscooking/authSession";

const COGNITO_IDP_URL = `https://cognito-idp.${AWS_REGION}.amazonaws.com/`;

/** Refresh the ID token this long before it actually expires. */
const REFRESH_SKEW_MS = 2 * 60 * 1000;

export interface AuthSession {
  email: string;
  idToken: string;
  accessToken: string;
  refreshToken: string;
  /** Epoch ms at which the id/access tokens expire. */
  expiresAt: number;
}

/* ------------------------------ Cognito call ------------------------------ */

type CognitoError = { __type?: string; message?: string };

/** A user-presentable auth error with the raw Cognito error type attached. */
export class AuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

function friendlyMessage(code: string, raw?: string): string {
  switch (code) {
    case "NotAuthorizedException":
      return "Incorrect email or password.";
    case "UserNotFoundException":
      return "Incorrect email or password.";
    case "UserNotConfirmedException":
      return "Please confirm your email first — check your inbox for the code.";
    case "UsernameExistsException":
      return "An account with that email already exists.";
    case "CodeMismatchException":
      return "That code is incorrect. Please try again.";
    case "ExpiredCodeException":
      return "That code has expired. Request a new one.";
    case "InvalidPasswordException":
      return "Password must be at least 8 characters with upper, lower, and a number.";
    case "InvalidParameterException":
      return raw ?? "Please check the details you entered.";
    case "LimitExceededException":
    case "TooManyRequestsException":
      return "Too many attempts. Please wait a moment and try again.";
    case "NetworkError":
      return "Couldn't reach the sign-in service. Check your connection.";
    default:
      return raw ?? "Something went wrong. Please try again.";
  }
}

async function cognito<T>(
  operation: string,
  body: Record<string, unknown>
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(COGNITO_IDP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-amz-json-1.1",
        "x-amz-target": `AWSCognitoIdentityProviderService.${operation}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError(friendlyMessage("NetworkError"), "NetworkError");
  }

  const text = await response.text();
  const json = text ? (JSON.parse(text) as T & CognitoError) : ({} as T & CognitoError);

  if (!response.ok) {
    const rawType = (json as CognitoError).__type ?? "UnknownError";
    // __type can look like "com.amazon...#NotAuthorizedException".
    const code = rawType.includes("#") ? rawType.split("#").pop()! : rawType;
    throw new AuthError(
      friendlyMessage(code, (json as CognitoError).message),
      code
    );
  }

  return json;
}

function assertConfigured(): void {
  if (!CLIENT_ID) {
    throw new AuthError(
      "Sign-in isn't configured. Set EXPO_PUBLIC_USER_POOL_CLIENT_ID.",
      "NotConfigured"
    );
  }
}

/* ----------------------------- Session storage ---------------------------- */

let currentSession: AuthSession | null = null;
let loaded = false;

type Listener = (session: AuthSession | null) => void;
const listeners = new Set<Listener>();

function notify(): void {
  for (const l of listeners) l(currentSession);
}

/** Subscribe to auth-state changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function persist(session: AuthSession | null): Promise<void> {
  currentSession = session;
  try {
    if (session) {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      await AsyncStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Non-fatal: session just won't persist across launches.
  }
  notify();
}

/** Load any persisted session from disk. Call once at startup. */
export async function loadSession(): Promise<AuthSession | null> {
  if (loaded) return currentSession;
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    currentSession = raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    currentSession = null;
  }
  loaded = true;
  notify();
  return currentSession;
}

export function getSession(): AuthSession | null {
  return currentSession;
}

export function isSignedIn(): boolean {
  return currentSession !== null;
}

/* ------------------------------ Auth actions ------------------------------ */

interface AuthenticationResult {
  AuthenticationResult?: {
    AccessToken?: string;
    IdToken?: string;
    RefreshToken?: string;
    ExpiresIn?: number;
  };
}

function sessionFromResult(
  email: string,
  result: AuthenticationResult["AuthenticationResult"],
  fallbackRefreshToken?: string
): AuthSession {
  const idToken = result?.IdToken;
  const accessToken = result?.AccessToken;
  const refreshToken = result?.RefreshToken ?? fallbackRefreshToken;
  if (!idToken || !accessToken || !refreshToken) {
    throw new AuthError(friendlyMessage("UnknownError"), "UnknownError");
  }
  const expiresIn = (result?.ExpiresIn ?? 3600) * 1000;
  return {
    email,
    idToken,
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn,
  };
}

/** Create an account. The user must then confirm via emailed code. */
export async function signUp(email: string, password: string): Promise<void> {
  assertConfigured();
  await cognito("SignUp", {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
}

/** Confirm a new account with the 6-digit code emailed by Cognito. */
export async function confirmSignUp(email: string, code: string): Promise<void> {
  assertConfigured();
  await cognito("ConfirmSignUp", {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

/** Re-send the sign-up confirmation code. */
export async function resendConfirmationCode(email: string): Promise<void> {
  assertConfigured();
  await cognito("ResendConfirmationCode", {
    ClientId: CLIENT_ID,
    Username: email,
  });
}

/** Sign in with email + password. Persists the session on success. */
export async function signIn(
  email: string,
  password: string
): Promise<AuthSession> {
  assertConfigured();
  const res = await cognito<AuthenticationResult>("InitiateAuth", {
    ClientId: CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  const session = sessionFromResult(email, res.AuthenticationResult);
  await persist(session);
  return session;
}

/** Begin a password reset — Cognito emails a code. */
export async function forgotPassword(email: string): Promise<void> {
  assertConfigured();
  await cognito("ForgotPassword", { ClientId: CLIENT_ID, Username: email });
}

/** Complete a password reset with the emailed code and a new password. */
export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  assertConfigured();
  await cognito("ConfirmForgotPassword", {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
}

/** Clear the local session. */
export async function signOut(): Promise<void> {
  const token = currentSession?.accessToken;
  await persist(null);
  // Best-effort server-side revoke; ignore failures (already signed out locally).
  if (token) {
    try {
      await cognito("GlobalSignOut", { AccessToken: token });
    } catch {
      /* ignore */
    }
  }
}

let refreshInFlight: Promise<AuthSession | null> | null = null;

async function refreshSession(): Promise<AuthSession | null> {
  const session = currentSession;
  if (!session) return null;
  try {
    const res = await cognito<AuthenticationResult>("InitiateAuth", {
      ClientId: CLIENT_ID,
      AuthFlow: "REFRESH_TOKEN_AUTH",
      AuthParameters: { REFRESH_TOKEN: session.refreshToken },
    });
    // REFRESH_TOKEN_AUTH does not return a new refresh token — reuse the old one.
    const next = sessionFromResult(
      session.email,
      res.AuthenticationResult,
      session.refreshToken
    );
    await persist(next);
    return next;
  } catch (err) {
    // Refresh token expired/revoked → force re-login.
    if (err instanceof AuthError && err.code === "NotAuthorizedException") {
      await persist(null);
    }
    return null;
  }
}

/**
 * Return a valid ID token for the API `Authorization` header, transparently
 * refreshing it when it's near expiry. Returns null when not signed in (or the
 * session can no longer be refreshed).
 */
export async function getIdToken(): Promise<string | null> {
  if (!loaded) await loadSession();
  const session = currentSession;
  if (!session) return null;

  if (session.expiresAt - REFRESH_SKEW_MS > Date.now()) {
    return session.idToken;
  }

  // De-dupe concurrent refreshes.
  refreshInFlight ??= refreshSession().finally(() => {
    refreshInFlight = null;
  });
  const refreshed = await refreshInFlight;
  return refreshed?.idToken ?? null;
}
