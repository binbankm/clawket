import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatScreen } from './index';

const chatScreenLayoutMock = jest.fn();

const appContextMock = {
  config: { backendKind: 'hermes' as 'openclaw' | 'hermes' },
  debugMode: false,
  gateway: {
    getBackendCapabilities: jest.fn(),
  },
};

jest.mock('@react-navigation/native', () => ({
  CommonActions: {
    navigate: (payload: unknown) => payload,
  },
  useIsFocused: () => true,
  useNavigation: () => ({
    openDrawer: jest.fn(),
    navigate: jest.fn(),
    getParent: () => ({
      dispatch: jest.fn(),
    }),
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../contexts/AppContext', () => ({
  useAppContext: () => appContextMock,
}));

jest.mock('./ChatControllerContext', () => ({
  useChatControllerContext: () => ({ controller: true }),
}));

jest.mock('./ChatScreenLayout', () => ({
  ChatScreenLayout: (props: unknown) => {
    chatScreenLayoutMock(props);
    return null;
  },
}));

jest.mock('./components/AppUpdateAnnouncementModal', () => ({
  AppUpdateAnnouncementModal: () => null,
}));

jest.mock('../../services/app-update-announcement', () => ({
  getCurrentAppUpdateAnnouncement: jest.fn(() => null),
  getCurrentAppVersion: jest.fn(() => '1.0.0'),
  markCurrentAppUpdateAnnouncementShown: jest.fn(),
  shouldShowCurrentAppUpdateAnnouncement: jest.fn(async () => false),
}));

jest.mock('../../services/config-add-connection-request', () => ({
  requestConfigAddConnection: jest.fn(),
}));

jest.mock('../../utils/openExternalUrl', () => ({
  openExternalUrl: jest.fn(),
}));

describe('ChatScreen backend capability updates', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      if (typeof message === 'string' && message.includes('react-test-renderer is deprecated')) {
        return;
      }
    });
    chatScreenLayoutMock.mockClear();
    appContextMock.config = { backendKind: 'hermes' };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('updates Agent Session Board button visibility when backend changes on the same gateway instance', () => {
    const { rerender } = render(React.createElement(ChatScreen));

    expect(chatScreenLayoutMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onOpenAgentSessionsBoard: undefined,
      }),
    );

    appContextMock.config = { backendKind: 'openclaw' };
    rerender(React.createElement(ChatScreen));

    expect(chatScreenLayoutMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        onOpenAgentSessionsBoard: expect.any(Function),
      }),
    );
  });
});
