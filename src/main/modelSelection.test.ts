import { afterEach, expect, it, vi } from 'vitest';
import type { IpcMainInvokeEvent } from 'electron';

import { runModelSelection } from './modelSelection';
import { ALIGNMENT_MODEL_SELECTION_FAILURE } from '../constants/ipc';

const send = vi.fn();
vi.mock( './processHelpers', () => ( {
  binaryDir: '/bin',
  send: ( ...args: unknown[] ) => send( ...args ),
  runProcess: vi.fn( async () => 1 ),
} ) );

afterEach( () => {
  vi.restoreAllMocks();
} );

it( 'a failed modeltest-ng run reports its own command', async () => {
  vi.spyOn( console, 'log' ).mockImplementation( () => {} );
  vi.spyOn( console, 'error' ).mockImplementation( () => {} );
  await runModelSelection( {} as IpcMainInvokeEvent, {
    id: 'a1',
    filePath: '/data/primates.fasta',
    outputDir: '/nonexistent-out',
    dataType: 'nucleotide',
    numThreads: 2,
    binaryName: 'modeltest-ng',
  } );
  expect( send ).toHaveBeenCalledTimes( 1 );
  const [, channel, { error }] = send.mock.calls[0];
  expect( channel ).toBe( ALIGNMENT_MODEL_SELECTION_FAILURE );
  expect( error.message ).toContain( 'exited with code \'1\'.' );
  expect( error.message ).toContain( 'Command: modeltest-ng -d nt -i' );
} );
