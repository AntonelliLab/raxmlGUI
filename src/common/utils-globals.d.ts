export {};

declare global {
  interface Window {
    store: {
      generateReport: ( opts?: { maxStdoutLength?: number } ) => unknown;
    };
  }
}
