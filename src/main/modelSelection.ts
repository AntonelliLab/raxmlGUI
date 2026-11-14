import path from 'path';
import _fs from 'fs';
import parsePath from 'parse-filepath';
import type { IpcMainEvent } from 'electron';
import * as ipc from '../constants/ipc';
import { quote } from '../common/utils';
import {
  beginRun,
  stillRunning,
} from './cancelRun';
import {
  binaryDir,
  runProcess,
  send,
} from './processHelpers';

const fs = _fs.promises;

type ProcessExit =
  | 'SIGTERM'
  | number
  | NodeJS.Signals
  | null;

interface ModelSelectionPayload {
  id: string;
  filePath: string;
  outputDir: string;
  dataType: string;
  numThreads: number;
  binaryName: string;
}

export async function runModelSelection(
  event: IpcMainEvent,
  payload: ModelSelectionPayload,
): Promise<void> {
  const { id, filePath, outputDir, dataType, numThreads, binaryName } = payload;
  const token = beginRun( id );
  const reportFailure = ( error: unknown ): void => {
    if ( !stillRunning( id, token ) ) {
      return;
    }
    send( event, ipc.ALIGNMENT_MODEL_SELECTION_FAILURE, { id, error } );
  };
  const { name } = parsePath( filePath );
  const outputPath = path.join( outputDir, `RAxML_GUI_ModelTest_${name}` );
  try {
    // Remove binary checkpoint as that may be invalid
    await fs.unlink( `${outputPath}.ckp` );
  }
  catch ( _err: unknown ) { }
  const args = [];
  if ( dataType === 'nucleotide' ) {
    args.push( '-d', 'nt' );
  }
  else if ( dataType === 'protein' ) {
    args.push( '-d', 'aa' );
  }
  // alignment file
  args.push( '-i', quote( filePath ) );
  // output path
  args.push( '-o', quote( outputPath ) );
  // modeltest throws errors if the output file already exists
  args.push( '--force' );
  // Number of processors
  args.push( '-p', numThreads );
  console.log( `Alignment '${id}': Run modeltest with args ${args}...` );
  const stdOuts: string[] = [];
  const onStdOut = ( content: string ): void => {
    stdOuts.push( content );
  };
  let exitCode: ProcessExit = 0;
  try {
    if ( !stillRunning( id, token ) ) {
      return;
    }
    console.log( `Run modeltest-ng with args:`, args );
    exitCode = await runProcess( id, event, binaryDir, binaryName, args, {
      onStdOut,
    } );
    if ( !stillRunning( id, token ) || exitCode === 'SIGTERM' ) {
      return;
    }
    if ( exitCode !== 0 ) {
      throw new Error( `Error trying to run modeltest-ng, exited with code '${exitCode}'.` );
    }
  }
  catch ( err: unknown ) {
    console.error( 'Modeltest run error:', err );
    reportFailure( err );
    return;
  }
  // Parse stdout to get the best models
  console.log( 'Parse output from modeltest-ng...' );
  const commands = stdOuts.join( '' ).split( '\n' );
  try {
    // Each '> [program]' is written three times, for BIC, AIC and AICc respectively. Use AICc.
    const cmdRaxml = commands.filter( ( cmd ) => cmd.startsWith( '  > raxmlHPC-SSE3' ) )[2];
    const cmdRaxmlNG = commands.filter( ( cmd ) => cmd.startsWith( '  > raxml-ng' ) )[2];
    const modelRaxml = /-m (\S+)/.exec( cmdRaxml )[1];
    const extraFlag = /--(\S+)/.exec( cmdRaxml )?.[0];
    const modelRaxmlNG = /--model (\S+)/.exec( cmdRaxmlNG )[1];
    console.log( `-> raxml: ${modelRaxml}, extraFlag: ${extraFlag}, raxml-ng: ${modelRaxmlNG}` );
    send( event, ipc.ALIGNMENT_MODEL_SELECTION_SUCCESS, {
      id,
      result: {
        raxml: modelRaxml,
        extraFlag,
        raxmlNG: modelRaxmlNG,
      },
    } );
  }
  catch ( err: unknown ) {
    console.error( `Couldn't parse best models from modeltest-ng output:`, err );
    console.log( 'output:', commands );
    const error = new Error( `Couldn't parse best models from modeltest-ng output. Check alignment log.` );
    error.name = 'Modeltest error';
    reportFailure( error );
  }
}
