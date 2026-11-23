import { expect, it } from 'vitest';

import { spawnSync } from 'child_process';
import path from 'path';

const root = path.join( __dirname, '..' );

// Lints the known-bad fixtures through the real eslint.config.js. `ignore: false` lifts the config's
// ignore of the fixture folder, which keeps them out of `yarn lint`.
function lintFixtures(): Record<string, string[]> {
  const script = [
    "import { ESLint } from 'eslint';",
    'const eslint = new ESLint({ cwd: process.argv[1], ignore: false });',
    "const results = await eslint.lintFiles(['src/test/lintFixtures/*']);",
    'const report = {};',
    "for (const r of results) report[r.filePath.split('/').pop()] = r.messages.map((m) => m.ruleId);",
    'console.log("LINT " + JSON.stringify(report));',
  ].join( '\n' );
  const result = spawnSync( process.execPath, [ '--input-type=module', '-e', script, root ], {
    cwd: root,
    encoding: 'utf8',
  } );
  if ( result.status !== 0 ) {
    throw new Error( result.stderr || result.stdout );
  }
  const line = result.stdout.split( '\n' ).find( ( item ) => item.startsWith( 'LINT ' ) );
  return JSON.parse( line.slice( 'LINT '.length ) );
}

it( 'reports the cycle, hooks, semicolon and quote rules on known-bad fixtures', () => {
  const report = lintFixtures();

  expect( report[ 'cycleA.ts' ] ).toContain( 'import-x/no-cycle' );
  expect( report[ 'cycleB.ts' ] ).toContain( 'import-x/no-cycle' );
  expect( report[ 'hook.tsx' ] ).toContain( 'react-hooks/rules-of-hooks' );
  expect( report[ 'semi.ts' ] ).toContain( '@stylistic/semi' );
  expect( report[ 'quotes.ts' ] ).toContain( '@stylistic/quotes' );
} );
