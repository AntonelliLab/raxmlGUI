import path from 'path';
import { app } from 'electron';

const IS_PROD = process.env.NODE_ENV === 'production';
const root = process.cwd();

// const rootDir = app.isPackaged ? app.getAppPath() : __dirname;
// export const binariesDir = path.join(rootDir, '..', '..', 'static', 'bin');
export const binariesDir = path.join(__static, 'bin');
// export const binariesDir =
//   IS_PROD && app.isPackaged
//     ? path.join(path.dirname(app.getAppPath()), '..', 'static', 'bin')
//     : path.join(root, 'static', 'bin');
