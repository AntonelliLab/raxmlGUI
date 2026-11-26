import Store from 'electron-store';

interface AppStoreSchema {
  darkMode?: boolean;
}

export const appStore = new Store<AppStoreSchema>();
