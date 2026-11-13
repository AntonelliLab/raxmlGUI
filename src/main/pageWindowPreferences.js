/**
 * Web preferences for every shell window. Node stays out of the page.
 * @param {{ preloadPath?: string }} [options]
 */
export function pageWindowPreferences( { preloadPath } = {} ) {
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
