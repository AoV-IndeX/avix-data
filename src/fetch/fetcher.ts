const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
  );
}
function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof TypeError)) {
    return false;
  }
  const cause = error.cause;
  if (!(cause instanceof Error)) {
    return false;
  }
  return (
    cause.name === "ConnectTimeoutError" ||
    (hasErrorCode(cause) &&
      ["UND_ERR_CONNECT_TIMEOUT", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT"].includes(cause.code))
  );
}
export async function fetchTsv(
  url: string,
  workbookName: string,
  identifier: string,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt === MAX_ATTEMPTS || !isRetryableFetchError(error)) {
        break;
      }
      console.warn(
        `[fetch] ${workbookName} (${identifier}) ✗ attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`[fetch] ${workbookName} (${identifier}) ✗ ${message}`, { cause: lastError });
}
