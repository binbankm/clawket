import { describe, expect, it } from '@jest/globals';
import {
  EMPTY_AGENT_USER_PROFILE,
  generateAgentUserMarkdown,
  mergeAgentUserMarkdown,
  parseAgentUserProfile,
} from './agent-user-profile';

describe('agent-user-profile', () => {
  it('parses USER.md into editable fields', () => {
    const profile = parseAgentUserProfile(`# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:** Lucy
- **What to call them:** Chuyi
- **Pronouns:** 女她
- **Timezone:** Asia/Shanghai
- **Notes:** Likes concise updates

## Context

Building Clawket.
Working on OpenClaw integrations.

---

Footer`);

    expect(profile).toEqual({
      name: 'Lucy',
      whatToCallThem: 'Chuyi',
      pronouns: '女她',
      timezone: 'Asia/Shanghai',
      notes: 'Likes concise updates',
      context: 'Building Clawket.\nWorking on OpenClaw integrations.',
    });
  });

  it('drops default placeholders', () => {
    const profile = parseAgentUserProfile(`# USER.md - About Your Human

- **Name:**
- **What to call them:**
- **Pronouns:** _(optional)_
- **Timezone:**
- **Notes:**

## Context

_(What do they care about? What projects are they working on? What annoys them? What makes them laugh? Build this over time.)_
`);

    expect(profile).toEqual(EMPTY_AGENT_USER_PROFILE);
  });

  it('generates normalized markdown', () => {
    const output = generateAgentUserMarkdown({
      name: 'Lucy',
      whatToCallThem: 'Lucy',
      pronouns: 'she/her',
      timezone: 'Asia/Shanghai',
      notes: 'Prefers direct feedback',
      context: 'Working on Clawket.',
    });

    expect(output).toContain('- **What to call them:** Lucy');
    expect(output).toContain('## Context');
    expect(output).toContain('Working on Clawket.');
  });

  it('merges edits into an existing OpenClaw-style USER.md without dropping extra sections', () => {
    const output = mergeAgentUserMarkdown(`# USER.md - User Profile

- **Name:** The Clawdributors
- **Preferred address:** They/Them (collective)
- **Pronouns:** they/them
- **Timezone:** Distributed globally (workspace default: Europe/Vienna)
- **Notes:**
  - We are many.

## Extra

Keep this section.
`, {
      name: 'Lucy',
      whatToCallThem: 'Chuyi',
      pronouns: 'she/her',
      timezone: 'Asia/Shanghai',
      notes: 'Prefers concise updates',
      context: 'Building Clawket.',
    });

    expect(output).toContain('- **Preferred address:** Chuyi');
    expect(output).toContain('- **Notes:** Prefers concise updates');
    expect(output).toContain('## Extra');
    expect(output).toContain('Keep this section.');
    expect(output).toContain('## Context');
    expect(output).toContain('Building Clawket.');
  });
});
