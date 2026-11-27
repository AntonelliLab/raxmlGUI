import { join, quote } from '../../paths';
import type { CmdArg, Platform } from './index';

export interface ModeltestNgInput {
  outputDir: string;
  outputNameSafe: string;
  dataType: string | undefined;
  finalAlignment: { path: string };
  numThreads: { value: number };
}

export const modeltestNgArgs = ( run: ModeltestNgInput, { windows }: Platform ): CmdArg[][] => {
  const first: CmdArg[] = [];
  // data type
  if ( run.dataType === 'nucleotide' ) {
    first.push( '-d', 'nt' );
  } else if ( run.dataType === 'protein' ) {
    first.push( '-d', 'aa' );
  }
  // alignment file
  first.push( '-i', quote( run.finalAlignment.path, { windows } ) );
  // output file, modeltest errors if this file already exists
  first.push(
    '-o',
    quote( join( run.outputDir, `RAxML_GUI_ModelTest_${run.outputNameSafe}` ), { windows } ),
  );
  // modeltest throws errors if the output file already exists
  first.push( '--force' );
  // Number of processors
  first.push( '-p', run.numThreads.value );
  // TODO: in able to support partitioned modeltest we need to change the partition file text
  // https://github.com/ddarriba/modeltest/wiki/Input-Data#partition-files
  // partition scheme
  return [first];
};
