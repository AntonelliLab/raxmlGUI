import { computed, makeObservable, override } from 'mobx';

import Option from './Option';
import * as raxmlNgSettings from '../../settings/raxmlng';

const raxmlNgModelOptions = raxmlNgSettings.modelOptions;

class RaxmlNgAlignmentSubstitutionModel extends Option {
  constructor( alignment ) {
    super( alignment.run, '', 'Substitution model' );
    makeObservable( this, {
      options: computed,
      notAvailable: computed,
      cmdValue: computed,
    } );
    this.alignment = alignment;
  }
  get options() {
    if ( !this.alignment.run.haveAlignments ) {
      return [];
    }
    const modelSettings = raxmlNgModelOptions[this.alignment.dataType];
    if ( !modelSettings ) {
      return [];
    }
    return modelSettings.options.map( ( value ) => ( { value, title: value } ) );
  }
  get notAvailable() {
    return !this.alignment.run.haveAlignments;
  }
  get cmdValue() {
    let model = this.value;
    if ( this.alignment.dataType === 'multistate' ) {
      model = model.replace( 'x', this.alignment.multistateNumber.value );
    }
    return model;
  }
}

class RaxmlNgModelExtraParam extends Option {
  constructor( alignment, label, options, { addNone = true } = {} ) {
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
  get options() {
    if ( !this.run.haveAlignments ) {
      return [];
    }
    return this.optionsSource;
  }
  get notAvailable() {
    return !this.run.haveAlignments || !this.run.usesRaxmlNg;
  }
  get cmdValue() {
    return this.value === '<none>'
      ? ''
      : this.value;
  }
}

class RaxmlNgModelF extends RaxmlNgModelExtraParam {
  constructor( alignment ) {
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
  constructor( alignment ) {
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
  constructor( alignment ) {
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
  constructor( alignment ) {
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
  get notAvailable() {
    return (
      !this.run.haveAlignments ||
      !this.run.usesRaxmlNg ||
      this.alignment.hasInvariantSites
    );
  }
}

class MultistateNumber extends Option {
  constructor( alignment ) {
    super( alignment.run, '', 'Number of states' );
    makeObservable( this, {
      notAvailable: computed,
      error: override,
    } );
    this.alignment = alignment;
    this.placeholder = 'Integer';
  }
  get notAvailable() {
    return (
      this.alignment.dataType !== 'multistate' ||
      !this.alignment.run.usesRaxmlNg
    );
  }
  get error() {
    return !this.value || !Number.isInteger( Number( this.value ) );
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
