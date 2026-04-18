import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useAppTheme } from '../../../theme';
import { Radius } from '../../../theme/tokens';
import { youmindBoardIconAssets } from './youmindBoardIconAssets';

type YouMindBoardIconValue = {
  name: string | null;
  color: string | null;
} | null | undefined;

type Props = {
  icon: YouMindBoardIconValue;
  size?: number;
  accentOnly?: boolean;
};

const boardPalette = {
  '--foreground': {
    light: '#111318',
    dark: '#ECEFF3',
  },
  '--function-gray': {
    light: '#8E8E93',
    dark: '#98989D',
  },
  '--function-link': {
    light: '#007AFF',
    dark: '#0A84FF',
  },
  '--function-mint': {
    light: '#5DD6CC',
    dark: '#71EDE3',
  },
  '--function-green': {
    light: '#28CD41',
    dark: '#6DD459',
  },
  '--function-indigo': {
    light: '#5859D1',
    dark: '#5E5FE0',
  },
  '--function-purple': {
    light: '#A25AD9',
    dark: '#B262ED',
  },
  '--function-pink': {
    light: '#E8319E',
    dark: '#E94862',
  },
  '--function-red': {
    light: '#EA4E43',
    dark: '#EA5243',
  },
  '--function-orange': {
    light: '#FF9500',
    dark: '#FF9F0A',
  },
  '--function-yellow': {
    light: '#FFCC00',
    dark: '#FFD60A',
  },
  '--function-brown': {
    light: '#7E4F14',
    dark: '#B59469',
  },
} as const;

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((part) => `${part}${part}`).join('')
    : normalized;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value) || full.length !== 6) return hex;
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function YouMindBoardIcon({
  icon,
  size = 18,
  accentOnly = false,
}: Props): React.JSX.Element {
  const { theme } = useAppTheme();

  const { color, backgroundColor, xml } = useMemo(() => {
    const paletteEntry = icon?.color ? boardPalette[icon.color as keyof typeof boardPalette] : null;
    const accentColor = paletteEntry
      ? paletteEntry[theme.scheme]
      : boardPalette['--foreground'][theme.scheme];
    const iconKey = (icon?.name?.trim() || 'Box').toLowerCase();
    return {
      color: accentColor,
      backgroundColor: withAlpha(accentColor, theme.scheme === 'dark' ? 0.2 : 0.12),
      xml: youmindBoardIconAssets[iconKey] ?? youmindBoardIconAssets.box,
    };
  }, [icon?.color, icon?.name, theme.scheme]);

  if (accentOnly) {
    return <SvgXml xml={xml} width={size} height={size} color={color} />;
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size + 16,
          height: size + 16,
          borderRadius: Math.max(Radius.md, (size + 16) / 2),
          backgroundColor,
        },
      ]}
    >
      <SvgXml xml={xml} width={size} height={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
