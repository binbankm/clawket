import React from 'react';
import { Sparkles } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';
import type { YouMindSkillSummary } from '../../../services/youmind';
import { YOUMIND_SKILL_ICON_XML } from './generatedYouMindSkillIconXml';

type Props = {
  skill: YouMindSkillSummary;
  color: string;
  size?: number;
};

type IconComponent = (props: { color: string; size: number }) => React.JSX.Element;

const LIGHT_BULB_PATH =
  'M597.333333 896a42.666667 42.666667 0 1 1 0 85.333333h-170.666666a42.666667 42.666667 0 1 1 0-85.333333h170.666666z m42.666667-170.666667a42.666667 42.666667 0 1 1 0 85.333334H384a42.666667 42.666667 0 1 1 0-85.333334h256zM213.333333 341.333333a298.666667 298.666667 0 0 1 398.208-281.6 42.666667 42.666667 0 0 1-28.416 80.469334A213.333333 213.333333 0 0 0 298.666667 341.333333c0 34.304 5.930667 73.6 51.498666 119.168 32.256 32.256 64.725333 73.685333 75.648 128.426667a42.666667 42.666667 0 0 1-83.626666 16.768c-6.144-30.549333-24.874667-57.386667-52.352-84.864C224.469333 455.466667 213.333333 392.362667 213.333333 341.333333z m460.501334 119.168a42.666667 42.666667 0 1 1 60.330666 60.330667c-31.317333 31.317333-46.165333 53.930667-52.352 84.906667a42.666667 42.666667 0 0 1-83.626666-16.768c10.88-54.4 38.698667-91.52 75.648-128.469334zM706.133333 225.92a64 64 0 0 0 31.786667-31.786667L768 128l30.08 66.133333c6.4 14.08 17.664 25.386667 31.786667 31.786667L896 256l-66.133333 30.08a64 64 0 0 0-31.786667 31.786667L768 384l-30.08-66.133333a64 64 0 0 0-31.786667-31.786667L640 256l66.133333-30.08z';

function renderXmlIcon(xml: string, color: string, size: number): React.JSX.Element {
  return (
    <SvgXml
      xml={xml.replace(/currentColor/g, color)}
      width={size}
      height={size}
    />
  );
}

function LightBulbIcon({ color, size }: { color: string; size: number }): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" fill="none">
      <Path d={LIGHT_BULB_PATH} fill={color} />
    </Svg>
  );
}

function YouMindLogoIcon({ color, size }: { color: string; size: number }): React.JSX.Element {
  const aspectRatio = 28 / 16;
  const width = size * aspectRatio * 0.6;
  return (
    <Svg width={width} height={size * 0.6} viewBox="0 0 28 16" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.34709 3.25333C4.34709 1.45656 2.89053 0 1.09376 0H0V11.0667C0 13.7913 2.25036 16 5.02633 16C7.80229 16 10.0527 13.7913 10.0527 11.0667L10.0527 9.62667V5.38667C10.0527 3.88446 11.2934 2.66667 12.8239 2.66667C14.3545 2.66667 15.5952 3.88446 15.5952 5.38667V13.8667C15.5952 15.0449 16.5503 16 17.7285 16H20.1596V5.62667C20.1596 2.51915 17.593 7.18061e-06 14.4269 7.18061e-06C11.2608 7.18061e-06 8.69419 2.51915 8.69419 5.62667L8.69419 6.41333V11.2C8.69419 12.3782 7.72105 13.3333 6.52064 13.3333C5.32023 13.3333 4.34709 12.3782 4.34709 11.2V3.25333ZM20.8551 2.7933C22.1852 3.81854 23.0667 5.41134 23.0667 7.2V13.8667C23.0667 15.0449 24.0219 16 25.2001 16H27.1693V7.73334C27.1693 7.55321 27.1597 7.37528 27.1411 7.2C26.8695 4.65245 24.6746 2.66667 22.0071 2.66667C21.6348 2.66667 21.2718 2.70535 20.9218 2.77884C20.8995 2.78352 20.8773 2.78834 20.8551 2.7933Z"
        fill={color}
      />
    </Svg>
  );
}

