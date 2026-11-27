import { computed, makeObservable } from 'mobx';
import Option from './Option';
import type { OptionSettings } from './Option';
import * as raxmlSettings from '../../settings/raxml';
import * as yup from 'yup';

export const CODON_NONE = 'None';
export const CODON_SPECIFIC = 'Codon specific';
export const CODON_THIRD = 'Third codon';
export const CodonModels = [CODON_NONE, CODON_SPECIFIC, CODON_THIRD];

interface Choice {
  value: string;
  title: string;
}

interface AlignmentLike {
  run: unknown;
  dataType: string;
  partitionType: string;
  length: number;
  partition: { partToAdd: { type: { value: string } } };
}

interface PartLike {
  partition: { alignment: AlignmentLike };
  aaType: { value: string };
  start: { value: number };
  codon: { value: string };
}

class PartBase<Value, Input = Value> extends Option<Value, unknown, Input> {
  part: PartLike;
  constructor(
    part: PartLike,
    defaultValue: Value,
    title: string,
    description: string,
    hoverInfo: string,
    { schema = undefined, allowOnlyValidChange = false, helperText = '' }: OptionSettings = {},
  ) {
    super(
      part.partition.alignment.run,
      defaultValue,
      title,
      description,
      hoverInfo,
      {
        schema,
        allowOnlyValidChange,
        helperText,
      },
    );
    makeObservable( this, {
      alignment: computed,
    } );
    this.part = part;
  }
  get alignment(): AlignmentLike {
    return this.part.partition.alignment;
  }
}

class PartType extends PartBase<string> {
  constructor( part: PartLike, value = 'DNA' ) {
    super( part, value, 'Data type', 'Data type of the part', '', {
      schema: yup.string(),
      allowOnlyValidChange: true,
    } );
    makeObservable( this, {
      finalValue: computed,
      options: computed,
      notAvailable: computed,
    } );
  }
  get finalValue(): string {
    const { dataType, partitionType } = this.alignment;
    if ( dataType === 'protein' || this.value === 'protein' ) {
      return this.part.aaType.value;
    }
    if ( dataType === 'mixed' ) {
      return this.value;
    }
    return partitionType;
  }
  get options(): Choice[] {
    const { dataType } = this.alignment;
    let opts = [dataType];
    if ( dataType === '' || dataType === 'mixed' ) {
      opts = ['DNA', 'BIN', 'MULTI', 'protein'];
    }
    return opts.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable(): boolean {
    return this.alignment.dataType !== 'mixed';
  }
}
class PartAAType extends PartBase<string> {
  constructor( part: PartLike, value = 'BLOSUM62' ) {
    super( part, value, 'Model', 'Substitution model for the part', '', {
      schema: yup.string(),
      allowOnlyValidChange: true,
    } );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = raxmlSettings.aminoAcidSubstitutionMatrixOptions.options.map(
    ( value ) => ( { value, title: value } ),
  );
  get notAvailable(): boolean {
    return this.alignment.dataType !== 'protein';
  }
}
class PartName extends PartBase<string> {
  constructor( part: PartLike, value = 'part1' ) {
    super( part, value, 'Name', 'Name of part', '', {
      schema: yup.string(), // TODO: Check that it is unique within partition
      allowOnlyValidChange: true,
    } );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  get notAvailable(): boolean {
    return false;
  }
}
// OptionTextField hands start and end the field's text; the number schema casts it.
class PartStart extends PartBase<number, number | string> {
  disabled: boolean;
  constructor( part: PartLike, value = 1 ) {
    super( part, value, 'from', 'Start position for this part', '', {
      schema: yup.number(),
      allowOnlyValidChange: false,
    } );
    makeObservable( this, {
      notAvailable: computed,
    } );
    this.disabled = true;
  }
  get notAvailable(): boolean {
    return false;
  }
}

class PartEnd extends PartBase<number, number | string> {
  constructor( part: PartLike, value = 1 ) {
    super(
      part,
      value,
      'to',
      'Ending position (inclusive) for this part',
      'Ending position (inclusive) for this part',
      {
        schema: yup.number().test( {
          name: 'part-end',
          message: () => `Must be in interval [${this.min}, ${this.max}]`,
          test: ( value ) => {
            return value >= this.min && value <= this.max;
          },
        } ),
        allowOnlyValidChange: false,
      },
    );
    makeObservable( this, {
      min: computed,
      max: computed,
      notAvailable: computed,
    } );
  }
  get min(): number {
    return (
      this.part.start.value + ( this.part.codon.value === CODON_NONE
        ? 0
        : 2 )
    );
  }
  get max(): number {
    return this.alignment.length;
  }
  get notAvailable(): boolean {
    return false;
  }
}

class PartCodon extends PartBase<string> {
  constructor( part: PartLike, value = 'None' ) {
    super( part, value, 'Codon model', '', '', {
      schema: yup.string(),
      allowOnlyValidChange: true,
    } );
    makeObservable( this, {
      notAvailable: computed,
    } );
  }
  options = CodonModels.map( ( value ) => ( { value, title: value } ) );
  get notAvailable(): boolean {
    return this.alignment.partition.partToAdd.type.value !== 'DNA';
  }
}

export { PartType, PartAAType, PartName, PartStart, PartEnd, PartCodon };
