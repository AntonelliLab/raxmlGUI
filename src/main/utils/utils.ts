import electron from 'electron';
import type { BrowserWindow } from 'electron';

export const activeWindow = (): BrowserWindow | null =>
  electron.BrowserWindow.getFocusedWindow() ?? null;
