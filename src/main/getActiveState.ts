import { ipcMain } from 'electron';
import type { IpcMainEvent } from 'electron';
import { randomUUID } from 'node:crypto';

import { STATE_REPORT, STATE_REPORT_RESULT } from '../constants/ipc';
import { activeWindow } from './utils/utils';

export interface StateReport {
  command: string;
  stdout: string;
  stderr: string;
}

interface StateReportPayload {
  id: string;
  report: StateReport | undefined;
}

export function getActiveState(): Promise<StateReport | undefined> {
  const win = activeWindow();
  if ( !win ) {
    return Promise.resolve( undefined );
  }
  const id = randomUUID();
  return new Promise( ( resolve ) => {
    const onResult = ( _event: IpcMainEvent, payload: StateReportPayload ) => {
      if ( !payload || payload.id !== id ) {
        return;
      }
      ipcMain.removeListener( STATE_REPORT_RESULT, onResult );
      resolve( payload.report );
    };
    ipcMain.on( STATE_REPORT_RESULT, onResult );
    win.webContents.send( STATE_REPORT, id );
  } );
}
