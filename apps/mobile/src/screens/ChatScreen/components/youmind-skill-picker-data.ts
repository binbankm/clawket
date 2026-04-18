import type { YouMindInstalledSkills, YouMindSkillSummary } from '../../../services/youmind';

export type YouMindSkillSection = {
  key: 'pinned' | 'mySkills' | 'installed';
  title: string;
  data: YouMindSkillSummary[];
};

function normalize(value: string | undefined | null): string {
  return (value ?? '').trim().toLowerCase();
}

function matchSkill(skill: YouMindSkillSummary, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;
  return normalize(skill.name).includes(normalizedQuery)
    || normalize(skill.description).includes(normalizedQuery);
}

function sortSkills(skills: YouMindSkillSummary[]): YouMindSkillSummary[] {
  return [...skills].sort((left, right) => (
    normalize(left.name).localeCompare(normalize(right.name))
  ));
}

function filterSkills(
  skills: YouMindSkillSummary[],
  query: string,
  seenIds: Set<string>,
): YouMindSkillSummary[] {
  const filtered: YouMindSkillSummary[] = [];
  for (const skill of sortSkills(skills)) {
    if (seenIds.has(skill.id)) continue;
    if (!matchSkill(skill, query)) continue;
    seenIds.add(skill.id);
    filtered.push(skill);
  }
  return filtered;
}

export function buildYouMindSkillSections(
  skills: YouMindInstalledSkills | null,
  query: string,
  labels: {
    pinned: string;
    mySkills: string;
    installed: string;
  },
  currentUserId?: string | null,
): YouMindSkillSection[] {
  if (!skills) return [];

  const sections: YouMindSkillSection[] = [];

  const pinned = filterSkills(skills.pinned, query, new Set<string>());
  if (pinned.length > 0) {
    sections.push({ key: 'pinned', title: labels.pinned, data: pinned });
  }

  const pinnedIds = new Set(skills.pinned.map((skill) => skill.id));
  const nonPinnedAll = skills.all.filter((skill) => !pinnedIds.has(skill.id));
  const resolvedMySkills = currentUserId
    ? nonPinnedAll.filter((skill) => skill.creatorId === currentUserId)
    : skills.mySkills.filter((skill) => !pinnedIds.has(skill.id));
  const resolvedInstalledSkills = currentUserId
    ? nonPinnedAll.filter((skill) => skill.creatorId !== currentUserId)
    : skills.installed.filter((skill) => !pinnedIds.has(skill.id));

  const mySkills = filterSkills(
    resolvedMySkills,
    query,
    new Set<string>(),
  );
  if (mySkills.length > 0) {
    sections.push({ key: 'mySkills', title: labels.mySkills, data: mySkills });
  }

  const installed = filterSkills(
    resolvedInstalledSkills,
    query,
    new Set<string>(),
  );
  if (installed.length > 0) {
    sections.push({ key: 'installed', title: labels.installed, data: installed });
  }

  return sections;
}
