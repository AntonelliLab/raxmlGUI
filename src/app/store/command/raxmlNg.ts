import remove from 'lodash/remove';

import { join, quote } from '../../paths';
import type { CmdArg, ConstraintInput, PartitionInput, Platform } from './index';

export interface RaxmlNgInput extends PartitionInput, ConstraintInput {
  outputDir: string;
  outputNameSafe: string;
  analysis: { value: string };
  ngSubstitutionModelCmd: string;
  numThreads: { notAvailable: boolean; value: number };
  seedParsimony: number;
  outGroup: { cmdValue: string };
  numRuns: { value: number };
  numRepetitionsNg: { value: number | string };
  alignments: { length: number };
  tree: { filePath: string };
}

export const raxmlNgArgs = ( run: RaxmlNgInput, { windows }: Platform ): CmdArg[][] => {
  const first: CmdArg[] = [];
  const second: CmdArg[] = [];
  const third: CmdArg[] = [];
  const cmdArgs = [first, second, third]; // Possibly empty ones removed in the end
  switch ( run.analysis.value ) {
    case 'SC':
      // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#preparing-the-alignment
      first.push( '--check' );
      if ( run.havePartitionFile ) {
        first.push( '--model', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '--model', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      } else {
        first.push( '--model', run.ngSubstitutionModelCmd );
      }
      first.push(
        '--prefix',
        quote( join( run.outputDir, run.outputNameSafe ), { windows } ),
      );
      first.push( '--msa', quote( run.finalAlignment.path, { windows } ) );
      if ( run.backboneConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.backboneConstraint.filePath, { windows } ),
        );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.multifurcatingConstraint.filePath, { windows } ),
        );
      }
      break;
    case 'CC':
      // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#preparing-the-alignment
      first.push( '--parse' );
      if ( run.havePartitionFile ) {
        first.push( '--model', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '--model', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      } else {
        first.push( '--model', run.ngSubstitutionModelCmd );
      }
      first.push(
        '--prefix',
        quote( join( run.outputDir, run.outputNameSafe ), { windows } ),
      );
      first.push( '--msa', quote( run.finalAlignment.path, { windows } ) );
      if ( run.backboneConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.backboneConstraint.filePath, { windows } ),
        );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.multifurcatingConstraint.filePath, { windows } ),
        );
      }
      break;
    case 'TI':
      // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#tree-inference
      first.push( '--msa', quote( run.finalAlignment.path, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '--model', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '--model', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      } else {
        first.push( '--model', run.ngSubstitutionModelCmd );
      }
      first.push(
        '--prefix',
        quote( join( run.outputDir, run.outputNameSafe ), { windows } ),
      );
      if ( !run.numThreads.notAvailable ) {
        first.push( '--threads', run.numThreads.value );
      }
      first.push( '--seed', run.seedParsimony );
      if ( run.outGroup.cmdValue ) {
        first.push( '--outgroup', run.outGroup.cmdValue );
      }
      first.push( '--tree', `rand{${run.numRuns.value}}` );
      if ( run.backboneConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.backboneConstraint.filePath, { windows } ),
        );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.multifurcatingConstraint.filePath, { windows } ),
        );
      }
      break;
    case 'ML+tBS+con':
      // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
      // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
      first.push( '--all' );
      first.push( '--msa', quote( run.finalAlignment.path, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '--model', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '--model', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      } else {
        first.push( '--model', run.ngSubstitutionModelCmd );
      }
      first.push(
        '--prefix',
        quote( join( run.outputDir, run.outputNameSafe ), { windows } ),
      );
      first.push( '--seed', run.seedParsimony );
      if ( !run.numThreads.notAvailable ) {
        first.push( '--threads', run.numThreads.value );
      }
      if ( run.outGroup.cmdValue ) {
        first.push( '--outgroup', run.outGroup.cmdValue );
      }
      first.push( '--bs-metric', 'fbp' );
      first.push( '--tree', `rand{${run.numRuns.value}}` );
      first.push( '--bs-trees', run.numRepetitionsNg.value );
      if ( run.backboneConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.backboneConstraint.filePath, { windows } ),
        );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.multifurcatingConstraint.filePath, { windows } ),
        );
      }
      break;
    case 'ML+TBE+con':
      // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
      // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
      first.push( '--all' );
      first.push( '--msa', quote( run.finalAlignment.path, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '--model', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '--model', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      } else {
        first.push( '--model', run.ngSubstitutionModelCmd );
      }
      first.push(
        '--prefix',
        quote( join( run.outputDir, run.outputNameSafe ), { windows } ),
      );
      first.push( '--seed', run.seedParsimony );
      if ( !run.numThreads.notAvailable ) {
        first.push( '--threads', run.numThreads.value );
      }
      if ( run.outGroup.cmdValue ) {
        first.push( '--outgroup', run.outGroup.cmdValue );
      }
      first.push( '--bs-metric', 'tbe' );
      first.push( '--tree', `rand{${run.numRuns.value}}` );
      first.push( '--bs-trees', run.numRepetitionsNg.value );
      if ( run.backboneConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.backboneConstraint.filePath, { windows } ),
        );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push(
          '--tree-constraint',
          quote( run.multifurcatingConstraint.filePath, { windows } ),
        );
      }
      break;
    case 'AS':
      // https://github.com/amkozlov/raxml-ng/wiki/Tutorial#bootstrapping
      // raxml-ng --all --msa prim.phy --model GTR+G --prefix T15 --seed 2 --threads 2 --bs-metric fbp,tbe
      first.push( '--ancestral' );
      first.push( '--msa', quote( run.finalAlignment.path, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '--model', quote( run.partitionFile, { windows } ) );
      } else if ( run.alignments.length > 1 ) {
        first.push( '--model', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      } else {
        first.push( '--model', run.ngSubstitutionModelCmd );
      }
      first.push(
        '--prefix',
        quote( join( run.outputDir, run.outputNameSafe ), { windows } ),
      );
      first.push( '--tree', quote( run.tree.filePath, { windows } ) );
      break;
    default:
  }
  // Remove items that are only empty strings
  cmdArgs.forEach( ( args ) => remove( args, ( n ) => n === '' ) );
  return cmdArgs.filter( ( args ) => args.length > 0 );
};
