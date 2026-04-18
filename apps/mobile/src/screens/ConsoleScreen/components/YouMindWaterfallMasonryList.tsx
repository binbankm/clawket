import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlashList, type ListRenderItemInfo, type ViewToken } from '@shopify/flash-list';
import { StyleSheet, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import type { YouMindBoardEntry } from '../../../services/youmind';
import { Space } from '../../../theme/tokens';
import { estimateYouMindWaterfallCardHeight, YouMindWaterfallCard } from './YouMindWaterfallCard';

type Props = {
  entries: YouMindBoardEntry[];
  collapsedGroupKeys: Set<string>;
  entryCollapseKey: (entry: YouMindBoardEntry) => string;
  onPressEntry: (entry: YouMindBoardEntry) => void;
  renderHeader?: React.ReactElement | null;
  emptyState?: React.ReactElement | null;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps> | null;
  listKey: string;
};

const INITIAL_MEDIA_BATCH = 8;
const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 5,
  minimumViewTime: 32,
} as const;

function getEntryKey(entry: YouMindBoardEntry): string {
  return `${entry.kind}:${entry.id}`;
}

function entryHasRemoteMedia(entry: YouMindBoardEntry): boolean {
  return Boolean(entry.card.imageUrl?.trim() || entry.card.faviconUrl?.trim());
}

function buildInitialMediaKeys(entries: YouMindBoardEntry[]): Set<string> {
  const seededKeys = new Set<string>();

  for (const entry of entries) {
    if (!entryHasRemoteMedia(entry)) continue;
    seededKeys.add(getEntryKey(entry));
    if (seededKeys.size >= INITIAL_MEDIA_BATCH) break;
  }

  return seededKeys;
}

export function YouMindWaterfallMasonryList({
  entries,
  collapsedGroupKeys,
  entryCollapseKey,
  onPressEntry,
  renderHeader = null,
  emptyState = null,
  contentContainerStyle,
  refreshControl,
  listKey,
}: Props): React.JSX.Element {
  const styles = useMemo(() => createStyles(), []);
  const [loadedMediaKeys, setLoadedMediaKeys] = useState<Set<string>>(() => buildInitialMediaKeys(entries));

  useEffect(() => {
    setLoadedMediaKeys(buildInitialMediaKeys(entries));
  }, [entries, listKey]);

  const onViewableItemsChanged = useRef((info: {
    viewableItems: Array<ViewToken<YouMindBoardEntry>>;
    changed: Array<ViewToken<YouMindBoardEntry>>;
  }) => {
    const nextKeys = info.viewableItems
      .map((token) => token.item)
      .filter((entry): entry is YouMindBoardEntry => !!entry && entryHasRemoteMedia(entry))
      .map(getEntryKey);

    if (nextKeys.length === 0) return;

    setLoadedMediaKeys((current) => {
      let changed = false;
      const next = new Set(current);

      for (const key of nextKeys) {
        if (next.has(key)) continue;
        next.add(key);
        changed = true;
      }

      return changed ? next : current;
    });
  });

  const renderItem = useCallback((info: ListRenderItemInfo<YouMindBoardEntry>) => {
    const { item, target } = info;

    if (target === 'Measurement') {
      return <View style={[styles.measurementItem, { height: estimateYouMindWaterfallCardHeight(item) }]} />;
    }

    const itemKey = getEntryKey(item);

    return (
      <View style={styles.itemShell}>
        <YouMindWaterfallCard
          entry={item}
          collapsed={collapsedGroupKeys.has(entryCollapseKey(item))}
          onPress={() => onPressEntry(item)}
          shouldLoadMedia={loadedMediaKeys.has(itemKey)}
        />
      </View>
    );
  }, [collapsedGroupKeys, entryCollapseKey, loadedMediaKeys, onPressEntry, styles.itemShell, styles.measurementItem]);

  return (
    <FlashList
      key={listKey}
      data={entries}
      keyExtractor={getEntryKey}
      renderItem={renderItem}
      getItemType={(item) => item.card.variant}
      numColumns={2}
      masonry
      drawDistance={960}
      viewabilityConfig={VIEWABILITY_CONFIG}
      onViewableItemsChanged={onViewableItemsChanged.current}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={emptyState}
      refreshControl={refreshControl || undefined}
      overrideProps={{ initialDrawBatchSize: 6 }}
      keyboardShouldPersistTaps="handled"
    />
  );
}

function createStyles() {
  return StyleSheet.create({
    itemShell: {
      paddingBottom: Space.md,
      paddingHorizontal: Space.xs / 2,
    },
    measurementItem: {
      paddingBottom: Space.md,
      paddingHorizontal: Space.xs / 2,
    },
  });
}
