import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import WebView, { type WebViewNavigation } from 'react-native-webview';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { EmptyState, IconButton } from '../../components/ui';
import { useAppContext } from '../../contexts/AppContext';
import {
  YouMindClient,
  buildYouMindWebCookieHeader,
  buildYouMindWebCookieScript,
} from '../../services/youmind';
import { useAppTheme } from '../../theme';
import { FontSize, FontWeight, Space } from '../../theme/tokens';
import type { ConsoleStackParamList } from './ConsoleTab';

type WebViewNavigationProp = NativeStackNavigationProp<ConsoleStackParamList, 'YouMindBoardItemWebView'>;
type WebViewRoute = RouteProp<ConsoleStackParamList, 'YouMindBoardItemWebView'>;

export function YouMindBoardItemWebViewScreen(): React.JSX.Element {
  const navigation = useNavigation<WebViewNavigationProp>();
  const route = useRoute<WebViewRoute>();
  const { theme } = useAppTheme();
  const { t } = useTranslation('console');
  const { config, activeGatewayConfigId } = useAppContext();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme.colors), [theme]);
  const webViewRef = useRef<WebView>(null);
  const baseUrl = config?.url || 'https://youmind.com';
  const client = useMemo(() => new YouMindClient(baseUrl, { authScopeKey: activeGatewayConfigId }), [activeGatewayConfigId, baseUrl]);
  const [canGoBack, setCanGoBack] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const session = await client.getValidSession();
        if (!active) return;
        if (!session?.accessToken) {
          setError(t('YouMind sign-in required'));
          return;
        }
        setAccessToken(session.accessToken);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : t('Unable to open this YouMind page.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [client, t]);

  const initialUrl = `${baseUrl}${route.params.path}`;
  const authHeader = useMemo(
    () => (accessToken ? buildYouMindWebCookieHeader(accessToken) : null),
    [accessToken],
  );
  const bootstrapHtml = useMemo(() => {
    if (!accessToken) return null;
    const escapedUrl = JSON.stringify(initialUrl);
    const escapedBaseUrl = JSON.stringify(baseUrl);
    const escapedToken = JSON.stringify(accessToken);
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>YouMind</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111111;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div>Loading...</div>
    <script>
      (function () {
        var baseUrl = ${escapedBaseUrl};
        var targetUrl = ${escapedUrl};
        var token = ${escapedToken};
        try {
          var hostname = new URL(baseUrl).hostname;
          document.cookie = 'YOUMIND_MOBILE_AUTH=' + encodeURIComponent(token) + '; path=/; domain=' + hostname + '; SameSite=Lax';
          document.cookie = 'YOUMIND_MOBILE_AUTH=' + encodeURIComponent(token) + '; path=/; SameSite=Lax';
        } catch (error) {
          document.cookie = 'YOUMIND_MOBILE_AUTH=' + encodeURIComponent(token) + '; path=/; SameSite=Lax';
        }
        window.location.replace(targetUrl);
      })();
    </script>
  </body>
</html>`;
  }, [accessToken, baseUrl, initialUrl]);

  const handleNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  }, []);

  const handleBackPress = useCallback(() => {
    if (canGoBack) {
      webViewRef.current?.goBack();
      return;
    }
    navigation.goBack();
  }, [canGoBack, navigation]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleLayer} pointerEvents="none">
            <Text style={styles.title} numberOfLines={1}>
              {route.params.title || t('Detail')}
            </Text>
          </View>
          <View style={styles.leftSlot}>
            {canGoBack ? (
              <IconButton
                icon={<X size={18} color={theme.colors.textMuted} strokeWidth={2} />}
                onPress={() => navigation.goBack()}
              />
            ) : null}
            <IconButton
              icon={<ChevronLeft size={22} color={theme.colors.textMuted} strokeWidth={2} />}
              onPress={handleBackPress}
            />
          </View>
          <View style={styles.spacer} />
          <View style={styles.rightSlot} />
        </View>
      </View>
      {loading ? (
        <View style={styles.stateWrap}>
          <EmptyState
            icon="🌀"
            title={t('Loading...')}
            subtitle={t('Opening the YouMind detail page...')}
          />
        </View>
      ) : error || !authHeader || !bootstrapHtml ? (
        <View style={styles.stateWrap}>
          <EmptyState
            icon="⚠️"
            title={t('Unable to open this YouMind page.')}
            subtitle={error || t('YouMind sign-in required')}
          />
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{
            html: bootstrapHtml,
            baseUrl,
          }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
        />
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['theme']['colors']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      paddingHorizontal: Space.xs,
      paddingBottom: 2,
      borderBottomWidth: 1,
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },
    titleLayer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 48,
    },
    leftSlot: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    spacer: {
      flex: 1,
    },
    title: {
      textAlign: 'center',
      fontSize: FontSize.lg,
      fontWeight: FontWeight.semibold,
      color: colors.text,
    },
    rightSlot: {
      minWidth: 44,
    },
    stateWrap: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: Space.lg,
    },
    webview: {
      flex: 1,
    },
  });
}
