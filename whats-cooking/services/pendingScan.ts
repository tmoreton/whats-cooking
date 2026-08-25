/**
 * Tiny in-memory singleton used to hand captured photos' base64 payloads from
 * the camera screen to the results screen.
 *
 * Router params can't safely carry large base64 strings (they get serialized
 * into the URL/state), so we stash them here instead and read them once on the
 * results screen. This keeps navigation snappy and avoids URL-length limits.
 *
 * A scan can include several photos (e.g. the fridge plus the spice cabinet),
 * so this holds an array.
 */

let pendingImages: string[] = [];

export function setPendingScan(base64Images: string[]): void {
  pendingImages = base64Images;
}

export function consumePendingScan(): string[] {
  const value = pendingImages;
  pendingImages = [];
  return value;
}

export function peekPendingScan(): string[] {
  return pendingImages;
}

export function clearPendingScan(): void {
  pendingImages = [];
}
