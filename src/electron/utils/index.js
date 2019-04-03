import { dialog } from 'electron';
import fs from 'fs';
import _ from 'lodash';
import os from 'os';

/**
 * Checks if a file with given complete path to the file exists in the filesystem
 * @param {String} filepath The complete path to the file
 */
export function checkIfExists(filepath) {
  if (fs.existsSync(filepath)) {
    console.log('File exists: ', filepath);
    return true;
  }
  console.log('File not exists: ', filepath);
  return false;
}

/**
 * Helper function to delete a file from the filesystem
 * @param {String} filePath The path for the file to be deleted
 */
export function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, err => {
      if (err) {
        console.log('Error in deleting file', filePath, err.message);
      } else {
        console.log('Deleted file', filePath);
      }
    });
  } else {
    console.log('Error: This file does not exist, cannot delete.', filePath);
  }
}

/**
 * Helper function to write a file to the file system
 * @param {String} filePath The path including filename to the file to be written
 * @param {String} content The text content of the file to write
 */
export function writeFile(filePath, content) {
  fs.writeFile(filePath, content, err => {
    if (err) {
      console.log(`An error ocurred creating the file ${err.message}`);
      // TODO send error message to UI, handle it here as well
    } else {
      console.log('The file has been succesfully saved', filePath);
    }
  });
}

export function openFileDialog({ title, properties }, pc) {
  // Open a select file dialog
  dialog.showOpenDialog(
    {
      title,
      properties
    },
    paths => {
      // paths is an array that contains all the selected file paths
      if (paths === undefined) {
        console.log('No paths selected');
        return;
      }
      console.log('Selected these paths', paths);
      pc(paths);
    }
  );
}

/**
 * Transforms the an arguments object for a RAxML run into an array.
 * The resulting pattern is [key, value, key, value ...]. Keys get appended a '-',
 * so that the resulting array is usable as input to a RAxML shell call.
 * @param {Object} args: The arguments for the RAxML run
 */
export function transformArgsToArray(args) {
  console.log('transformArgsToArray');
  let arrayArgs = [];
  _.toPairs(args).map(pair => {
    const editedPair = pair.map((item, index) => {
      // The key
      if (index === 0) {
        return `-${item}`;
        // TODO if the key has more than one letter it needs to -- appended to
      }
      return item;
    });
    arrayArgs = arrayArgs.concat(editedPair);
    return true;
  });
  return arrayArgs;
}

/**
 * Get the partition type for an alignment to be used in a partition file.
 * @param {String} dataType The data type of the alignment.
 */
export function getPartitionType(dataType) {
  console.log('getPartitionType');
  // Use hardcoded substitution model defaults
  let partitionType;
  switch (dataType) {
    case 'dna':
      partitionType = 'DNA';
      break;
    // TODO this has to be done more, needs user choice?
    case 'protein':
      partitionType = 'BLOSUM62';
      break;
    case 'binary':
      partitionType = 'BIN';
      break;
    case 'multistate':
      partitionType = 'MULTI';
      break;
    default:
      break;
  }
  return partitionType;
}

/**
 * Get the default substitution model param for a given datatype.
 * @param {String} dataType The data type of the alignment.
 */
function getDefaultModel(dataType) {
  console.log('getDefaultModel');
  // Use hardcoded substitution model defaults
  let substitutionModel;
  switch (dataType) {
    case 'dna':
    case 'mixed':
      substitutionModel = 'GTRGAMMA';
      break;
    case 'protein':
      substitutionModel = 'PROTGAMMAGTR';
      break;
    case 'binary':
      substitutionModel = 'BINGAMMA';
      break;
    case 'multistate':
      substitutionModel = 'MULTIGAMMA';
      break;
    default:
      break;
  }
  return substitutionModel;
}

/**
 * Creates an object of default arguments for a RAxML call.
 * @param {Object} infile The object containing info about the input file of the RAxML run
 */
export function createDefaultGlobalArgs(infile, isPartitioned, partitionFile) {
  console.log('createDefaultGlobalArgs');
  const now = Date.now();
  const path = infile.path.replace(infile.name, '');
  const defaultGlobalArgs = {
    // TODO this was set to true in the old GUI for all runs, is it needed?
    O: true,
    // Number of threads set to one
    T: os.cpus().length / 2,
    // s = Alignment file
    s: infile.path,
    // w = Working directory set to infile directory
    w: path,
    // Random seed
    p: now
  };
  if (isPartitioned) {
    // The partition file name
    defaultGlobalArgs.q = partitionFile;
    defaultGlobalArgs.M = true;
    // Substitution model
    defaultGlobalArgs.m = getDefaultModel('mixed');
  } else {
    // Substitution model
    defaultGlobalArgs.m = getDefaultModel(infile.dataType);
  }
  return defaultGlobalArgs;
}

/**
 * Create an object with the arguments for the default analysis type
 */
export function createDefaultAnalysisArgs(infile) {
  const now = Date.now();
  return {
    N: 100,
    f: 'a',
    // TODO: Creates a default output file name, maybe let the user decide which name to use
    n: `${infile.name}.${now}.tre`
  };
}

/**
 * Checks an incoming sequence whether it can be regarded as binary or multistate.
 * Calculates the percentage of binary [01] characters of the entire sequence.
 * Calculates the percentage of multistate [2] characters of the entire sequence.
 * @param {String} sequence The sequence
 */
export function checkForBinaryOrMultistate(sequence) {
  // console.log('checkForBinaryOrMultistate');
  // Get the sequence string, strip out N and -
  let seq = sequence.replace(/N/gi, '');
  seq = seq.replace(/-/gi, '');
  // Get proportion of binary characters
  const binMatch = (seq.match(/[01]/gi) || []).length / seq.length;
  // Get proportion of multistate characters
  const multiMatch = (seq.match(/[2]/gi) || []).length / seq.length;
  // If there are multistate characters in sequence, return 'multistate' as datatype
  if (multiMatch !== 0) {
    return 'multistate';
  }
  // If there are only binary characters in sequence, return 'binary' as datatype
  if (binMatch !== 0) {
    return 'binary';
  }
  return undefined;
}
