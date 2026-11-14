import Store from 'electron-store';

interface AppStoreSchema {
  darkMode?: boolean;
}

export const appStore: Store<AppStoreSchema> = new Store();
