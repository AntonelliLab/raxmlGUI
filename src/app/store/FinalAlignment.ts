import { observable, computed, action, makeObservable } from 'mobx';
import union from 'lodash/union';
import intersection from 'lodash/intersection';

import FinalPartition from './FinalPartition';
import { getFinalDataType } from '../../common/typecheckAlignment';
import { join } from '../paths';

class FinalAlignment {
  constructor( run ) {
    makeObservable( this, {
      filename: computed,
      dir: computed,
      path: computed,
      parsingComplete: observable,
      numAlignments: computed,
      fillTaxonGapsWithEmptySeqeunces: observable,
      setFillTaxonGapsWithEmptySeqeunces: action,
      taxons: computed,
      numSequences: computed,
      length: computed,
      hasInvariantSites: computed,
      dataType: computed,
      modelFlagName: computed,
      partitionFilePath: computed,
      partitionFileContent: computed,
      openFile: action,
      openPartition: action,
      showFileInFolder: action,
      openFolder: action,
      writeConcatenatedAlignmentAndPartition: action,
      writeConcatenatedAlignment: action,
      writePartition: action,
    } );
    this.run = run;
    this.partition = new FinalPartition( run );
  }

  get filename() {
    if ( this.numAlignments === 1 ) {
      return this.run.alignments[0].filename;
    }
    return `RAxML_${this.run.outputNameSafe}_concat.txt`;
  }

  get dir() {
    if ( this.numAlignments === 1 ) {
      return this.run.alignments[0].dir;
    }
    return this.run.outputDir;
  }

  get path() {
    if ( this.numAlignments === 1 ) {
      return this.run.alignments[0].path;
    }
    return join( `${this.dir}`, `${this.filename}` );
  }

  parsingComplete = true;

  get numAlignments() {
    return this.run.alignments.length;
  }

  // By default add empty sequences to fill gaps up to the union of taxons
  // else drop taxons that doesn't exist in all alignments by taking the intersection
  fillTaxonGapsWithEmptySeqeunces = true;

  setFillTaxonGapsWithEmptySeqeunces = ( checked ) => {
    this.fillTaxonGapsWithEmptySeqeunces = checked;
  };

  get taxons() {
    const setMethod = this.fillTaxonGapsWithEmptySeqeunces
      ? union
      : intersection;
    return setMethod.apply(
      setMethod,
      this.run.alignments.map( ( { taxons } ) => taxons ),
    );
  }

  get numSequences() {
    return this.taxons.length;
  }

  get length() {
    return this.run.alignments.reduce(
      ( sumLength, alignment ) => sumLength + alignment.length,
      0,
    );
  }

  get hasInvariantSites() {
    // If any one of the alignments has invariant sites return true
    for ( const alignment of this.run.alignments ) {
      if ( alignment.hasInvariantSites ) {
        return true;
      }
    }
    return false;
  }

  // get dataType() {
  //   const numAlignments = this.numAlignments;
  //   if (numAlignments === 0) {
  //     return 'none';
  //   }
  //   const firstType = this.run.alignments[0].dataType;
  //   if (numAlignments === 1) {
  //     return firstType;
  //   }
  //   for (let i = 1; i < numAlignments; ++i) {
  //     if (this.run.alignments[i].dataType !== firstType) {
  //       return 'mixed';
  //     }
  //   }
  //   return firstType;
  // }

  get dataType() {
    const { alignments } = this.run;
    const dataTypes = alignments.map( ( { dataType } ) => dataType );
    return getFinalDataType( dataTypes );
  }

  get modelFlagName() {
    const {numAlignments} = this;
    if ( numAlignments === 0 ) {
      return 'none';
    }
    const first = this.run.alignments[0].modelFlagName;
    if ( numAlignments === 1 ) {
      return first;
    }
    return first;
  }

  get partitionFilePath() {
    if ( this.partition.isDefault ) {
      return '';
    }
    const suffix = this.numAlignments > 1
      ? '_concat'
      : '';
    return join(
      `${this.dir}`,
      `RAxML_${this.run.outputNameSafe}${suffix}.part.txt`,
    );
  }

  get partitionFileContent() {
    return this.partition.text;
  }

  openFile = async () => {
    await this.writeConcatenatedAlignment();
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.openPath( this.path );
  };

  openPartition = async () => {
    await this.writeConcatenatedAlignmentAndPartition();
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.openPath( this.partitionFilePath );
  };

  showFileInFolder = async () => {
    await this.writeConcatenatedAlignment();
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.showItemInFolder( this.path );
  };

  openFolder = async () => {
    await this.writeConcatenatedAlignmentAndPartition();
    const { rendererBridge } = /** @type {any} */ ( window );
    await rendererBridge.showItemInFolder( this.dir );
  };

  writeConcatenatedAlignmentAndPartition = async () => {
    await this.writeConcatenatedAlignment();
    await this.writePartition();
  };

  writeConcatenatedAlignment = async () => {
    const { taxons, numSequences } = this;
    try {
      console.log(
        `Write concatenated alignment in FASTA format to ${this.path}..`,
      );
      let text = '';
      for ( let i = 0; i < numSequences; ++i ) {
        for ( let j = 0; j < this.numAlignments; ++j ) {
          if ( j === 0 ) {
            const prefix = i === 0
              ? '>'
              : '\n>';
            text += `${prefix}${taxons[i]}\n`;
          }
          text += this.run.alignments[j].getSequenceCode( taxons[i] );
        }
      }
      const { rendererBridge } = /** @type {any} */ ( window );
      await rendererBridge.writeFile( this.path, text );
    } catch ( err ) {
      console.error( 'Error writing concatenated alignment:', err );
      throw err;
    }
  };

  writePartition = async () => {
    try {
      console.log( `Writing partition to ${this.partitionFilePath}...` );
      const { rendererBridge } = /** @type {any} */ ( window );
      await rendererBridge.writeFile( this.partitionFilePath, this.partitionFileContent );
    } catch ( err ) {
      console.error( 'Error writing partition:', err );
      throw err;
    }
  };
}

export default FinalAlignment;
