export function isDatabaseUnavailable(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (typeof error === "object") {
    const record = error as { code?: unknown; errors?: unknown; cause?: unknown };
    if (
      record.code === "ECONNREFUSED" ||
      record.code === "ECONNRESET" ||
      record.code === "ENOTFOUND" ||
      record.code === "ETIMEDOUT"
    ) {
      return true;
    }
    if (Array.isArray(record.errors) && record.errors.some(isDatabaseUnavailable)) {
      return true;
    }
    if (record.cause) {
      return isDatabaseUnavailable(record.cause);
    }
  }

  return error instanceof Error && /ECONNREFUSED|connect ECONNREFUSED/i.test(error.message);
}
