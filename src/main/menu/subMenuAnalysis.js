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
            }
          },
          {
            label: 'Use multifurcating constraint',
            type: 'checkbox',
            checked: false,
            click() {
            }
          }
        ]
      }
    ]
  };

export default subMenuAnalysis;
