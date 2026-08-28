/**
 * In-memory holder for the password of an account that was just signed up (or
 * that a sign-in attempt found unconfirmed). It lets the confirm screen sign
 * the user in automatically once they enter the emailed code, instead of
 * bouncing them back to the login form.
 *
 * Kept in memory only — never persisted to disk — and cleared after use.
 */

let pending: { email: string; password: string } | null = null;

export function setPendingSignup(email: string, password: string): void {
  pending = { email, password };
}

/** Return the stored password iff it matches this email; otherwise null. */
export function takePendingPassword(email: string): string | null {
  if (pending && pending.email === email) {
    const { password } = pending;
    pending = null;
    return password;
  }
  return null;
}

export function clearPendingSignup(): void {
  pending = null;
}
