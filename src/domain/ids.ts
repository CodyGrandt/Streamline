export function newId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}_${uuid ?? Math.random().toString(36).slice(2)}`;
}
