import { shell } from 'electron';
import path from 'path';

import { assetsDir } from '../../common/utils';

// This is how I did it
function showCitation(fileEnding) {
  const p = path.join(
    assetsDir,
    `citations/citation${fileEnding}`
  );
  const opened = shell.openItem(p);
  if (!opened) {
    // TODO Error handling for file not opened, should be sent to renderer process, but how received
    console.log('File not opened', p);
  }
}

const subMenuUtilities =   {
    label: 'Utilities',
    submenu: [
      {
        label: 'Export citation',
        submenu: [
          {
            label: 'Text file',
            click() {
              showCitation('.txt');
            }
          },
          {
            label: 'EndNote (XML)',
            click() {
              showCitation('.enl');
            }
          },
          {
            label: 'Reference manager (RIS)',
            click() {
              showCitation('.ris');
            }
          },
          {
            label: 'BibTeX library',
            click() {
              showCitation('.bib');
            }
          }
        ]
      }
    ]
  };

export default subMenuUtilities;
