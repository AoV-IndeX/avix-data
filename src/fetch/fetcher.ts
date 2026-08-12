export async function fetchTsv(
  url: string,
  workbookName: string,
  identifier: string,
): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`[fetch] ${workbookName} (${identifier}) ✗ ${message}`);
  }
}
