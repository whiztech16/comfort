export interface FieldError {
  path: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors?: FieldError[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface SafeErrorInfo {
  name: string;
  kind: "database" | "network" | "other";
  code?: string; // Postgres SQLSTATE or a system code like ECONNREFUSED. Never a message.
  message?: string; // only for "other"
}

const SQLSTATE = /^[0-9A-Z]{5}$/;
const SYSTEM_CODE = /^E[A-Z0-9_]+$/;

// Walk the error and its causes (Drizzle wraps the underlying pg error).
function chain(err: unknown): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  let cur: unknown = err;
  for (let i = 0; i < 4 && cur && typeof cur === "object"; i++) {
    out.push(cur as Record<string, unknown>);
    cur = (cur as { cause?: unknown }).cause;
  }
  return out;
}

/**
 * Reduces any error to fields that are safe to log or act on.
 * Never returns a stack, query, parameters, table, column, constraint or host.
 */
export function safeErrorInfo(err: unknown): SafeErrorInfo {
  if (!(err instanceof Error)) return { name: "NonError", kind: "other" };

  const links = chain(err);

  const isDb = links.some(
    (e) => e.name === "DrizzleQueryError" || e.name === "DatabaseError" || "routine" in e,
  );
  if (isDb) {
    const code = links
      .map((e) => (typeof e.code === "string" ? e.code : undefined))
      .find((c) => c !== undefined && SQLSTATE.test(c));
    return { name: "DatabaseError", kind: "database", ...(code ? { code } : {}) };
  }

  const sys = links
    .map((e) => (typeof e.code === "string" ? e.code : undefined))
    .find((c) => c !== undefined && SYSTEM_CODE.test(c));
  if (sys) return { name: "SystemError", kind: "network", code: sys };

  return { name: err.name, kind: "other", message: err.message.slice(0, 200) };
}