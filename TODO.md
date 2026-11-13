Todo:
- Option to remove existing files (shell.moveItemToTrash(fullPath))
- Create publish script 

## TypeScript in the Electron main process

Main, shared modules used by main, `src/constants/ipc`, and `src/settings/*` are `.js`. The shell build is `yarn build` (`electron-vite build`). The page build compiles JSX in `.js` files. A move of those main sources to `.ts` starts from that build.
