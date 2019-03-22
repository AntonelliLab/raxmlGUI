import { decorate, observable, computed, action, runInAction } from "mobx"
import ipcRenderer from '../app/ipcRenderer';
import parsePath from 'parse-filepath';
import cpus from 'cpus';
import { range } from 'd3-array';

import {
  GET_CPUS_IPC,
  CPUS_COUNTED_IPC,
  FOLDER_OPEN_IPC,
  FOLDER_SELECT_IPC,
  FOLDER_SELECTED_IPC,
  FILE_SELECT_IPC,
  FILE_SELECTED_IPC,
  ALIGNMENT_SELECT_IPC,
  ALIGNMENT_SELECTED_IPC,
  ALIGNMENTS_ADDED_IPC,
  PARSING_PROGRESS_IPC,
  PARSING_END_IPC,
  PARSING_ERROR_IPC,
  TYPECHECKING_PROGRESS_IPC,
  TYPECHECKING_END_IPC,
  TYPECHECKING_ERROR_IPC,
  CHECKRUN_END_IPC,
  CHECKRUN_ERROR_IPC,
  PARSING_START_IPC,
  TYPECHECKING_START_IPC,
  CHECKRUN_START_IPC,
  RUN_PROPOSED_IPC,
  RUN_CREATED_IPC,
  FLAGSRUN_PROGRESS_IPC,
  FLAGSRUN_END_IPC,
  FLAGSRUN_ERROR_IPC,
  CALCULATION_START_IPC,
  CALCULATION_PROGRESS_IPC,
  CALCULATION_END_IPC,
  CALCULATION_ERROR_IPC,
  RUN_START_IPC,
  CALCULATION_CANCEL_IPC,
  CALCULATION_CANCELED_IPC
} from "../constants/ipc";

export const modelTypeNames = [
  'Fast tree search',
  'ML search',
  'ML + rapid bootstrap',
  'ML + thorough bootstrap',
  'Bootstrap + consensus',
  'Ancestral states',
  'Pairwise distance',
  'RELL bootstrap',
];

export const MAX_NUM_CPUS = cpus().length;

class Alignment {
  path = '';
  size = 0;
  dataType = undefined;
  fileFormat = undefined;
  length = 0;
  numberSequences = 0;
  parsingComplete = false;
  typecheckingComplete = false;
  checkrunComplete = false;
  sequences = undefined;

  // TODO: this does not belong here
  outDir = '';

  //@computed
  get ok() {
    return this.path !== '';
  }

  get dir() {
    return parsePath(this.path).dir;
  }

  get base() {
    return parsePath(this.path).base;
  }

  get name() {
    return parsePath(this.path).name;
  }

  constructor() {
    this.listen();
  }

  listen = () => {
    ipcRenderer.on('file', this.onFile);
    ipcRenderer.on('outDir', this.onOutDir);
  }

  loadAlignmentFiles = () => {
    ipcRenderer.send(ALIGNMENT_SELECT_IPC);
  }

  selectOutDir = () => {
    ipcRenderer.send('open-dir');
  }

  openAlignmentFile = () => {
    ipcRenderer.send('open-item', this.path);
  }
  
  openOutDir = () => {
    ipcRenderer.send('open-item', this.outDir);
  }

  onFile = (event, data) => {
    console.log('file:', data);
    runInAction("file", () => {
      this.path = data.filename;
      this.size = data.size;
      this.outDir = parsePath(data.filename).dir;
    });
  }

  // TODO: this does not belong here
  onOutDir = (event, data) => {
    console.log('outDir:', data);
    runInAction("outDir", () => {
      this.outDir = data;
    });
  }
}

decorate(Alignment, {
  path: observable,
  size: observable,
  outDir: observable,
  ok: computed,
  dir: computed,
  base: computed,
  name: computed,
})

class Model {
  constructor(parent, id) {
    this.parent = parent;
    this.id = id;
    this.outName = parent.input.name ? `${parent.input.name}${id}.tre` : '';
    this.outNamePlaceholder = `${id}.tre`;
    this.listen();
  }

  id = 0;
  
  //@observable
  type = 2;
  raxmlBinary = 'raxmlHPC-PTHREADS-SSE3-Mac';
  running = false;
  numCpu = 2;
  stdout = '';
  outName = '';
  outSubDir = '';

