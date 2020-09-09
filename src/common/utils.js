import { openNewGitHubIssue, debugInfo, activeWindow, is } from 'electron-util';
import { serializeError } from 'serialize-error';
import cleanStack from 'clean-stack';
import * as ipc from 'electron-better-ipc';

if (is.renderer) {
  ipc.ipcRenderer.answerMain('get-state-report', async () => {
    const storeModule = await import('../app/store');
    const store = storeModule.default;
    const report = store.generateReport();
    return report;
  });
}

const getActiveState = async () => {
  if (is.renderer) {
    return window.store.generateReport();
  }
  const win = activeWindow();
  const report = await ipc.ipcMain.callRenderer(win, 'get-state-report');
  return report;
}

const getActiveStateSync = () => {
  if (is.renderer) {
    return window.store.generateReport();
  }
  return `Current state not available on synchronous call from main`;
}

const serializeAndCleanError = (error) => {
  const err = serializeError(error);
  err.stack = cleanStack(error.stack);
  return err;
}


export const quote = dir => is.windows ? `"${dir}"` : dir;

const stringify = json => JSON.stringify(json, null, '  ');

const stringifyToGithubMarkdown = (json) => `\`\`\`json
${stringify(json)}
\`\`\``;

const createReportBodyForGithub = (error, activeState) => `Autogenerated report:
${stringifyToGithubMarkdown(serializeAndCleanError(error))}

Active state:
${stringifyToGithubMarkdown(activeState)}

---

Process: ${is.renderer ? 'renderer' : 'main'}
${debugInfo()}`;

const createReportBodyForMail = (error, activeState) => encodeURI(`Autogenerated report:
${stringify(serializeAndCleanError(error))}

Active state:
${stringify(activeState)}

---

Process: ${is.renderer ? 'renderer' : 'main'}
${debugInfo()}`);

export const reportIssueToGitHub = async (error) => {
  const activeState = await getActiveState();
  openNewGitHubIssue({
    user: 'AntonelliLab',
    repo: 'raxmlGUI',
    title: error.name,
    body: createReportBodyForGithub(error, activeState),
  });
}

export const getMailtoLinkToReportError = (error) => {
  const activeState = getActiveStateSync();
  const mailtoLinkContent = `mailto:raxmlgui.help@googlemail.com?subject=${encodeURI(error.name)}&body=${createReportBodyForMail(error, activeState)}`;
  return mailtoLinkContent;
}


// TODO: app now gets undefined in production!
// const IS_PROD = process.env.NODE_ENV === 'production';
// const root = process.cwd();
// export const assetsDir =
//   IS_PROD && app.isPackaged
//     ? path.join(path.dirname(app.getAppPath()), '..', './resources', './assets')
//     : path.join(root, './assets');
