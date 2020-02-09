import { observable, computed, action } from 'mobx';
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
  constructor(run, defaultValue, title, description, hoverInfo, {
    schema = undefined,
    allowOnlyValidChange = false,
    helperText = '',
  } = {}) {
    this.run = run;
    this.defaultValue = defaultValue;
    this.title = title;
    this.description = description;
    this.hoverInfo = hoverInfo;
    this.schema = schema ? schema : mixed();
    this.allowOnlyValidChange = allowOnlyValidChange;
    this.helperText = helperText;
  }
  @observable value = this.defaultValue;
  @action setValue = (value) => {
    const isValid = this.schema.isValidSync(value);
    if (!this.allowOnlyValidChange || isValid) {
      this.value = isValid ? this.schema.cast(value) : value;
    }
  }
  @action reset() { this.value = this.defaultValue; }
  @computed get isDefault() { return this.value === this.defaultValue; }
  @computed get error() {
    try {
      this.schema.validateSync(this.value);
      return null;
    } catch (err) {
      return err;
    }
  }
  @computed get haveError() { return this.error !== null; }
  @computed get errorMessage() { return this.haveError ? this.error.message : '' }
}

export { Option as default };
