import { observable, computed, action, reaction, makeObservable } from 'mobx';
import {
  CODON_NONE,
  CODON_SPECIFIC,
  CODON_THIRD,
  PartType,
  PartAAType,
  PartName,
  PartStart,
  PartEnd,
  PartCodon,
} from './PartOptions';

interface PartitionAlignment {
  // Read by the part options, which this file hands each part to.
  run: unknown;
  partition: Partition;
  dataType: string | undefined;
  partitionType: string;
  aaMatrixName: string;
  length: number;
}

interface PartValues {
  type: string;
  aaType: string;
  name: string;
  start: number;
  end: number;
  codon: string;
}

const getPartitionType = ( dataType: string | undefined, aaMatrixName = 'BLOSUM62' ): string => {
  // for old raxml
  switch ( dataType ) {
    case 'dna':
    case 'nucleotide':
      return 'DNA';
    case 'protein':
      return aaMatrixName;
    case 'binary':
      return 'BIN';
    case 'multistate':
      return 'MULTI';
    default:
      // '' until the alignment is parsed.
      return dataType ?? '';
  }
};

class Part {
  partition: Partition;
  type: PartType;
  aaType: PartAAType;
  name: PartName;
  start: PartStart;
  end: PartEnd;
  codon: PartCodon;
  constructor( partition: Partition, { type, aaType, name, start, end, codon }: PartValues ) {
    makeObservable( this, {
      typePadded: computed,
      text: computed,
      values: computed,
    } );
    this.partition = partition;
    this.type = new PartType( this, type );
    this.aaType = new PartAAType( this, aaType );
    this.name = new PartName( this, name );
    this.start = new PartStart( this, start );
    this.end = new PartEnd( this, end );
    this.codon = new PartCodon( this, codon );
  }

  get typePadded(): string {
    return `${this.type.finalValue},`.padEnd( 12 );
  }

  /**
   * codon 0: No codon
   * codon 1,2 or 3: Codon specific, add offset 0,1 and 2 respectively and append \3
   * codon 12: Third codon, add offset 1 on same row and append \3 on the two ranges
   */
  _transform = ( offset = 0, namePrefix = '', codon = 0 ): string => {
    const nameSuffix =
      codon === 0
        ? ''
        : codon === 12
          ? '_codon1and2'
          : `_codon${codon}`;
    const partWithoutRange = `${this.typePadded}${namePrefix}${this.name.value}${nameSuffix} = `;
    const start = this.start.value + offset;
    const end = this.end.value + offset;
    let range = `${start}-${end}`;
    if ( codon === 12 ) {
      range = `${range}\\3, ${start + 1}-${end}\\3`;
    } else if ( codon > 0 && codon <= 3 ) {
      range = `${start + codon - 1}-${end}\\3`;
    }
    return `${partWithoutRange}${range}`;
  };

  transform = ( offset = 0, namePrefix = '' ): string => {
    switch ( this.codon.value ) {
      case CODON_NONE:
        return this._transform( offset, namePrefix );
      case CODON_SPECIFIC:
        return [1, 2, 3]
          .map( ( codon ) => this._transform( offset, namePrefix, codon ) )
          .join( '\n' );
      case CODON_THIRD:
        return [12, 3]
          .map( ( codon ) => this._transform( offset, namePrefix, codon ) )
          .join( '\n' );
      default:
        throw new Error( `Codon type ${this.codon.value} not recognized.` );
    }
  };

  get text(): string {
    // return `${this.typePadded}${this.name.value} = ${this.start.value}-${this.end.value}`;
    return this.transform();
  }

  parse = ( _row: string ): void => {};

  get values(): PartValues {
    return {
      type: this.type.value,
      aaType: this.aaType.value,
      name: this.name.value,
      start: this.start.value,
      end: this.end.value,
      codon: this.codon.value,
    };
  }

