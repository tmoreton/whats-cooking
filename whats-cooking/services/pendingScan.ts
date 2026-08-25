/**
 * Tiny in-memory singleton used to hand a captured photo's base64 payload from
 * the camera screen to the results screen.
 *
 * Router params can't safely carry a large base64 string (they get serialized
 * into the URL/state), so we stash it here instead and read it once on the
 * results screen. This keeps navigation snappy and avoids URL-length limits.
 */

let pendingBase64: string | null = null;

export function setPendingScan(base64Image: string): void {
  pendingBase64 = base64Image;
}

export function consumePendingScan(): string | null {
  const value = pendingBase64;
  pendingBase64 = null;
  return value;
}

export function peekPendingScan(): string | null {
  return pendingBase64;
}

export function clearPendingScan(): void {
  pendingBase64 = null;
}
