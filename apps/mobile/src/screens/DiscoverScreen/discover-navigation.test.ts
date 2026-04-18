import { dismissDiscoverFlowForChat, type DiscoverBackNavigation } from './discover-navigation';

function createNavigation(overrides?: Partial<DiscoverBackNavigation>): DiscoverBackNavigation {
  return {
    canGoBack: () => true,
    goBack: jest.fn(),
    getParent: () => null,
    ...overrides,
  };
}

describe('dismissDiscoverFlowForChat', () => {
  it('dismisses the parent discover container when it can go back', () => {
    const parentNavigation = createNavigation();
    const navigation = createNavigation({
      getParent: () => parentNavigation,
    });

    dismissDiscoverFlowForChat(navigation);

    expect(parentNavigation.goBack).toHaveBeenCalledTimes(1);
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it('falls back to closing the current screen when there is no dismissible parent', () => {
    const navigation = createNavigation({
      canGoBack: () => true,
      getParent: () => createNavigation({ canGoBack: () => false }),
    });

    dismissDiscoverFlowForChat(navigation);

    expect(navigation.goBack).toHaveBeenCalledTimes(1);
  });
});