  clone = (): Part => {
    return new Part( this.partition, this.values );
  };
}
class Partition {
  alignment: PartitionAlignment;
  defaultPartition: Part;
  partToAdd: Part;
  constructor( alignment: PartitionAlignment ) {
    makeObservable( this, {
      parts: observable,
      addPart: action,
      isMixed: computed,
      isDefault: computed,
      maxEndValue: computed,
      currentEndValue: computed,
      isComplete: computed,
      nonDefaultPartitionComplete: computed,
      progress: computed,
      haveError: computed,
      errorMessage: computed,
      addPartDisabled: computed,
      text: computed,
      reset: action,
    } );
    this.alignment = alignment;
    this.defaultPartition = new Part( this, {
      type: alignment.partitionType,
      aaType: 'BLOSUM62',
      name: 'part_1',
      start: 1,
      end: alignment.length,
      codon: 'None',
    } );
    this.partToAdd = new Part( this, {
      type: alignment.partitionType,
      aaType: 'BLOSUM62',
      name: 'part_1',
      start: 1,
      end: 1,
      codon: 'None',
    } );
    reaction(
      () => alignment.length,
      ( length, _previous, reaction ) => {
        reaction.dispose();
        // Make default alignment complete except for mixed type
        if ( this.alignment.dataType !== 'mixed' ) {
          this.defaultPartition.end.value = length;
        }
      },
      { name: 'React to alignment length' },
    );
    reaction(
      () => ( {
        dataType: alignment.dataType,
        aaMatrixName: alignment.aaMatrixName,
      } ),
      ( { dataType, aaMatrixName } ) => {
        const type =
          dataType === 'protein'
            ? 'protein'
            : getPartitionType( dataType, aaMatrixName );
        this.partToAdd.type.value = this.defaultPartition.type.value = type;
        this.defaultPartition.aaType.value = aaMatrixName;
        this.partToAdd.aaType.value = aaMatrixName;
      },
      { name: 'React to default partition type change' },
    );
  }
  parts: Part[] = [];
  // Add current part values
  addPart = (): void => {
    this.parts.push( this.partToAdd.clone() );
    // Reset or update in partToAdd
    this.partToAdd.codon.value = CODON_NONE;
    if ( !this.isComplete ) {
      // Start new range after last end position
      this.partToAdd.start.value = this.partToAdd.end.value =
        this.partToAdd.end.value + 1;
      // Increment counter on name
      const oldName = this.partToAdd.name.value;
      let newName = oldName.replace(
        /(\d+)$/,
        ( _: string, digits: string ) => `${Number( digits ) + 1}`,
      );
      if ( newName === oldName ) {
        newName = `${newName}_1`;
      }
      this.partToAdd.name.value = newName;
    }
  };
  get isMixed(): boolean {
    return this.alignment.dataType === 'mixed';
  }
  get isDefault(): boolean {
    return this.parts.length === 0;
  }
  get maxEndValue(): number {
    return this.alignment.length;
  }

  get currentEndValue(): number {
    return this.isDefault
      ? this.defaultPartition.end.value
      : this.parts[this.parts.length - 1].end.value;
  }
  get isComplete(): boolean {
    return this.currentEndValue === this.maxEndValue;
  }
  get nonDefaultPartitionComplete(): boolean {
    return !this.isDefault && this.isComplete;
  }
  get progress(): number {
    return this.isDefault
      ? 100
      : ( this.currentEndValue * 100.0 ) / this.alignment.length;
  }
  get haveError(): boolean {
    return this.partToAdd.end.haveError;
  }
  get errorMessage(): string {
    return this.haveError
      ? `End position error: ${this.partToAdd.end.errorMessage}`
      : '';
  }
  get addPartDisabled(): boolean {
    return this.nonDefaultPartitionComplete || this.haveError;
  }
  get text(): string {
    if ( this.isDefault ) {
      // return this.alignment.partitionFileContent;
      return this.defaultPartition.text;
    }
    return this.parts.map( ( part ) => part.text ).join( '\n' );
  }
  transform = ( offset = 0, prefix = '' ): string => {
    if ( this.isDefault ) {
      return this.defaultPartition.transform( offset, prefix );
    }
    return this.parts.map( ( part ) => part.transform( offset, prefix ) ).join( '\n' );
  };

  reset = (): void => {
    if ( this.parts.length > 0 ) {
      this.parts.splice( 0 );
      this.partToAdd.name.value = 'part_1';
      this.partToAdd.start.value = 1;
      this.partToAdd.end.value = 1;
    }
  };
}

export default Partition;
