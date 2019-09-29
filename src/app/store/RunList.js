import { observable, computed, action } from 'mobx';
import Run from './Run';

class RunList {
  @observable runs = [];
  @observable activeIndex = 0;

  constructor() {
    this.addRun();
  }

  @computed
  get activeRun() {
    return this.runs[this.activeIndex];
  }

  @action
  addRun = () => {
    let maxId = 0;
    this.runs.forEach(run => (maxId = Math.max(run.id, maxId)));
    this.runs.push(new Run(this, maxId + 1));
    this.activeIndex = this.runs.length - 1;
  };

  @action
  deleteRun = run => {
    run.dispose();
    const runIndex = this.runs.findIndex(m => m.id === run.id);
    this.runs.splice(runIndex, 1);
    if (this.runs.length === 0) {
      this.runs.push(new Run(this, 1));
    }
    this.activeIndex = Math.min(this.runs.length - 1, this.activeIndex);
  };

  @action
  setActive = index => {
    this.activeIndex = index;
  };

  @action
  deleteActive = () => {
    this.deleteRun(this.activeRun);
  };

  generateReport = ({ maxStdoutLength = 200 } = {}) => {
    return this.activeRun.generateReport({ maxStdoutLength });
  }
}

export default RunList;
