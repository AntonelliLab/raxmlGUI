import { computed, makeObservable } from 'mobx';

class FinalPartition {
  constructor( run ) {
    makeObservable( this, {
      text: computed,
      isDefault: computed,
      isComplete: computed,
    } );
    this.run = run;
  }
  /*
    Example:
    DNA, gene1 = 1-3676
    BIN, morph = 3677-3851
  */
  get text() {
    if ( !this.run.haveAlignments ) {
      return '';
    }
    const partitionTexts = [];
    let total = 0;
    this.run.alignments.forEach( ( alignment, index ) => {
      partitionTexts.push( alignment.partition.transform( total, `${index}_` ) );
      total += alignment.length;
    } );
    return partitionTexts.join( '\n' );
  }
  get isDefault() {
    return (
      this.run.alignments.length === 0 ||
      ( this.run.alignments.length === 1 &&
        this.run.alignments[0].partition.isDefault )
    );
  }
  get isComplete() {
    return this.run.alignments.every(
      ( alignment ) => alignment.partition.isComplete,
    );
  }
}

export default FinalPartition;
