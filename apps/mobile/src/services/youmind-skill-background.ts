import type { YouMindSkillSummary } from './youmind';

const SKILL_BG_COUNT = 14;
const SKILL_BG_PREFIX = 'https://cdn.gooo.ai/assets/';

function getSkillBgColorById(id: string): string {
  const hex = id.replace(/-/g, '').slice(-8);
  const parsed = parseInt(hex, 16);
  const index = Number.isNaN(parsed) ? 1 : (parsed % SKILL_BG_COUNT) + 1;
  return `skill-bg${index.toString().padStart(2, '0')}`;
}

export function getYouMindSkillBackgroundUri(skill: Pick<YouMindSkillSummary, 'id' | 'iconBgColor'>): string {
  const bgColor = skill.iconBgColor?.trim() || getSkillBgColorById(skill.id);
  return `${SKILL_BG_PREFIX}${bgColor}.png`;
}
