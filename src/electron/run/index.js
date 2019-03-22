import _ from 'lodash';

import { sendToMainWindow } from '../communication';
import {
  writeFile,
  getPartitionType,
  createDefaultGlobalArgs,
  createDefaultAnalysisArgs
} from '../utils';

import { RUN_CREATED_IPC } from '../../constants/ipc';

function compareSequences(a, b) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

export function createRun(alignments) {
  const run = {};
  run.createdAt = Date.now();
  // Filter out alignments that did not pass the checkrun
  // TODO if alignments have thus been removed, alert user - show UI
  alignments = _.filter(alignments, alignment => alignment.checkRunSuccess);
  // Sort the alignments sequences by id
  _.map(alignments, alignment => alignment.sequences.sort(compareSequences));

  // TODO collate different alignments and create partition file
  if (alignments.length > 1) {
    // Check if all alignments are in the same folder
    const checkPath = _.filter(alignments, a => a.path.replace(a.name, '') !== alignments[0].path.replace(alignments[0].name, ''));
    if (checkPath.length > 0) {
      // TODO not all alignments are in the same folder, ask user where to save run
      console.log('Not all alignments are in the same folder');
    } else {
      console.log('Alignments are in the same folder');
      run.path = alignments[0].path;
    }
    // Check that all alignments have the same sequence set
    const allSequencesInAlignments = alignments.map(alignment => {
      // Check if the sequences of this alignment are in all other alignments
      const sequencesInAlignments  = alignment.sequences.map(sequence => {
        // Check if this sequence is in all alignments
        const sequenceInAlignments = alignments.map(a => {
          const filteredSequences = a.sequences.filter(s => s.id === sequence.id);
          if (filteredSequences.length > 0) {
            return true;
          }
          return false;
        })
        if (sequenceInAlignments.length > 0 && sequenceInAlignments.every(i => i)) {
          console.log('This sequence is in all alignments', sequence.id);
          return true;
        }
        console.log('This sequence is NOT in all alignments', sequence.id);
        return false;
      });
      if (sequencesInAlignments.length > 0 && sequencesInAlignments.every(i => i)) {
        console.log('All sequences of this alignment are in all alignments', alignment.path);
        return true;
      }
      return false;
    })
    if (allSequencesInAlignments.length > 0 && !allSequencesInAlignments.every(i => i)) {
      console.log('These alignments should not be concatenated because sequence set is wrong. Aborting.')
      // TODO show error
      return;
    }
    console.log('These alignments can be concatenated.');
    // TODO: concatenate only the sequences of the same ID !!!
    // Create concatenated sequences
    run.sequences = [];
    alignments[0].sequences.map((seq, index) => {
      const newSeq = Object.assign({}, seq);
      for (let i = 1; i < alignments.length; i++) {
        newSeq.seq = newSeq.seq.concat(alignments[i].sequences[index].seq);
        newSeq.dataType = 'mixed';
      }
      run.sequences.push(newSeq);
      return true;
    });

    // TODO replace hardcoded value here to be chooseable
    const partitionedAlignmentFilename = 'partitioned_alignment';
    const partitionFilename = 'partition_test';

    // TODO temp/perm? save the concatenated alignment file
    // Save the concatenated = partitioned alignment file to disk in the alignment folder
    // TODO, if the user changed the directory in the step before, use here
    const partitionedAlignment = `${alignments[0].path.replace(alignments[0].name, '') + partitionedAlignmentFilename}.txt`;
    let fastaText = '';
    run.sequences.map(sequence => {
      fastaText += `>${sequence.id}\n${sequence.seq}\n`;
      return true;
    });

    // TODO temp/perm? save the concatenated file
    // Save the partition file to disk in the alignment folder
    // TODO, if the user changed the directory in the step before, use here
    const partitionFile = `${alignments[0].path.replace(alignments[0].name, '') + partitionFilename}.txt`;
    /*
      DNA, gene1 = 1-3676
      BIN, morph = 3677-3851
    */
    let partitionFileText = '';
    let site = 1;
    let total = 0;
    const partitions = alignments.map((alignment, index) => {
      total += alignment.length;
      const partitionType = getPartitionType(alignment.dataType);
      partitionFileText += `${partitionType}, ${alignment.dataType}_${index} = ${site}-${total}\n`;
      site += alignment.length;
      return { partitionType, dataType: alignment.dataType, length: alignment.length };
    });

    writeFile(partitionedAlignment, fastaText);
    run.inFile = partitionedAlignment;
    run.inFileFolder = partitionedAlignment.replace(partitionedAlignmentFilename, '');
    run.outFilename = `${partitionedAlignmentFilename}.${run.createdAt}`;

    writeFile(partitionFile, partitionFileText);
    run.partitionFile = partitionFile;

    // TODO add path of the concat file as input
    // TODO create partion file
    // TODO add handling of partitioned files in the app
    run.isPartitioned = true;
    run.partitions = partitions;

    const dummyAlignment = { path: partitionedAlignment, name: `${partitionedAlignmentFilename}.txt` };
    const globalArgs = createDefaultGlobalArgs(dummyAlignment, true, partitionFile);
    run.globalArgs = globalArgs;
    const runArgs = Object.assign({}, run.globalArgs, createDefaultAnalysisArgs(dummyAlignment));
    run.argsList = [runArgs];
    run.analysisType = 'ML+BS';
    run.dataType = 'mixed';
  } else {
    const alignment = alignments[0];
    // TODO use strip or so?
    run.path = alignment.path;
    run.inFile = alignment.path;
    run.inFileFolder = alignment.path.replace(alignment.name, '');
    // TODO move handling of already existing files into helper
    run.outFilename = `${alignment.name}.${run.createdAt}`;
    run.isPartitioned = false;
    const globalArgs = createDefaultGlobalArgs(alignment);
    run.globalArgs = globalArgs;
    const runArgs = Object.assign({}, run.globalArgs, createDefaultAnalysisArgs(alignment));
    run.argsList = [runArgs];
    run.analysisType = 'ML+BS';
    run.dataType = alignment.dataType;
    run.sequences = alignment.sequences;
  }
  sendToMainWindow(RUN_CREATED_IPC, [run]);
}
