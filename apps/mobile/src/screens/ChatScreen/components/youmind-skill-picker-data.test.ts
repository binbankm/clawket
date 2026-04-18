import type { YouMindInstalledSkills } from '../../../services/youmind';
import { buildYouMindSkillSections } from './youmind-skill-picker-data';

const labels = {
  pinned: 'Pinned skills',
  mySkills: 'My skills',
  installed: 'Installed skills',
};

function makeSkills(): YouMindInstalledSkills {
  return {
    all: [
      { id: '1', name: 'Brainstorm', description: 'Creative ideation', iconBgColor: null, iconValue: null, origin: null, creatorId: 'me' },
      { id: '2', name: 'Research', description: 'Find sources', iconBgColor: null, iconValue: null, origin: null, creatorId: 'other' },
      { id: '3', name: 'Summarize', description: 'Condense notes', iconBgColor: null, iconValue: null, origin: null, creatorId: 'other' },
    ],
    pinned: [
      { id: '2', name: 'Research', description: 'Find sources', iconBgColor: null, iconValue: null, origin: null, creatorId: 'other' },
    ],
    mySkills: [
      { id: '1', name: 'Brainstorm', description: 'Creative ideation', iconBgColor: null, iconValue: null, origin: null, creatorId: 'me' },
      { id: '2', name: 'Research', description: 'Find sources', iconBgColor: null, iconValue: null, origin: null, creatorId: 'other' },
    ],
    installed: [
      { id: '3', name: 'Summarize', description: 'Condense notes', iconBgColor: null, iconValue: null, origin: null, creatorId: 'other' },
    ],
  };
}

describe('youmind skill picker helpers', () => {
  it('deduplicates skills across grouped sections', () => {
    const sections = buildYouMindSkillSections(makeSkills(), '', labels, 'me');

    expect(sections.map((section) => section.key)).toEqual(['pinned', 'mySkills', 'installed']);
    expect(sections[0]?.data.map((skill) => skill.id)).toEqual(['2']);
    expect(sections[1]?.data.map((skill) => skill.id)).toEqual(['1']);
    expect(sections[2]?.data.map((skill) => skill.id)).toEqual(['3']);
  });

  it('shows only the matching created or installed group', () => {
    const sections = buildYouMindSkillSections(makeSkills(), 'condense', labels, 'me');

    expect(sections).toHaveLength(1);
    expect(sections[0]?.key).toBe('installed');
    expect(sections[0]?.data.map((skill) => skill.id)).toEqual(['3']);
  });

  it('derives my skills from all when current user id is available', () => {
    const sections = buildYouMindSkillSections({
      ...makeSkills(),
      mySkills: [],
    }, '', labels, 'me');

    expect(sections.map((section) => section.key)).toEqual(['pinned', 'mySkills', 'installed']);
    expect(sections[1]?.data.map((skill) => skill.id)).toEqual(['1']);
  });
});