  //@computed
  get typeName() {
    return modelTypeNames[this.type];
  }

  get disabled() {
    return !this.parent.input.ok;
  }

  get outDir() {
    return this.parent.input.outDir;
  }

  get cpuOptions() {
    return range(2, MAX_NUM_CPUS + 1);
  }

  get args() {
    return [
      '-T', //TODO: Only for phread version
      this.numCpu,
      '-f',
      'a',
      '-x',
      '572',
      '-m',
      'GTRGAMMA',
      '-p',
      '820',
      '-N',
      '100',
      '-s',
      this.parent.input.filename,
      '-n',
      this.outName || this.outNamePlaceholder,
      '-w',
      // this.outDir,
      this.parent.input.outDir,
    ];
  }
  

  run = () => {
    this.running = true;
    const { id, args } = this;
    ipcRenderer.send('run', { id, args });
  }
  
  cancel = () => {
    this.running = false;
    ipcRenderer.send('cancel', this.id);
  }

  //@action
  setType = (index) => {
    console.log('setType:', index);
    this.type = index;
  }

  setNumCpu = (count) => {
    console.log('setNumCpu:', count);
    this.numCpu = count;
  }

  setOutName = (name) => {
    this.outName = name;
  }

  clearStdout = () => {
    this.stdout = '';
  }

  delete = () => {
    this.cancel();
    this.parent.deleteModel(this);
  }

  dispose = () => {

  }

  testStdout = () => {
    this.stdout += this.stdout.length + '\n';
  }

  listen = () => {
    //TODO: Define callbacks on the class and remove event listeners on dispose
    ipcRenderer.on('file', this.onFile);
    ipcRenderer.on('raxml-output', this.onStdout);
    ipcRenderer.on('raxml-close', (event, data) => {
      const { id, code } = data;
      console.log(`RAxML process for model ${id} closed with code ${code}`);
      if (id === this.id) {
        runInAction("raxml-close", () => {
          this.running = false;
        });
      }
    });
  }

  onFile = (event, data) => {
    this.outName = `${parsePath(data.filename).name}_${this.id}`;
  }

  onStdout = (event, data) => {
    const { id, content } = data;
    console.log('Raxml output:', data, 'this.id:', this.id, 'is this?', id === this.id);
    if (id === this.id) {
      runInAction("raxml-output", () => {
        const stdout = content.replace(`Warning, you specified a working directory via "-w"\nKeep in mind that RAxML only accepts absolute path names, not relative ones!`, "");
        this.stdout += stdout;
      });
    }
  }
}

decorate(Model, {
  type: observable,
  raxmlBinary: observable,
  running: observable,
  numCpu: observable,
  stdout: observable,
  outName: observable,
  outSubDir: observable,
  typeName: computed,
  disabled: computed,
  outDir: computed,
  args: computed,
  setType: action,
  setNumCpu: action,
  setOutName: action,
  clearStdout: action,
  delete: action,
})

class ModelList {
  models = [];
  activeIndex = 0;
  input = new Alignment();

  constructor() {
    this.addModel();

    ipcRenderer.on('filename', (event, filename) => {
      this.reset();
    });
  }

  get activeModel() {
    return this.models[this.activeIndex];
  }

  reset = () => {
    console.log('TODO: Reset models on new file...');
  }

  addModel = () => {
    console.log('addModel...');
    let maxId = 0;
    this.models.forEach(model => maxId = Math.max(model.id, maxId));
    this.models.push(new Model(this, maxId + 1));
    this.activeIndex = this.models.length - 1;
  }
  
  deleteModel = (model) => {
    const modelIndex = this.models.findIndex((m => m.id === model.id));
    this.models.splice(modelIndex, 1);
    // model.dispose();
    if (this.models.length === 0) {
      this.models.push(new Model(this, 1));
    }
    this.activeIndex = Math.min(this.models.length - 1, this.activeIndex);
  }

  setActive = (index) => {
    this.activeIndex = index;
  }

  deleteActive = () => {
    this.deleteModel(this.activeModel);
  }
}

decorate(ModelList, {
  models: observable,
  activeIndex: observable,
  input: observable,
  activeModel: computed,
  addModel: action,
  deleteModel: action,
  setActive: action,
  deleteActive: action,
  testStdout: action,
})

const store = new ModelList();

export default store;