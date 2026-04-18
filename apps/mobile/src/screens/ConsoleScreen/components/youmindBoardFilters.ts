import type {
  YouMindBoardEntry,
  YouMindBoardEntryFilterType,
  YouMindBoardEntrySection,
} from '../../../services/youmind';

export type YouMindBoardFilterOption = {
  value: YouMindBoardEntryFilterType;
  labelKey: string;
};

const MATERIAL_FILTER_ORDER: YouMindBoardEntryFilterType[] = [
  'group',
  'note',
  'chat',
  'article',
  'video',
  'image',
  'audio',
  'pdf',
  'office',
  'text-file',
  'snippet',
];

const CRAFT_FILTER_ORDER: YouMindBoardEntryFilterType[] = [
  'group',
  'page',
  'webpage',
  'slides',
  'canvas',
  'audio-pod',
  'memory',
];

const FILTER_LABEL_KEYS: Record<YouMindBoardEntryFilterType, string> = {
  group: 'Group',
  note: 'Note',
  chat: 'Chat',
  article: 'Article',
  image: 'Image',
  pdf: 'PDF',
  office: 'Office',
  'text-file': 'Text File',
  audio: 'Audio',
  video: 'Video',
  snippet: 'Snippet',
  page: 'Document',
  'audio-pod': 'Audio Pod',
  webpage: 'Webpage',
  slides: 'Slides',
  canvas: 'Canvas',
  memory: 'Memory',
};

export function getFilterLabelKey(value: YouMindBoardEntryFilterType): string {
  return FILTER_LABEL_KEYS[value];
}

export function getAvailableFilterOptions(
  entries: YouMindBoardEntry[],
  section: YouMindBoardEntrySection,
): YouMindBoardFilterOption[] {
  const presentTypes = new Set(entries.map((entry) => entry.filterType));
  const order = section === 'materials' ? MATERIAL_FILTER_ORDER : CRAFT_FILTER_ORDER;
  return order
    .filter((value) => presentTypes.has(value))
    .map((value) => ({
      value,
      labelKey: getFilterLabelKey(value),
    }));
}

export function filterEntriesByTypes(
  entries: YouMindBoardEntry[],
  selectedFilterTypes: YouMindBoardEntryFilterType[],
): YouMindBoardEntry[] {
  if (selectedFilterTypes.length === 0) return entries;
  const selected = new Set(selectedFilterTypes);
  return entries.filter((entry) => selected.has(entry.filterType));
}
