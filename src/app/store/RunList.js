import { observable, computed, action } from 'mobx';
import Run from './Run';
import * as ipc from '../../constants/ipc';
import AppStore from './AppStore';

class RunList extends AppStore {
  @observable runs = [];
  @observable activeIndex = 0;

  constructor() {
    super();
    this.addRun();
    this.listen();
  }

  @observable error = null;
  @action
  clearError = () => {
    this.error = null;
  };

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

  @action
  onError = (event, { error }) => {
    console.log(`Unhandled error:`, error);
    this.error = error;
  };

  @action
  onBackboneConstraint = (event, params) => {
    this.activeRun.useBackboneConstraint = !this.activeRun.useBackboneConstraint;
  };

  @action
  onMultifurcatingConstraint = (event, params) => {
    this.activeRun.useMultifurcatingConstraint = !this.activeRun.useMultifurcatingConstraint;
  };

  listen = () => {
    this.listenTo(ipc.UNHANDLED_ERROR, this.onError);
    this.listenTo(ipc.ADD_RUN, this.addRun);
    this.listenTo(ipc.REMOVE_RUN, this.deleteActive);
    this.listenTo(ipc.TOGGLE_BACKBONE_CONSTRAINT, this.onBackboneConstraint);
    this.listenTo(ipc.TOGGLE_MULTIFURCATING_CONSTRAINT, this.onMultifurcatingConstraint);
  }

  generateReport = ({ maxStdoutLength = 200 } = {}) => {
    return this.activeRun.generateReport({ maxStdoutLength });
  }
}

export default RunList;
