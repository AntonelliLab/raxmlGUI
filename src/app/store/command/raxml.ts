import remove from 'lodash/remove';

import { join, quote } from '../../paths';
import type { CmdArg, ConstraintInput, PartitionInput, Platform } from './index';

export interface RaxmlInput extends PartitionInput, ConstraintInput {
  outputDir: string;
  outputNameSafe: string;
  analysis: { value: string };
  outputFilenameSafe: string;
  raxmlSubstitutionModelCmd: string;
  numThreads: { notAvailable: boolean; value: number };
  seedParsimony: number;
  seedRapidBootstrap: number;
  seedBootstrap: number;
  substitutionMatrix: { extraCmdValue: string };
  substitutionAscertainment: { extraCmdValue: string };
  multistateModel: { notAvailable: boolean; value: string };
  disableCheckUndeterminedSequence: boolean;
  outGroup: { cmdValue: string };
  branchLength: { value: boolean };
  sHlike: { value: boolean };
  numRuns: { value: number };
  numRepetitions: { value: number | string };
  tree: { notAvailable: boolean; filePath: string };
}

export const raxmlArgs = ( run: RaxmlInput, { windows }: Platform ): CmdArg[][] => {
  const first: CmdArg[] = [];
  const second: CmdArg[] = [];
  const third: CmdArg[] = [];
  const cmdArgs = [first, second, third]; // Possibly empty ones removed in the end

  switch ( run.analysis.value ) {
    case 'FT': // Fast tree search
      // params: [params.brL, params.SHlike, params.outGroup],
      // cmd= """cd %s %s &&%s %s -f E -p %s %s -n %s -s %s -O -w %s %s %s %s %s""" \
      // % (winD, raxml_path, K[0], pro, seed_1, mod, out_file, seq_file, path_dir, part_f, cmd_temp1,cmd_temp2, winEx)
      //TODO: Where is outGroup? From line 1436 in original code, -o is unchecked
      if ( !run.numThreads.notAvailable ) {
        first.push( '-T', run.numThreads.value );
      }
      first.push( '-f', 'E' );
      first.push( '-p', run.seedParsimony );
      first.push( '-m', run.raxmlSubstitutionModelCmd );
      first.push( run.substitutionMatrix.extraCmdValue );
      first.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        first.push( '-K', run.multistateModel.value );
      }
      if ( run.disableCheckUndeterminedSequence ) {
        first.push( '-O' );
      }
      if ( run.outGroup.cmdValue ) {
        first.push( '-o', run.outGroup.cmdValue );
      }
      first.push( '-n', run.outputFilenameSafe );
      first.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      first.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      if ( run.branchLength.value ) {
        const treeFile1 = join(
          run.outputDir,
          `RAxML_fastTree.${run.outputFilenameSafe}`,
        );
        const next: CmdArg[] = [];
        if ( !run.numThreads.notAvailable ) {
          next.push( '-T', run.numThreads.value );
        }
        next.push( '-f', 'e' );
        next.push( '-m', run.raxmlSubstitutionModelCmd );
        next.push( run.substitutionMatrix.extraCmdValue );
        next.push( run.substitutionAscertainment.extraCmdValue );
        if ( !run.multistateModel.notAvailable ) {
          next.push( '-K', run.multistateModel.value );
        }
        next.push( '-t', quote( treeFile1, { windows } ) );
        next.push( '-n', `brL.${run.outputFilenameSafe}` );
        next.push( '-s', quote( run.finalAlignment.path, { windows } ) );
        next.push( '-w', quote( run.outputDir, { windows } ) );
        if ( run.havePartitionFile ) {
          next.push( '-q', quote( run.partitionFile, { windows } ) );
        } else if ( !run.finalAlignment.partition.isDefault ) {
          next.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
        }
        cmdArgs.push( next );
      }
      if ( run.sHlike.value ) {
        const treeFile2 = run.branchLength.value
          ? join(
            run.outputDir,
            `RAxML_result.brL.${run.outputFilenameSafe}`,
          )
          : join( run.outputDir, `RAxML_fastTree.${run.outputFilenameSafe}` );
        const next: CmdArg[] = [];
        if ( !run.numThreads.notAvailable ) {
          next.push( '-T', run.numThreads.value );
        }
        next.push( '-f', 'e' );
        next.push( '-m', run.raxmlSubstitutionModelCmd );
        next.push( run.substitutionMatrix.extraCmdValue );
        next.push( run.substitutionAscertainment.extraCmdValue );
        if ( !run.multistateModel.notAvailable ) {
          next.push( '-K', run.multistateModel.value );
        }
        next.push( '-t', quote( treeFile2, { windows } ) );
        next.push( '-n', `sh.${run.outputFilenameSafe}` );
        next.push( '-s', quote( run.finalAlignment.path, { windows } ) );
        next.push( '-w', quote( run.outputDir, { windows } ) );
        if ( run.havePartitionFile ) {
          next.push( '-q', quote( run.partitionFile, { windows } ) );
        } else if ( !run.finalAlignment.partition.isDefault ) {
          next.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
        }
        cmdArgs.push( next );
      }
      break;
    case 'ML': // ML search
      // params: [params.SHlike, params.combinedOutput, params.outGroup],
      // cmd= """cd %s %s&&%s %s -f d %s -N %s -O -p %s %s -s %s -n %s %s -w %s %s %s %s %s %s""" \
      // % (winD, raxml_path, K[0], pro, mod, BSrep2.get(), random.randrange(1, 1000, 1), o, seq_file, out_file, part_f, path_dir, const_f, result2, cmd_temp2, combine_trees, winEx)
      //TODO: Check conf_f (from line 754 in original source)
      if ( !run.numThreads.notAvailable ) {
        first.push( '-T', run.numThreads.value );
      }
      first.push( '-f', 'd' );
      first.push( '-m', run.raxmlSubstitutionModelCmd );
      first.push( run.substitutionMatrix.extraCmdValue );
      first.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        first.push( '-K', run.multistateModel.value );
      }
      first.push( '-N', run.numRuns.value );
      if ( run.disableCheckUndeterminedSequence ) {
        first.push( '-O' );
      }
      first.push( '-p', run.seedParsimony );
      first.push( '-n', run.outputFilenameSafe );
      if ( run.outGroup.cmdValue ) {
        first.push( '-o', run.outGroup.cmdValue );
      }
      first.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      first.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      if ( run.backboneConstraint.isSet ) {
        first.push( '-r', quote( run.backboneConstraint.filePath, { windows } ) );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push( '-g', quote( run.multifurcatingConstraint.filePath, { windows } ) );
      }
      if ( run.sHlike.value ) {
        const treeFile = join(
          run.outputDir,
          `RAxML_bestTree.${run.outputFilenameSafe}`,
        );
        const next: CmdArg[] = [];
        if ( !run.numThreads.notAvailable ) {
          next.push( '-T', run.numThreads.value );
        }
        next.push( '-f', 'e' );
        next.push( '-m', run.raxmlSubstitutionModelCmd );
        next.push( run.substitutionMatrix.extraCmdValue );
        next.push( run.substitutionAscertainment.extraCmdValue );
        if ( !run.multistateModel.notAvailable ) {
          next.push( '-K', run.multistateModel.value );
        }
        next.push( '-t', quote( treeFile, { windows } ) );
        next.push( '-n', `sh.${run.outputFilenameSafe}` );
        next.push( '-s', quote( run.finalAlignment.path, { windows } ) );
        next.push( '-w', quote( run.outputDir, { windows } ) );
        if ( run.havePartitionFile ) {
          next.push( '-q', quote( run.partitionFile, { windows } ) );
        } else if ( !run.finalAlignment.partition.isDefault ) {
          next.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
        }
        cmdArgs.push( next );
      }
      break;
    case 'ML+rBS': // ML + rapid bootstrap
      // params: [params.reps, params.brL, params.outGroup],
      // cmd= """cd %s %s&& %s %s %s -f a -x %s %s %s -p %s -N %s %s -s %s -n %s %s -O -w %s %s %s %s""" \
      // % (winD, raxml_path, runWin, K[0], pro, seed_1, save_brL.get(),mod, seed_2, BSrep.get(), o, seq_file, out_file, \
      // part_f, path_dir, const_f, result, winEx)
      if ( !run.numThreads.notAvailable ) {
        first.push( '-T', run.numThreads.value );
      }
      first.push( '-f', 'a' );
      first.push( '-x', run.seedRapidBootstrap );
      first.push( '-p', run.seedParsimony );
      first.push( '-N', run.numRepetitions.value );
      first.push( '-m', run.raxmlSubstitutionModelCmd );
      first.push( run.substitutionMatrix.extraCmdValue );
      first.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        first.push( '-K', run.multistateModel.value );
      }
      if ( run.branchLength.value ) {
        first.push( '-k' );
      }
      if ( run.disableCheckUndeterminedSequence ) {
        first.push( '-O' );
      }
      if ( run.outGroup.cmdValue ) {
        first.push( '-o', run.outGroup.cmdValue );
      }
      first.push( '-n', run.outputFilenameSafe );
      first.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      first.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      if ( run.backboneConstraint.isSet ) {
        first.push( '-r', quote( run.backboneConstraint.filePath, { windows } ) );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push( '-g', quote( run.multifurcatingConstraint.filePath, { windows } ) );
      }
      break;
    case 'ML+tBS': { // ML + thorough bootstrap
      // params: [params.runs, params.reps, params.brL, params.outGroup],
      // cmd= """cd %s %s \
      // &&%s %s -b %s %s %s -p %s -N %s %s -s %s -n %s %s -w %s %s -O && cd %s \
      // &&%s %s -f d %s %s -s %s -N %s -n %s %s -w %s %s -p %s -O && cd %s \
      // &&%s %s -f b -t %s -z %s %s -s %s -n %s -w %s %s -O %s""" \
      // % (winD, raxml_path, K[0], pro, seed_1, mod, save_brL.get(),seed_2, BSrep.get(), o, seq_file, out_file1, part_f, path_dir, const_f,\
      // raxml_path, K[0], pro, mod, o, seq_file, BSrep2.get(), out_file2, part_f, path_dir, const_f,random.randrange(1, 1000, 1), \
      // raxml_path, K[0], pro, MLtreeR, trees, mod, seq_file, out_file, path_dir, result, winEx)
      // try:
      // 	remove="RAxML_info.%s.tre" % (only_name)
      // ...
      const outputFilenameSafe1 = `${run.outputNameSafe}R.tre`;
      const outputFilenameSafe2 = `${run.outputNameSafe}B.tre`;
      const treeFile = join(
        run.outputDir,
        `RAxML_bestTree.${outputFilenameSafe2}`,
      ); // MLtreeR
      const treesFile = join(
        run.outputDir,
        `RAxML_bootstrap.${outputFilenameSafe1}`,
      ); // trees
      // first wrote RAxML_bootstrap.binary_8R.tre
      // second wrote RAxML_bootstrap.binary_8B.tre

      if ( !run.numThreads.notAvailable ) {
        first.push( '-T', run.numThreads.value );
      }
      first.push( '-b', run.seedBootstrap );
      first.push( '-m', run.raxmlSubstitutionModelCmd );
      first.push( run.substitutionMatrix.extraCmdValue );
      first.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        first.push( '-K', run.multistateModel.value );
      }
      if ( run.branchLength.value ) {
        first.push( '-k' );
      }
      first.push( '-p', run.seedParsimony );
      first.push( '-N', run.numRepetitions.value );
      if ( run.disableCheckUndeterminedSequence ) {
        first.push( '-O' );
      }
      if ( run.outGroup.cmdValue ) {
        first.push( '-o', run.outGroup.cmdValue );
      }
      first.push( '-n', outputFilenameSafe1 );
      first.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      first.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      if ( run.backboneConstraint.isSet ) {
        first.push( '-r', quote( run.backboneConstraint.filePath, { windows } ) );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push( '-g', quote( run.multifurcatingConstraint.filePath, { windows } ) );
      }

      if ( !run.numThreads.notAvailable ) {
        second.push( '-T', run.numThreads.value );
      }
      second.push( '-f', 'd' );
      second.push( '-m', run.raxmlSubstitutionModelCmd );
      second.push( run.substitutionMatrix.extraCmdValue );
      second.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        second.push( '-K', run.multistateModel.value );
      }
      second.push( '-p', run.seedParsimony );
      second.push( '-N', run.numRuns.value );
      if ( run.disableCheckUndeterminedSequence ) {
        second.push( '-O' );
      }
      if ( run.outGroup.cmdValue ) {
        second.push( '-o', run.outGroup.cmdValue );
      }
      second.push( '-n', outputFilenameSafe2 );
      second.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      second.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        second.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        second.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      if ( run.backboneConstraint.isSet ) {
        second.push( '-r', quote( run.backboneConstraint.filePath, { windows } ) );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        second.push( '-g', quote( run.multifurcatingConstraint.filePath, { windows } ) );
      }

      if ( !run.numThreads.notAvailable ) {
        third.push( '-T', run.numThreads.value );
      }
      third.push( '-f', 'b' );
      third.push( '-t', quote( treeFile, { windows } ) );
      third.push( '-z', quote( treesFile, { windows } ) );
      third.push( '-m', run.raxmlSubstitutionModelCmd );
      third.push( run.substitutionMatrix.extraCmdValue );
      third.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        third.push( '-K', run.multistateModel.value );
      }
      if ( run.disableCheckUndeterminedSequence ) {
        third.push( '-O' );
      }
      third.push( '-n', run.outputFilenameSafe );
      third.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      third.push( '-w', quote( run.outputDir, { windows } ) );

      break;
    }
    case 'BS+con': { // Bootstrap + consensus
      // params: [params.reps, params.brL, params.outGroup],
      // BStrees_file= """  "%sRAxML_bootstrap.%s"    """ % (path_dirsimple, out_file)
      // cmd= """cd %s %s \
      // && %s %s %s %s -n %s -s %s %s -x %s -N %s -w %s %s %s -p %s -O && cd %s\
      // && %s %s %s -n con.%s -J MR -z %s -w %s %s
      // """ \
      // % (winD, raxml_path, \
      // K[0], pro, mod, save_brL.get(), out_file, seq_file, o, seed_1, BSrep.get(), path_dir, part_f, const_f, random.randrange(1, 1000, 1), raxml_path, \
      // K[0], pro, mod, out_file, BStrees_file, path_dir, winEx)

      const bsTreeFile = join(
        run.outputDir,
        `RAxML_bootstrap.${run.outputFilenameSafe}`,
      );
      const consensusOutput = `consensus.${run.outputFilenameSafe}`;

      if ( !run.numThreads.notAvailable ) {
        first.push( '-T', run.numThreads.value );
      }
      if ( run.branchLength.value ) {
        first.push( '-k' );
      }
      first.push( '-x', run.seedRapidBootstrap );
      first.push( '-p', run.seedParsimony );
      first.push( '-N', run.numRepetitions.value );
      first.push( '-m', run.raxmlSubstitutionModelCmd );
      first.push( run.substitutionMatrix.extraCmdValue );
      first.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        first.push( '-K', run.multistateModel.value );
      }
      if ( run.disableCheckUndeterminedSequence ) {
        first.push( '-O' );
      }
      if ( run.outGroup.cmdValue ) {
        first.push( '-o', run.outGroup.cmdValue );
      }
      first.push( '-n', run.outputFilenameSafe );
      first.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      first.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      if ( run.backboneConstraint.isSet ) {
        first.push( '-r', quote( run.backboneConstraint.filePath, { windows } ) );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push( '-g', quote( run.multifurcatingConstraint.filePath, { windows } ) );
      }

      if ( !run.numThreads.notAvailable ) {
        second.push( '-T', run.numThreads.value );
      }
      second.push( '-m', run.raxmlSubstitutionModelCmd );
      second.push( run.substitutionMatrix.extraCmdValue );
      second.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        second.push( '-K', run.multistateModel.value );
      }
      second.push( '-J', 'MR' );
      second.push( '-w', quote( run.outputDir, { windows } ) );
      second.push( '-z', quote( bsTreeFile, { windows } ) );
      second.push( '-n', consensusOutput );
      if ( run.backboneConstraint.isSet ) {
        second.push( '-r', quote( run.backboneConstraint.filePath, { windows } ) );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        second.push( '-g', quote( run.multifurcatingConstraint.filePath, { windows } ) );
      }
      break;
    }
    case 'AS': // Ancestral states
      // params: [params.tree],
      // cmd = """cd %s %s &&%s %s -f A -t "%s" -s %s %s -n %s -O -w %s %s %s""" \
      // % (winD, raxml_path, K[0], pro, rooted_tree, seq_file, mod, out_file, path_dir, part_f, winEx)
      if ( !run.numThreads.notAvailable ) {
        first.push( '-T', run.numThreads.value );
      }
      first.push( '-f', 'A' );
      first.push( '-t', quote( run.tree.filePath, { windows } ) );
      first.push( '-m', run.raxmlSubstitutionModelCmd );
      first.push( run.substitutionMatrix.extraCmdValue );
      first.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        first.push( '-K', run.multistateModel.value );
      }
      first.push( '-n', run.outputFilenameSafe );
      first.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      first.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      break;
    case 'PD': // Pairwise distances
      // params: [params.startingTree],
      // # "./raxmlHPC -f x -m GTRGAMMA[I] -n NAME -s INPUT -p RANDOMNR [-q PARTFILE -o OUTGROUP]"
      // cmd = """cd %s %s &&%s %s -f x -p %s %s -s %s %s -n %s %s -O -w %s %s %s""" \
      // % (winD, raxml_path, K[0], pro, seed_1, const_f, seq_file, mod, out_file, o, path_dir, part_f, winEx)
      if ( !run.numThreads.notAvailable ) {
        first.push( '-T', run.numThreads.value );
      }
      first.push( '-f', 'x' );
      first.push( '-p', run.seedParsimony );
      first.push( '-m', run.raxmlSubstitutionModelCmd );
      first.push( run.substitutionMatrix.extraCmdValue );
      first.push( run.substitutionAscertainment.extraCmdValue );
      if ( !run.multistateModel.notAvailable ) {
        first.push( '-K', run.multistateModel.value );
      }
      if ( run.disableCheckUndeterminedSequence ) {
        first.push( '-O' );
      }
      if ( !run.tree.notAvailable ) {
        first.push( '-t', quote( run.tree.filePath, { windows } ) );
      }
      first.push( '-n', run.outputFilenameSafe );
      first.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      first.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      break;
    case 'RBS': // Rell bootstraps
      // params: [params.reps, params.brL, params.outGroup],
      // # "./raxmlHPC -f x -m GTRGAMMA[I] -n NAME -s INPUT -p RANDOMNR [-q PARTFILE -o OUTGROUP]"
      // 	cmd = """cd %s %s &&%s %s -f D -p %s %s -s %s %s -n %s %s -O -w %s %s %s""" \
      // 	% (winD, raxml_path, K[0], pro, seed_1, const_f, seq_file, mod, out_file, o, path_dir, part_f, winEx)
      if ( !run.numThreads.notAvailable ) {
        first.push( '-T', run.numThreads.value );
      }
      first.push( '-f', 'D' );
      first.push( '-p', run.seedParsimony );
      first.push( '-m', run.raxmlSubstitutionModelCmd );
      first.push( run.substitutionMatrix.extraCmdValue );
      first.push( run.substitutionAscertainment.extraCmdValue );
      if ( run.branchLength.value ) {
        first.push( '-k' );
      }
      if ( run.outGroup.cmdValue ) {
        first.push( '-o', run.outGroup.cmdValue );
      }
      if ( !run.multistateModel.notAvailable ) {
        first.push( '-K', run.multistateModel.value );
      }
      if ( run.disableCheckUndeterminedSequence ) {
        first.push( '-O' );
      }
      first.push( '-n', run.outputFilenameSafe );
      first.push( '-s', quote( run.finalAlignment.path, { windows } ) );
      // if (!run.tree.notAvailable) {
      //   first.push('-t', run.tree.filePath);
      // }
      first.push( '-w', quote( run.outputDir, { windows } ) );
      if ( run.havePartitionFile ) {
        first.push( '-q', quote( run.partitionFile, { windows } ) );
      } else if ( !run.finalAlignment.partition.isDefault ) {
        first.push( '-q', quote( run.finalAlignment.partitionFilePath, { windows } ) );
      }
      if ( run.backboneConstraint.isSet ) {
        first.push( '-r', quote( run.backboneConstraint.filePath, { windows } ) );
      }
      if ( run.multifurcatingConstraint.isSet ) {
        first.push( '-g', quote( run.multifurcatingConstraint.filePath, { windows } ) );
      }
      break;
    default:
  }
  // Remove items that are only empty strings
  cmdArgs.forEach( ( args ) => remove( args, ( n ) => n === '' ) );
  return cmdArgs.filter( ( args ) => args.length > 0 );
};
