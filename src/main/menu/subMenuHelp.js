import { shell } from 'electron';
import path from 'path';

import { assetsDir } from '../../common/utils';

const subMenuHelp =   {
    role: 'help',
    submenu: [
      {
        label: 'Help raxmlGUI2',
        accelerator: process.platform === 'darwin' ? 'Command+?' : 'Ctrl+H',
        click() {
          const p = path.join(assetsDir, 'help/help.pdf');
          const opened = shell.openItem(p);
          if (!opened) {
            // TODO Error handling for file not opened, sent to render process but how processed
            console.log('File not opened', p);
          }
        }
      },
      {
        label: 'Help RAxML',
        click() {
          const p = path.join(
            assetsDir,
            'help/help-RAxML.html'
          );
          const opened = shell.openItem(p);
          if (!opened) {
            // TODO Error handling for file not opened, sent to render process but how processed
            console.log('File not opened', p);
          }
        }
      },
      {
        label: 'RAxML Manual',
        click() {
          const p = path.join(
            assetsDir,
            'help/manual_raxml.pdf'
          );
          const opened = shell.openItem(p);
          if (!opened) {
            // TODO Error handling for file not opened, sent to render process but how processed
            console.log('File not opened', p);
          }
        }
      }
    ]
  };

export default subMenuHelp;
