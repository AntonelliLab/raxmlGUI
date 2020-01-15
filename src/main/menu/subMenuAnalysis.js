import { BrowserWindow } from 'electron';

import * as ipc from "../../constants/ipc";

const subMenuAnalysis = {
    label: 'Analysis',
    submenu: [
      {
        label: 'Enforce constraint...',
        submenu: [
          {
            label: 'Use backbone constraint',
            type: 'checkbox',
            checked: false,
            click() {
              BrowserWindow.getFocusedWindow().webContents.send(ipc.TOGGLE_BACKBONE_CONSTRAINT);
            }
          },
          {
            label: 'Use multifurcating constraint',
            type: 'checkbox',
            checked: false,
            click() {
              BrowserWindow.getFocusedWindow().webContents.send(ipc.TOGGLE_MULTIFURCATING_CONSTRAINT);
            }
          }
        ]
      }
    ]
  };

export default subMenuAnalysis;
