import { computed, makeObservable } from 'mobx';

interface FinalPartitionRun {
  haveAlignments: boolean;
  alignments: {
    length: number;
    partition: {
      isDefault: boolean;
      isComplete: boolean;
      transform( offset: number, prefix: string ): string;
    };
  }[];
}

class FinalPartition {
  run: FinalPartitionRun;
  constructor( run: FinalPartitionRun ) {
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
  get text(): string {
    if ( !this.run.haveAlignments ) {
      return '';
    }
    const partitionTexts: string[] = [];
    let total = 0;
    this.run.alignments.forEach( ( alignment, index ) => {
      partitionTexts.push( alignment.partition.transform( total, `${index}_` ) );
      total += alignment.length;
    } );
    return partitionTexts.join( '\n' );
  }
  get isDefault(): boolean {
    return (
      this.run.alignments.length === 0 ||
      ( this.run.alignments.length === 1 &&
        this.run.alignments[0].partition.isDefault )
    );
  }
  get isComplete(): boolean {
    return this.run.alignments.every(
      ( alignment ) => alignment.partition.isComplete,
    );
  }
}

export default FinalPartition;
