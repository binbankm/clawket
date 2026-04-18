export function parseYouMindSuccessPayload<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined as T;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return trimmed as T;
  }
}
