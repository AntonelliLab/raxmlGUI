import _ from 'lodash';
import fasta from 'bionode-fasta';
import seq from 'bionode-seq';
import path from 'path';

import { sendToMainWindow } from '../communication';
import {
  deleteFile,
  checkForBinaryOrMultistate,
  createDefaultGlobalArgs,
  createDefaultAnalysisArgs,
  transformArgsToArray
} from '../utils';
import { runRaxmlWithArgs } from '../analysis/run';

import {
  PARSING_ERROR_IPC,
  PARSING_PROGRESS_IPC,
  PARSING_END_IPC,
  TYPECHECKING_PROGRESS_IPC,
  TYPECHECKING_END_IPC,
  CHECKRUN_ERROR_IPC,
  CHECKRUN_END_IPC
} from '../../constants/ipc';

export function addAlignments(alignments) {
  console.log('addAlignments');
  // TODO Currently only accepts fasta files, in future check of what type are the alignments files
  // RAxML as of now accepts FASTA or relaxed interleaved or sequential PHYLIP
  startParsing(alignments);
}

export async function addAlignment(filePath) {
  console.log('Add alignment', filePath);
  const alignment = await parseAlignment(filePath);
  console.log(`Alignment ${filePath} parsed!`);
  typecheckAlignment(alignment);
  console.log(`Alignment ${filePath} type checked:`, alignment.dataType);
  await checkrunAlignment(alignment);
  console.log(`Alignment ${filePath} checkrun ok? ${alignment.checkRunSuccess} (data: ${alignment.checkRunData}`);
}

export async function parseAlignment(filePath) {
  const alignment = {
    id: filePath,
    path: filePath,
  };
  // An array of the sequence lengths encountered in parsing
  const sequences = [];
  const sequenceLengths = [];
  let numSequencesParsed = 0;
  return new Promise((resolve, reject) => {
    fasta
      .obj(alignment.path)
      .on('error', (
        error // Parsing has failed pass error to UI
      ) => {
        console.log('Error in fasta parsing', error);
        alignment.parsingComplete = true;
        sendToMainWindow(PARSING_ERROR_IPC, { alignment, error });
        reject();
      })
      // on data is called for each sequence in the alignment
      .on('data', data => {
        if (sequences.length === 0)
          console.log('Data from fasta parsing', data);
        sequences.push(data);
        const sl = data.seq.length;
        // Only push to sequence length array if different from first
        if (sequenceLengths.length === 0 || sl !== sequenceLengths[0]) {
          sequenceLengths.push(data.seq.length);
        }
        numSequencesParsed += 1;
        sendToMainWindow(PARSING_PROGRESS_IPC, {
          alignment,
          numSequencesParsed
        });
      })
      // On end is called after parse has completed
      .on('end', () => {
        alignment.sequences = sequences;
        alignment.fileFormat = 'fasta';
        alignment.numSequences = numSequencesParsed;
        console.log(`Parsing completed of ${sequences.length} sequences.`);
        if (sequenceLengths.length > 0) {
          console.log('Sequences are not of same length');
          // TODO handle as error case an send to UI
          // reject();
        }
        alignment.length = sequenceLengths[0];
        alignment.parsingComplete = true;
        sendToMainWindow(PARSING_END_IPC, { alignment });
        resolve(alignment);
      });
  });
}

export function typecheckAlignment(alignment) {
  const sequenceDataTypes = [];
  let numSequencesTypechecked = 0;
  _.each(alignment.sequences, (sequence, index) => {
    // Get the data type for this sequence using BioNode seq
    sequence.dataType = seq.checkType(sequence.seq);
    if (!sequence.dataType) {
      // If seq returns undefined (i.e., not 'protein', 'rna', 'dna', 'ambiguousDna')
      sequence.dataType = checkForBinaryOrMultistate(sequence.seq);
    }
    numSequencesTypechecked = index + 1;
    // sendToMainWindow(TYPECHECKING_PROGRESS_IPC, {
    //   alignment,
    //   numSequencesTypechecked
    // });
    sequenceDataTypes.push(sequence.dataType);
  });

  // Get the majority mode in the sequence data types array
  alignment.dataType = sequenceDataTypes
    .sort(
      (i, ii) =>
        sequenceDataTypes.filter(v => v === i).length -
        sequenceDataTypes.filter(v => v === ii).length
    )
    .pop();
  alignment.typecheckingComplete = true;
  sendToMainWindow(TYPECHECKING_END_IPC, { alignment });
  // TODO add if necessary an error from typechecking, check if BioNode throws an error
  // with alignment.typecheckingComplete = true;
  // sendToMainWindow("typechecking:error", { alignment, error })
  return alignment;
}

