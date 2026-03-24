import { describe, expect, it } from '@jest/globals';
import {
  EMPTY_AGENT_IDENTITY_PROFILE,
  generateAgentIdentityMarkdown,
  parseAgentIdentityProfile,
} from './agent-identity-profile';

describe('agent-identity-profile', () => {
  it('parses IDENTITY.md fields', () => {
    const profile = parseAgentIdentityProfile(`# IDENTITY.md - Who Am I?

- **Name:** Lucy
- **Creature:** fox
- **Vibe:** sharp
- **Emoji:** 🦊
- **Avatar:** avatars/lucy.png
`);

    expect(profile).toEqual({
      name: 'Lucy',
      creature: 'fox',
      vibe: 'sharp',
      emoji: '🦊',
      avatar: 'avatars/lucy.png',
      theme: '',
    });
  });

  it('ignores placeholder values', () => {
    const profile = parseAgentIdentityProfile(`# IDENTITY.md - Who Am I?

- **Name:**
  _(pick something you like)_
- **Creature:**
  _(AI? robot? familiar? ghost in the machine? something weirder?)_
- **Vibe:**
  _(how do you come across? sharp? warm? chaotic? calm?)_
- **Emoji:**
  _(your signature — pick one that feels right)_
- **Avatar:**
  _(workspace-relative path, http(s) URL, or data URI)_
`);

    expect(profile).toEqual(EMPTY_AGENT_IDENTITY_PROFILE);
  });

  it('generates markdown while preserving custom values', () => {
    const output = generateAgentIdentityMarkdown({
      name: 'Lucy',
      creature: 'fox',
      vibe: 'sharp',
      emoji: '🦊',
      avatar: 'avatars/lucy.png',
      theme: '',
    });

    expect(output).toContain('- **Name:** Lucy');
    expect(output).toContain('- **Emoji:** 🦊');
    expect(output).toContain('- **Avatar:** avatars/lucy.png');
  });
});
