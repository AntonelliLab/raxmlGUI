import { shell } from 'electron';
import path from 'path';

import { assetsDir } from '../../common/utils';

function showCitation(filename, fileEnding) {
  const p = path.join(assetsDir, `citations/${filename}${fileEnding}`);
  const opened = shell.openItem(p);
  if (!opened) {
    // TODO Error handling for file not opened, should be sent to renderer process, but how received
    console.log('File not opened', p);
  }
}

function showGUICitation(fileEnding) {
  showCitation('citation', fileEnding);
}

function showRAxMLCitation(fileEnding) {
  showCitation('raxml', fileEnding);
}

const subMenuInfo = {
  label: 'Info',
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
        const p = path.join(assetsDir, 'help/help-RAxML.html');
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
        const p = path.join(assetsDir, 'help/manual_raxml.pdf');
        const opened = shell.openItem(p);
        if (!opened) {
          // TODO Error handling for file not opened, sent to render process but how processed
          console.log('File not opened', p);
        }
      }
    },
    {
      label: 'Export citation',
      submenu: [
        {
          label: 'Text file',
          click() {
            showGUICitation('.txt');
          }
        },
        {
          label: 'EndNote (XML)',
          click() {
            showGUICitation('.xml');
          }
        },
        {
          label: 'Reference manager (RIS)',
          click() {
            showGUICitation('.ris');
          }
        },
        {
          label: 'BibTeX library',
          click() {
            showGUICitation('.bib');
          }
        }
      ]
    },
        {
      label: 'Export RAxML citation',
      submenu: [
        {
          label: 'Text file',
          click() {
            showRAxMLCitation('.txt');
          }
        },
        {
          label: 'EndNote',
          click() {
            showRAxMLCitation('.enw');
          }
        },
        {
          label: 'Reference manager (RIS)',
          click() {
            showRAxMLCitation('.ris');
          }
        },
        {
          label: 'BibTeX library',
          click() {
            showRAxMLCitation('.bib');
          }
        }
      ]
    }

  ]
};

export default subMenuInfo;
