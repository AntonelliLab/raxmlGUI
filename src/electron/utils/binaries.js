import path from 'path';
import { app } from 'electron';

const IS_PROD = process.env.NODE_ENV === 'production';
const root = process.cwd();

export const binariesDir =
  IS_PROD && app.isPackaged
    ? path.join(path.dirname(app.getAppPath()), '..', './bin', './raxml')
    : path.join(root, './bin', './raxml');