export async function checkrunAlignment(alignment) {
  console.log('checkrun alignment', alignment);
  if (!alignment.name) {
    // Needed for default argument creation below
    // TODO: Make more transparent, and using output folder from app.
    alignment.name = path.basename(alignment.path);
  }
  // Create the RAxML checkrun arguments
  // Required -s sequenceFileName -n outputFileName -m substitutionModel, i.e. the defaults
  const globalArgs = createDefaultGlobalArgs(alignment);
  const runArgs = Object.assign(
    {},
    globalArgs,
    createDefaultAnalysisArgs(alignment)
  );
  // “-f c”: check if the alignment can be properly read by RAxML
  runArgs.f = 'c';
  // Transform runArgs as object into array
  const arrayArgs = transformArgsToArray(runArgs);

  console.log('\nrun with args:', runArgs);

  await runRaxmlWithArgs(alignment.path, arrayArgs, {
    stdout: data => {
      // Parsing the stdout of the test run as string and check if output contains the
      // message that it can read the alignment file
      // TODO is this a good indication?
      const dataString = String(data);
      if (dataString.includes('Alignment format can be read by RAxML')) {
        console.log('Alignment format can be read by RAxML');
        alignment.checkRunSuccess = true;
      }
      // If the checkrun had a warning in stdout
      if (dataString.toLowerCase().includes('warning')) {
        // console.log('Checkrun stdout: WARNING encountered:', dataString);
      }
      // console.log('Checkrun output:', dataString);
      // Attach the data from the raxml output
      alignment.checkRunData = dataString;
    },
    close: code => {
      // code = 0: everything ok ???
      // code = 255: RAxML errored out ??????
      console.log('Checkrun close with code:', code);
      if (code === 255) {
        console.log('Checkrun stdout close: Error code given for RAxML.');
        // Send all text after the word error along as error message
        // TODO don't know if that is helpfull in any way, yet
        const message = alignment.checkRunData.toLowerCase().split('error');
        const error = message[message.length - 1];
        alignment.checkRunComplete = true;
        sendToMainWindow(CHECKRUN_ERROR_IPC, { alignment, error });
      } else if (code === 0) {
        console.log(
          'Checkrun stdout close: Code not equals 255, i.e. success'
        );
        alignment.checkRunComplete = true;
        sendToMainWindow(CHECKRUN_END_IPC, { alignment });
      } else {
        // TODO if this happens something is not set properly
        // TODO use some error sentry
        console.log(code);
      }
      const checkRunOutputPrefix = 'RAxML_info.';
      const checkRunOutputPath = `${runArgs.w}${checkRunOutputPrefix}${
        runArgs.n
      }`;
      deleteFile(checkRunOutputPath);
    }
  });
  return alignment;
}

// Use BioNode to parse the fasta files into an array of object per sequence
export function startParsing(alignments) {
  console.log('startParsing');
  const parsingPromises = _.map(alignments, alignment => {
    return parseAlignment(alignment.path);
  });
  // All alignments are processed
  Promise.all(parsingPromises)
    .then(results => {
      // Chain on the parsing of alignments
      startTypechecking(results);
      return results;
    })
    .catch(new Error('Parsing error'));
}

// Use BioNode to parse the fasta files into an array of object per sequence
export function startTypechecking(alignments) {
  console.log('startTypechecking');
  _.map(alignments, alignment => {
    return typecheckAlignment(alignment);
  });
  // Chain on the checkrun for the alignments
  startCheckrun(alignments);
}

export function startCheckrun(alignments) {
  console.log('startCheckrun');
  _.each(alignments, alignment => {
    checkrunAlignment(alignment);
  });
}
