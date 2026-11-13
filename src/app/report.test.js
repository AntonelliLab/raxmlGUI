// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { cleanStack, serializeAndCleanError } from './report';

it( 'drops node and electron frames from a stack', () => {
  const stack = [
    'Error: boom',
    '    at app (/Users/me/raxmlGUI/src/app/report.js:1:1)',
    '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
    '    at Module._compile (node:internal/modules/cjs/loader:1000:1)',
    '    at Object.<anonymous> (/Users/me/App.app/Contents/Resources/electron.asar/browser.js:1:1)',
    '    at native',
  ].join( '\n' );

  expect( cleanStack( stack ) ).toBe( [
    'Error: boom',
    '    at app (/Users/me/raxmlGUI/src/app/report.js:1:1)',
  ].join( '\n' ) );
} );

it( 'serializeAndCleanError keeps a cleaned stack string', () => {
  const error = new Error( 'boom' );
  error.stack = [
    'Error: boom',
    '    at app (/Users/me/raxmlGUI/src/app/report.js:1:1)',
    '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
  ].join( '\n' );

  expect( serializeAndCleanError( error ).stack ).toBe( [
    'Error: boom',
    '    at app (/Users/me/raxmlGUI/src/app/report.js:1:1)',
  ].join( '\n' ) );
} );
