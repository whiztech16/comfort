const TS = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,6})?[+-]\d{2}(:\d{2})?$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Cursor = { ts: string; id: string };

export const encodeCursor = (c: Cursor): string =>
  Buffer.from(JSON.stringify([c.ts, c.id])).toString("base64url");

export function decodeCursor(raw: string): Cursor | null {
  try {
    const [ts, id] = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as unknown[];
    if (typeof ts === "string" && typeof id === "string" && TS.test(ts) && UUID.test(id)) {
      return { ts, id };
    }
    return null;
  } catch {
    return null;
  }
}