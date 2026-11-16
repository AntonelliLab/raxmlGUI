import { observable, computed, action, makeObservable } from 'mobx';
import { mixed } from 'yup';

class Option {
  /**
   * Reactive option with optional validation
   * @param {Object} run
   * @param {*} defaultValue
   * @param {String} title
   * @param {String} description
   * @param {String} hoverInfo
   * @param {yup|undefined} schema
   */
  constructor(
    run,
    defaultValue,
    title,
    description,
    hoverInfo,
    { schema = undefined, allowOnlyValidChange = false, helperText = '' } = {},
  ) {
    makeObservable( this, {
      value: observable,
      setValue: action,
      reset: action,
      isDefault: computed,
      error: computed,
      haveError: computed,
      errorMessage: computed,
    } );
    this.run = run;
    this.defaultValue = defaultValue;
    this.title = title;
    this.description = description;
    this.hoverInfo = hoverInfo;
    this.schema = schema
      ? schema
      : mixed();
    this.allowOnlyValidChange = allowOnlyValidChange;
    this.helperText = helperText;
    this.value = defaultValue;
  }
  value;
  setValue( value ) {
    const isValid = this.schema.isValidSync( value );
    if ( !this.allowOnlyValidChange || isValid ) {
      this.value = isValid
        ? this.schema.cast( value )
        : value;
    }
  }
  reset() {
    this.value = this.defaultValue;
  }
  get isDefault() {
    return this.value === this.defaultValue;
  }
  get error() {
    try {
      this.schema.validateSync( this.value );
      return null;
    } catch ( err ) {
      return err;
    }
  }
  get haveError() {
    return this.error !== null;
  }
  get errorMessage() {
    return this.haveError
      ? this.error.message
      : '';
  }
}

export { Option as default };
