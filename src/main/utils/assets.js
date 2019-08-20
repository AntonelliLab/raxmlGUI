import path from 'path';
import { app } from 'electron';

const IS_PROD = process.env.NODE_ENV === 'production';
const root = process.cwd();

export const assetsDir =
  IS_PROD && app.isPackaged
    ? path.join(path.dirname(app.getAppPath()), '..', './resources', './assets')
    : path.join(root, './assets');
