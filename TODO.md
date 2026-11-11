Todo:
- Option to remove existing files (shell.moveItemToTrash(fullPath))
- Create publish script 

## TypeScript in the Electron main process

Main, shared modules used by main, `src/constants/ipc`, and `src/settings/*` are **`.js` today** so `electron-webpack` can resolve extensionless imports (`./api`, `../common/utils`, etc.). The renderer may still use `.ts`/`.tsx`; CRA handles that separately.

**Why:** [`electron-webpack`](package.json) bundles main with Babel and default webpack `resolve.extensions` (no `.ts`). Without config, `yarn compile` fails with “Can't resolve …” even when sources are `.ts`.

**When re-migrating, wire bundling first, then rename (`git mv`).**

1. **Pick one approach**
   - [`@electron-webpack/typescript`](https://webpack.electron.build/add-ons/typescript) add-on (documented for this stack), or
   - Extend [`webpack.config.js`](webpack.config.js): `resolve.extensions` include `.ts` (and `.tsx` if needed); `babel-loader` on `*.ts` with `@babel/preset-typescript` (strip types only, same pattern as renderer).

2. **Scope of the main bundle** (must all compile or stay `.js`):
   - `src/main/**`
   - `src/common/**` imported from main (e.g. `utils`, `io`, `errors`, parsers, `typecheckAlignment`)
   - `src/constants/ipc`
   - `src/settings/raxml`, `src/settings/raxmlng` (pulled in via menu → `app/store`)

3. **Verify on a clean tree** (matches CI `compile` step):
   - `yarn compile` / `yarn build`
   - `yarn lint` (main is `.js` today; TS-only ESLint override applies once files are `.ts` again)
   - `npx tsc --noEmit` if types are restored (optional `electron-webpack-globals.d.ts` for `__static`)

4. The pack excludes `src/` and ships `out/`. Leave `build.files` as exclusions.
