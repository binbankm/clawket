export type DiscoverBackNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
  getParent?: () => DiscoverBackNavigation | null | undefined;
};

export function dismissDiscoverFlowForChat(navigation: DiscoverBackNavigation): void {
  const parentNavigation = navigation.getParent?.();

  if (parentNavigation?.canGoBack()) {
    parentNavigation.goBack();
    return;
  }

  if (navigation.canGoBack()) {
    navigation.goBack();
  }
}