function HorseIcon({ color, size }: { color: string; size: number }): React.JSX.Element {
  return renderXmlIcon(
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.7605 12.7643C18.8491 10.9099 18.305 9.40363 18.1834 9.12395C18.1507 8.77435 18.0321 7.90567 17.6453 7.52415C17.3648 7.24675 16.3214 6.35451 15.8 5.92435V3.43155C15.8 3.15795 15.518 2.96795 15.2688 3.08043C14.6752 3.34871 13.6758 3.94303 12.76 5.16435L12 3.64435C7.44001 4.40435 2.88001 8.96435 2.12001 13.5243C2.12001 13.5243 2.88001 17.3243 11.24 21.1243C11.24 21.1243 12 20.2313 12 18.532C12 17.2977 10.9808 15.3651 12.76 14.2843C13.9046 15.856 15.6746 15.8043 16.56 15.8043C16.56 15.8043 17.5769 17.3243 19.3864 17.3243C20.7864 17.3243 21.4605 16.8858 21.4605 16.8858C21.4605 16.8858 21.8648 14.9645 21.88 14.7859C21.88 14.0191 21.804 13.3062 20.7605 12.7643ZM16.7424 11.2139C16.3062 11.2139 15.952 10.8605 15.952 10.4235C15.952 9.98655 16.3062 9.63315 16.7424 9.63315C17.1786 9.63315 17.5328 9.98655 17.5328 10.4235C17.5328 10.8605 17.1786 11.2139 16.7424 11.2139Z" fill="currentColor"/></svg>',
    color,
    size,
  );
}

const iconComponents: Partial<Record<string, IconComponent>> = {
  LightBulb: LightBulbIcon,
  Horse: HorseIcon,
};

export const YOUMIND_SKILL_ICON_NAMES = [
  'LightBulb',
  'Horse',
  'Bear',
  'Butterfly',
  'Camel',
  'CatButt',
  'ChristmasPenguin',
  'Crab',
  'Crow',
  'Deer',
  'DinosaurEgg',
  'DogPark',
  'Dolphin',
  'Elephant',
  'Firefly',
  'Fish',
  'Flamingo',
  'Frog',
  'Hedgehug',
  'Jellyfish',
  'MagicSlug',
  'Octopus',
  'Owl',
  'Panda',
  'Parrot',
  'Rabbit',
  'SeaShell',
  'Seahorse',
  'Sloth',
  'Squirrel',
  'Swan',
  'Tapir',
] as const;

function getFallbackIconNameById(id: string): string {
  const hex = id.replace(/-/g, '').slice(-8);
  const parsed = Number.parseInt(hex, 16);
  const index = Number.isNaN(parsed) ? 0 : parsed % YOUMIND_SKILL_ICON_NAMES.length;
  return YOUMIND_SKILL_ICON_NAMES[index]!;
}

function renderMappedFallback(iconName: string, color: string, size: number): React.JSX.Element {
  const xml = YOUMIND_SKILL_ICON_XML[iconName as keyof typeof YOUMIND_SKILL_ICON_XML];
  if (xml) {
    return renderXmlIcon(xml, color, size);
  }

  const component = iconComponents[iconName];
  if (component) {
    return component({ color, size });
  }

  return <Sparkles color={color} size={size} strokeWidth={2.2} />;
}

export function YouMindSkillIcon({
  skill,
  color,
  size = 22,
}: Props): React.JSX.Element {
  if (skill.origin === 'system') {
    return <YouMindLogoIcon color={color} size={size} />;
  }

  const iconName = skill.iconValue?.trim() || getFallbackIconNameById(skill.id);
  const xml = YOUMIND_SKILL_ICON_XML[iconName as keyof typeof YOUMIND_SKILL_ICON_XML];
  if (xml) {
    return renderXmlIcon(xml, color, size);
  }

  const component = iconComponents[iconName];
  if (component) {
    return component({ color, size });
  }

  return renderMappedFallback(iconName, color, size);
}
