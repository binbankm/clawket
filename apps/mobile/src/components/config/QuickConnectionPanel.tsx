import React, { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Cloud, Link2 } from 'lucide-react-native';
import { useAppTheme } from '../../theme';
import { FontSize, FontWeight, Radius, Shadow, Space } from '../../theme/tokens';

type QuickConnectionTarget = 'local' | 'youmind';

type QuickConnectionCard = {
  key: QuickConnectionTarget;
  icon: React.ReactNode;
  iconBackgroundColor: string;
  title: string;
  description: string;
  badges: string[];
};

type Props = {
  onSelectTarget: (target: QuickConnectionTarget) => void;
  style?: StyleProp<ViewStyle>;
};

export function QuickConnectionPanel({ onSelectTarget, style }: Props): React.JSX.Element {
  const { t } = useTranslation('config');
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
  const cards = useMemo<QuickConnectionCard[]>(() => [
    {
      key: 'local',
      icon: <Link2 size={18} color="#2F6BFF" strokeWidth={2.1} />,
      iconBackgroundColor: '#E7F0FF',
      title: t('Local Agents'),
      description: t('Install the Clawket CLI on your computer, then pair with a QR code.'),
      badges: [t('OpenClaw'), t('Hermes')],
    },
    {
      key: 'youmind',
      icon: <Cloud size={18} color="#39834A" strokeWidth={2.1} />,
      iconBackgroundColor: '#EEF8E8',
      title: t('Cloud Agents'),
      description: t('Sign in directly on this device. No computer setup required.'),
      badges: [t('YouMind')],
    },
  ], [t]);

  return (
    <View style={style}>
      <Text style={styles.quickHint}>{t('Choose how you want to connect.')}</Text>

      {cards.map((card) => (
        <View key={card.key} style={styles.quickGroupCard}>
          <View style={styles.quickGroupHeader}>
            <View style={[styles.quickGroupIcon, { backgroundColor: card.iconBackgroundColor }]}>
              {card.icon}
            </View>
            <View style={styles.quickGroupHeaderText}>
              <Text style={styles.quickGroupTitle}>{card.title}</Text>
              <Text style={styles.quickGroupSubtitle}>{card.description}</Text>
            </View>
          </View>

          <View style={styles.quickBadgeRow}>
            {card.badges.map((badge) => (
              <View key={badge} style={styles.quickBadge}>
                <Text style={styles.quickBadgeText}>{badge}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => onSelectTarget(card.key)}
            style={({ pressed }) => [styles.primaryButton, styles.quickAction, pressed && styles.primaryButtonPressed]}
          >
            <View style={styles.buttonContent}>
              {card.key === 'local'
                ? <Link2 size={15} color={theme.colors.primaryText} strokeWidth={2} />
                : <Cloud size={15} color={theme.colors.primaryText} strokeWidth={2} />
              }
              <Text style={styles.primaryButtonText}>{t('Start Connection')}</Text>
            </View>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['theme']['colors']) {
  return StyleSheet.create({
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Space.sm,
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: Radius.md,
      paddingVertical: 11,
      ...Shadow.md,
    },
    primaryButtonPressed: {
      opacity: 0.88,
    },
    primaryButtonText: {
      color: colors.primaryText,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semibold,
    },
    quickHint: {
      fontSize: FontSize.md,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: Space.lg,
      textAlign: 'center',
    },
    quickGroupCard: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Space.lg,
      marginBottom: Space.md,
    },
    quickGroupHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Space.sm,
    },
    quickGroupHeaderText: {
      flex: 1,
      gap: Space.xs,
    },
    quickGroupIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickGroupTitle: {
      color: colors.text,
      fontSize: FontSize.base,
      fontWeight: FontWeight.semibold,
    },
    quickGroupSubtitle: {
      color: colors.textMuted,
      fontSize: FontSize.sm,
      lineHeight: 18,
    },
    quickBadgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Space.xs,
      marginTop: Space.md,
      marginBottom: Space.sm,
    },
    quickBadge: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: Radius.full,
      paddingHorizontal: Space.sm,
      paddingVertical: 6,
    },
    quickBadgeText: {
      color: colors.text,
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
    },
    quickAction: {
      marginTop: 0,
      marginBottom: Space.sm,
    },
  });
}
