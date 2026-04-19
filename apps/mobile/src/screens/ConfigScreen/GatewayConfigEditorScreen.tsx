import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RefreshCw, Save } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { EmptyState, HeaderActionButton, HeaderTextAction, LoadingState } from '../../components/ui';
import { useAppContext } from '../../contexts/AppContext';
import { useNativeStackModalHeader } from '../../hooks/useNativeStackModalHeader';
import { useGatewayPatch } from '../../hooks/useGatewayPatch';
import { analyticsEvents } from '../../services/analytics/events';
import { useAppTheme } from '../../theme';
import { FontSize, FontWeight, Radius, Space } from '../../theme/tokens';
import type { ConfigStackParamList } from './ConfigTab';

type Navigation = NativeStackNavigationProp<ConfigStackParamList, 'GatewayConfigEditor'>;

export function GatewayConfigEditorScreen(): React.JSX.Element {
  const navigation = useNavigation<Navigation>();
  const { t } = useTranslation(['config', 'common']);
  const { theme } = useAppTheme();
  const { gateway, config: activeGatewayConfig, gatewayEpoch } = useAppContext();
  const { setWithRestart } = useGatewayPatch(gateway);
  const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configText, setConfigText] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [configHash, setConfigHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDirty = configText !== null && editedText !== configText;

  // Keep latest editedText in a ref so save handler always sees fresh value.
  const editedTextRef = useRef(editedText);
  useEffect(() => { editedTextRef.current = editedText; }, [editedText]);

  const loadConfig = useCallback(async () => {
    if (!activeGatewayConfig?.url) {
      setConfigText(null);
      setError(t('Please add and activate a gateway connection first.'));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await gateway.getConfig();
      if (!result.config) {
        setConfigText(null);
        setError(t('No config returned from Gateway.'));
      } else {
        const text = JSON.stringify(result.config, null, 2);
        setConfigText(text);
        setEditedText(text);
        setConfigHash(result.hash);
        setError(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('Unable to load config');
      setConfigText(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [activeGatewayConfig?.url, gateway, t]);

  useEffect(() => {
    analyticsEvents.gatewayConfigViewOpened({ source: 'config_editor_screen' });
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [gatewayEpoch, loadConfig]);

  const handleRefresh = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        t('Discard changes?'),
        t('Reloading will discard your unsaved edits. Continue?'),
        [
          { text: t('common:Cancel'), style: 'cancel' },
          {
            text: t('Reload'),
            style: 'destructive',
            onPress: () => { void loadConfig(); },
          },
        ],
      );
    } else {
      void loadConfig();
    }
  }, [isDirty, loadConfig, t]);

  const handleSave = useCallback(async () => {
    if (saving) return;
    const currentText = editedTextRef.current;

    // Validate JSON before sending.
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(currentText) as Record<string, unknown>;
    } catch {
      Alert.alert(t('Invalid JSON'), t('The config is not valid JSON. Please fix the syntax errors before saving.'));
      return;
    }

    if (!configHash) {
      Alert.alert(t('Settings Unavailable'), t('Gateway config hash is missing. Please refresh and try again.'));
      return;
    }

    setSaving(true);
    try {
      const ok = await setWithRestart({
        config: parsed,
        configHash,
        confirmation: {
          title: t('Save Config'),
          message: t('This will replace the current OpenClaw config and restart Gateway. Continue?'),
          confirmText: t('Save'),
          cancelText: t('common:Cancel'),
        },
        savingMessage: t('Saving config...'),
        onSuccess: async () => {
          // Reload fresh config + hash after restart.
          await loadConfig();
        },
      });
      if (ok) {
        analyticsEvents.gatewayConfigViewOpened({ source: 'config_editor_saved' });
      }
    } finally {
      setSaving(false);
    }
  }, [saving, configHash, setWithRestart, loadConfig, t]);

  useNativeStackModalHeader({
    navigation,
    title: t('Edit Config'),
    onClose: () => {
      if (isDirty) {
        Alert.alert(
          t('Discard changes?'),
          t('You have unsaved edits. Discard them and close?'),
          [
            { text: t('common:Cancel'), style: 'cancel' },
            {
              text: t('Discard'),
              style: 'destructive',
              onPress: () => navigation.goBack(),
            },
          ],
        );
        return;
      }
      navigation.goBack();
    },
    rightContent: (
      <View style={styles.headerActions}>
        <HeaderActionButton
          icon={RefreshCw}
          onPress={handleRefresh}
          size={20}
        />
        {configText !== null ? (
          <HeaderTextAction
            label={saving ? t('Saving...') : t('Save')}
            onPress={() => { void handleSave(); }}
            disabled={saving || !isDirty}
          />
        ) : null}
      </View>
    ),
  });

  if (loading) {
    return <LoadingState message={t('Loading config...')} />;
  }

  if (!configText) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          icon="{}"
          title={t('Edit Config')}
          subtitle={error ?? t('No config returned from Gateway.')}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topBar}>
        <Text style={styles.topBarHint}>
          {isDirty ? t('Unsaved changes') : t('No changes')}
        </Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.editorCard}>
          <TextInput
            style={[styles.editor, { color: theme.colors.text }]}
            value={editedText}
            onChangeText={setEditedText}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            placeholderTextColor={theme.colors.textSubtle}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            {t('Edit Config notice', {
              defaultValue: 'Saving this config will overwrite the current OpenClaw config file and restart Gateway. Make a backup first if you are unsure.',
            })}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['theme']['colors']) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    emptyWrap: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Space.xs,
    },
    topBar: {
      paddingHorizontal: Space.lg,
      paddingVertical: Space.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    topBarHint: {
      fontSize: FontSize.sm,
      color: colors.textMuted,
      fontWeight: FontWeight.medium,
    },
    scrollContent: {
      padding: Space.lg,
      gap: Space.md,
    },
    editorCard: {
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: Space.md,
      paddingVertical: Space.md,
    },
    editor: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: FontSize.sm,
      lineHeight: 18,
      textAlignVertical: 'top',
    },
    noticeCard: {
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: Space.md,
      paddingVertical: Space.md,
    },
    noticeText: {
      fontSize: FontSize.sm,
      color: colors.textMuted,
      lineHeight: 18,
    },
  });
}
