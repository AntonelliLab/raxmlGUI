import type { WebPreferences } from 'electron';

interface PageWindowPreferencesOptions {
  preloadPath?: string;
}

type PageWindowPreferencesResult = WebPreferences & {
  allowEval: false;
};

/**
 * Web preferences for every shell window. Node stays out of the page.
 */
export function pageWindowPreferences(
  { preloadPath }: PageWindowPreferencesOptions = {},
): PageWindowPreferencesResult {
  return {
    backgroundThrottling: false,
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    ...( preloadPath
      ? { preload: preloadPath }
      : {} ),
    allowEval: false,
  };
}
