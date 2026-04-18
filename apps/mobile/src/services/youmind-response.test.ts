import { parseYouMindSuccessPayload } from './youmind-response';

describe('parseYouMindSuccessPayload', () => {
  it('returns undefined for empty success bodies', () => {
    expect(parseYouMindSuccessPayload<void>('')).toBeUndefined();
    expect(parseYouMindSuccessPayload<void>('   ')).toBeUndefined();
  });

  it('parses standard JSON objects', () => {
    expect(parseYouMindSuccessPayload<{ ok: boolean }>('{\"ok\":true}')).toEqual({ ok: true });
  });

  it('parses JSON primitive bodies', () => {
    expect(parseYouMindSuccessPayload<number>('1')).toBe(1);
    expect(parseYouMindSuccessPayload<boolean>('true')).toBe(true);
  });

  it('falls back to trimmed text for non-json success bodies', () => {
    expect(parseYouMindSuccessPayload<string>('deleted')).toBe('deleted');
  });
});
