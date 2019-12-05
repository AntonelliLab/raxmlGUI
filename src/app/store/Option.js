import { observable, computed, action } from 'mobx';

class Option {
  constructor(run, defaultValue, title, description, hoverInfo) {
    this.run = run;
    this.defaultValue = defaultValue;
    this.title = title;
    this.description = description;
    this.hoverInfo = hoverInfo;
  }
  @observable value = this.defaultValue;
  @action setValue = (value) => { this.value = value; }
  @action reset() { this.value = this.defaultValue; }
  @computed get isDefault() { return this.value === this.defaultValue; }
  @computed get error() { return this.value === null || this.value === undefined || this.value === ''; }
}

export { Option as default };
