export type AgentUserProfile = {
  name: string;
  whatToCallThem: string;
  pronouns: string;
  timezone: string;
  notes: string;
  context: string;
};

export const EMPTY_AGENT_USER_PROFILE: AgentUserProfile = {
  name: '',
  whatToCallThem: '',
  pronouns: '',
  timezone: '',
  notes: '',
  context: '',
};

const USER_CONTEXT_HEADING_RE = /^##\s+Context\s*$/i;
const USER_RULE_RE = /^-\s+\*\*([^*]+?)\*\*\s*(.*)$/;
const OPTIONAL_PLACEHOLDER_RE = /^_?\(optional\)_?$/i;
const CONTEXT_PLACEHOLDER_RE =
  /^_?\(What do they care about\? What projects are they working on\? What annoys them\? What makes them laugh\? Build this over time\.\)_?$/i;

function normalizeFieldValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (OPTIONAL_PLACEHOLDER_RE.test(trimmed)) return '';
  return trimmed;
}

function cleanContextValue(lines: string[]): string {
  const joined = lines.join('\n').trim();
  if (!joined) return '';
  if (CONTEXT_PLACEHOLDER_RE.test(joined)) return '';
  return joined;
}

export function parseAgentUserProfile(content: string): AgentUserProfile {
  const profile: AgentUserProfile = { ...EMPTY_AGENT_USER_PROFILE };
  const lines = content.split(/\r?\n/);
  let inContext = false;
  const contextLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (USER_CONTEXT_HEADING_RE.test(line.trim())) {
      inContext = true;
      continue;
    }

    if (inContext) {
      if (/^---\s*$/.test(line.trim())) {
        break;
      }
      contextLines.push(line);
      continue;
    }

    const match = line.match(USER_RULE_RE);
    if (!match) continue;

    const label = match[1]?.trim().toLowerCase();
    const value = normalizeFieldValue(match[2] ?? '');

    if (label === 'name:') profile.name = value;
    if (label === 'what to call them:') profile.whatToCallThem = value;
    if (label === 'pronouns:') profile.pronouns = value;
    if (label === 'timezone:') profile.timezone = value;
    if (label === 'notes:') profile.notes = value;
  }

  profile.context = cleanContextValue(contextLines);
  return profile;
}

export function generateAgentUserMarkdown(profile: AgentUserProfile): string {
  return [
    '# USER.md - About Your Human',
    '',
    "_Learn about the person you're helping. Update this as you go._",
    '',
    `- **Name:** ${profile.name.trim()}`,
    `- **What to call them:** ${profile.whatToCallThem.trim()}`,
    `- **Pronouns:** ${profile.pronouns.trim()}`,
    `- **Timezone:** ${profile.timezone.trim()}`,
    `- **Notes:** ${profile.notes.trim()}`,
    '',
    '## Context',
    '',
    profile.context.trim(),
    '',
    '---',
    '',
    "The more you know, the better you can help. But remember - you're learning about a person, not building a dossier. Respect the difference.",
    '',
  ].join('\n');
}

function replaceOrInsertField(params: {
  lines: string[];
  labels: string[];
  value: string;
  insertBeforeIndex: number;
  preferredLabel?: string;
}): string[] {
  const { lines, labels, value, insertBeforeIndex, preferredLabel } = params;
  const escapedLabels = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const matcher = new RegExp(
    `^\\s*-\\s+\\*\\*(?:${escapedLabels.join('|')})\\*\\*\\s*(.*)$`,
    'i',
  );
  const nextLine = `- **${preferredLabel ?? labels[0]}** ${value.trim()}`;
  const existingIndex = lines.findIndex((line) => matcher.test(line));
  if (existingIndex >= 0) {
    const nextLines = [...lines];
    const match = nextLines[existingIndex]?.match(matcher);
    const existingLabel = match?.[0]?.match(/\*\*([^*]+)\*\*/)?.[1];
    const labelToUse = existingLabel ?? preferredLabel ?? labels[0];
    nextLines[existingIndex] = `- **${labelToUse}** ${value.trim()}`;
    return nextLines;
  }

  const nextLines = [...lines];
  nextLines.splice(insertBeforeIndex, 0, nextLine);
  return nextLines;
}

export function mergeAgentUserMarkdown(
  existingContent: string,
  profile: AgentUserProfile,
): string {
  if (!existingContent.trim()) {
    return generateAgentUserMarkdown(profile);
  }

  let lines = existingContent.split(/\r?\n/);
  const separatorIndex = lines.findIndex((line) => /^---\s*$/.test(line.trim()));
  const contextIndex = lines.findIndex((line) => USER_CONTEXT_HEADING_RE.test(line.trim()));
  const insertBeforeIndex = separatorIndex >= 0 ? separatorIndex : lines.length;

  lines = replaceOrInsertField({
    lines,
    labels: ['Name:'],
    value: profile.name,
    insertBeforeIndex,
  });
  lines = replaceOrInsertField({
    lines,
    labels: ['What to call them:', 'Preferred address:'],
    value: profile.whatToCallThem,
    insertBeforeIndex,
  });
  lines = replaceOrInsertField({
    lines,
    labels: ['Pronouns:'],
    value: profile.pronouns,
    insertBeforeIndex,
  });
  lines = replaceOrInsertField({
    lines,
    labels: ['Timezone:'],
    value: profile.timezone,
    insertBeforeIndex,
  });
  lines = replaceOrInsertField({
    lines,
    labels: ['Notes:'],
    value: profile.notes,
    insertBeforeIndex,
  });

  const contextLines = profile.context.trim()
    ? profile.context.trim().split(/\r?\n/)
    : [];
  const nextSeparatorIndex = lines.findIndex((line) => /^---\s*$/.test(line.trim()));
  const nextInsertBeforeIndex = nextSeparatorIndex >= 0 ? nextSeparatorIndex : lines.length;
  const nextContextIndex = lines.findIndex((line) => USER_CONTEXT_HEADING_RE.test(line.trim()));

  if (nextContextIndex >= 0) {
    const contextEndIndex = nextSeparatorIndex >= 0 && nextSeparatorIndex > nextContextIndex
      ? nextSeparatorIndex
      : lines.length;
    const replacement = [
      '## Context',
      '',
      ...contextLines,
    ];
    lines.splice(nextContextIndex, contextEndIndex - nextContextIndex, ...replacement);
  } else {
    const contextBlock = [
      '',
      '## Context',
      '',
      ...contextLines,
    ];
    lines.splice(nextInsertBeforeIndex, 0, ...contextBlock);
  }

  return lines.join('\n');
}
