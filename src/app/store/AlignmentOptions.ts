import { computed, makeObservable, override } from 'mobx';
import { ValidationError } from 'yup';

import Option from './Option';
import * as raxmlNgSettings from '../../settings/raxmlng';

const raxmlNgModelOptions = raxmlNgSettings.modelOptions;

interface Choice {
  value: string;
  title: string;
}

interface RunLike {
  haveAlignments: boolean;
  usesRaxmlNg: boolean;
}

interface AlignmentLike {
  run: RunLike;
  dataType: string | undefined;
  hasInvariantSites: boolean;
  multistateNumber: { value: string };
}

class RaxmlNgAlignmentSubstitutionModel extends Option<string, RunLike> {
  alignment: AlignmentLike;
  constructor( alignment: AlignmentLike ) {
    super( alignment.run, '', 'Substitution model' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
    } );
    this.alignment = alignment;
  }
  get options(): Choice[] {
    if ( !this.alignment.run.haveAlignments || this.alignment.dataType === undefined ) {
      return [];
    }
    const modelSettings = ( raxmlNgModelOptions as Record<string, { options: readonly string[] }> )[this.alignment.dataType];
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable(): boolean {
    return !this.alignment.run.haveAlignments;
  }
  get cmdValue(): string {
    let model = this.value;
    if ( this.alignment.dataType === 'multistate' ) {
      model = model.replace( 'x', this.alignment.multistateNumber.value );
    }
    return model;
  }
}

class RaxmlNgModelExtraParam extends Option<string, RunLike> {
  alignment: AlignmentLike;
  optionsSource: Choice[];
  addNone: boolean;
  constructor(
    alignment: AlignmentLike,
    label: string,
    options: Choice[],
    { addNone = true }: { addNone?: boolean } = {},
  ) {
    super( alignment.run, addNone
      ? '<none>'
      : options[0].value, label );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
    } );
    this.alignment = alignment;
    this.optionsSource = addNone
      ? [{ value: '<none>', title: 'none' }, ...options]
      : options;
    this.addNone = addNone;
  }
  get options(): Choice[] {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    return this.optionsSource;
  }
  get notAvailable(): boolean {
    return !this.run.haveAlignments || !this.run.usesRaxmlNg;
  }
  get cmdValue(): string {
    return this.value === '<none>'
      ? ''
      : this.value;
  }
}

class RaxmlNgModelF extends RaxmlNgModelExtraParam {
  constructor( alignment: AlignmentLike ) {
    super(
      alignment,
      'Stationary frequencies',
      raxmlNgSettings.stationaryFrequenciesOptions.options.map(
        ( { value, label: title } ) => ( { value, title } ),
      ),
    );
  }
}

class RaxmlNgModelI extends RaxmlNgModelExtraParam {
  constructor( alignment: AlignmentLike ) {
    super(
      alignment,
      'Proportion of invariant sites',
      raxmlNgSettings.proportionOfInvariantSitesOptions.options.map(
        ( { value, label: title } ) => ( { value, title } ),
      ),
    );
  }
}

class RaxmlNgModelG extends RaxmlNgModelExtraParam {
  constructor( alignment: AlignmentLike ) {
    super(
      alignment,
      'Rate heterogeneity',
      raxmlNgSettings.amongsiteRateHeterogeneityModelOptions.options.map(
        ( { value, label: title } ) => ( { value, title } ),
      ),
    );
  }
}

class RaxmlNgModelASC extends RaxmlNgModelExtraParam {
  constructor( alignment: AlignmentLike ) {
    super(
      alignment,
      'Ascertainment bias',
      [
        { value: '<none>', label: 'No correction' },
        ...raxmlNgSettings.ascertainmentBiasCorrectionOptions.options,
      ].map( ( { value, label: title } ) => ( { value, title } ) ),
      { addNone: false },
    );
    makeObservable( this, {
      notAvailable: override,
    } );
  }
  get notAvailable(): boolean {
    return (
      !this.run.haveAlignments ||
      !this.run.usesRaxmlNg ||
      this.alignment.hasInvariantSites
    );
  }
}

class MultistateNumber extends Option<string, RunLike> {
  alignment: AlignmentLike;
  placeholder: string;
  constructor( alignment: AlignmentLike ) {
    super( alignment.run, '', 'Number of states' );
    makeObservable( this, {
      notAvailable: computed,
      error: override,
    } );
    this.alignment = alignment;
    this.placeholder = 'Integer';
  }
  get notAvailable(): boolean {
    return (
      this.alignment.dataType !== 'multistate' ||
      !this.alignment.run.usesRaxmlNg
    );
  }
  get error(): ValidationError | null {
    return !this.value || !Number.isInteger( Number( this.value ) )
      ? new ValidationError( 'Enter an integer number of states' )
      : null;
  }
}

export {
  RaxmlNgAlignmentSubstitutionModel,
  RaxmlNgModelF,
  RaxmlNgModelI,
  RaxmlNgModelG,
  RaxmlNgModelASC,
  MultistateNumber,
};
