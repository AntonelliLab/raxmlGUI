import { decorate, observable, computed, action, runInAction } from "mobx"
import _ from "lodash";
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

export const runTypeNames = [
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
  path = "";
  name = "";
  size = 0;
  dataType = undefined;
  fileFormat = undefined;
  length = 0;
  numberSequences = 0;
  parsingComplete = false;
  typecheckingComplete = false;
  checkRunComplete = false;
  checkRunData = "";
  checkRunSuccess = false;
  sequences = undefined;

  // TODO: this does not belong here
  outDir = "";

  //@computed
  get ok() {
    return this.path !== "";
  }

  get dir() {
    return parsePath(this.path).dir;
  }

  get base() {
    return parsePath(this.path).base;
  }

  get filename() {
    return parsePath(this.path).name;
  }

  constructor(alignment) {
    this.listen();
    console.log("alignment constructor", alignment);
    this.updateAlignment(alignment);
  }

  updateAlignment = alignment => {
    console.log("updateAlignment", alignment);
    for (var key in alignment) {
      if (alignment.hasOwnProperty(key)) {
        console.log(key);
        console.log(alignment[key]);
        if (key === "sequences") {
          this.sequences = [alignment[key]];
        } else {
          this[key] = alignment[key];
        }
      }
    }
  };

  listen = () => {
    ipcRenderer.on("outDir", this.onOutDir);
    // Listener taken from processAlignments()
    // Receive a progress update for one of the alignments being parsed
    ipcRenderer.on(
      PARSING_PROGRESS_IPC,
      (event, { alignment, numberSequencesParsed }) => {
        if (alignment.path === this.path) {
          this.updateAlignment({ ...alignment, numberSequencesParsed })
        };
      }
    );

    // Receive update that one alignment has completed parsing
    ipcRenderer.on(PARSING_END_IPC, (event, { alignment }) => {
      if (alignment.path === this.path) {
        this.updateAlignment({ ...alignment })
      };
    });

    // Receive update that the parsing of one alignment has failed
    ipcRenderer.on(PARSING_ERROR_IPC, (event, { alignment, error }) => {
      if (alignment.path === this.path) {
        this.updateAlignment({ ...alignment, error });
      };
    });

    // Receive a progress update for one of the alignments being typechecked
    ipcRenderer.on(
      TYPECHECKING_PROGRESS_IPC,
      (event, { alignment, numberSequencesTypechecked }) => {
        if (alignment.path === this.path) {
          this.updateAlignment({ ...alignment, numberSequencesTypechecked });
        };
      }
    );

    // Receive update that one alignment has completed typechecking
    ipcRenderer.on(TYPECHECKING_END_IPC, (event, { alignment }) => {
      if (alignment.path === this.path) {
        this.updateAlignment({ ...alignment });
      };
    });

    // Receive update that the typechecking of one alignment has failed
    ipcRenderer.on(TYPECHECKING_ERROR_IPC, (event, { alignment, error }) => {
      if (alignment.path === this.path) {
        this.updateAlignment({ ...alignment, error });
      };
    });

    // Receive update that one alignment has completed the checkrun
    ipcRenderer.on(CHECKRUN_END_IPC, (event, { alignment }) => {
      if (alignment.path === this.path) {
        this.updateAlignment({ ...alignment });
      };
    });

    // Receive update that the checkrun of one alignment has failed
    ipcRenderer.on(CHECKRUN_ERROR_IPC, (event, { alignment, error }) => {
      if (alignment.path === this.path) {
        this.updateAlignment({ ...alignment, error });
      };
    });
  };

  selectOutDir = () => {
    ipcRenderer.send("open-dir");
  };

  openAlignmentFile = () => {
    ipcRenderer.send("open-item", this.path);
  };

  openOutDir = () => {
    ipcRenderer.send("open-item", this.outDir);
  };

  onFile = (event, data) => {
    console.log("file:", data);
    runInAction("file", () => {
      this.path = data.filename;
      this.size = data.size;
      this.outDir = parsePath(data.filename).dir;
    });
  };

  // TODO: this does not belong here
  onOutDir = (event, data) => {
    console.log("outDir:", data);
    runInAction("outDir", () => {
      this.outDir = data;
    });
  };
}

decorate(Alignment, {
  path: observable,
  name: observable,
  size: observable,
  outDir: observable,
  fileFormat: observable,
  length: observable,
  numberSequences: observable,
  parsingComplete: observable,
  typecheckingComplete: observable,
  checkRunComplete: observable,
  checkRunData: observable,
  checkRunSuccess: observable,
  sequences: observable,
  ok: computed,
  dir: computed,
  base: computed,
  filename: computed,
})

class Alignments {
  alignments = {};

  constructor() {
    this.listen();
  }

  listen = () => {
    // Listen to alignments being added
    ipcRenderer.on(ALIGNMENT_SELECTED_IPC, (event, data) => {
      this.addAlignments(data);
    });
  }

  loadAlignmentFiles = () => {
    ipcRenderer.send(ALIGNMENT_SELECT_IPC);
  };

  addAlignments = (alignments) => {
    alignments.map(alignment => this.addAlignment(alignment));
    // Send alignments to main process for processing
    ipcRenderer.send(ALIGNMENTS_ADDED_IPC, alignments);
  }

  addAlignment = (alignment) => {
    console.log("addAlignment...");
    this.alignments = {
      ...this.alignments,
      [alignment.path]: new Alignment(alignment)
    };
  }

  removeAlignment = (alignment) => {
    delete this.alignments[alignment.path];
  }

  removeAllAlignments = () => {
    this.alignments = {};
  }
}

decorate(Alignments, {
  alignments: observable,
  addAlignments: action,
  addAlignment: action,
  deleteAlignment: action
});

class Run {
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
    return runTypeNames[this.type];
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
    this.parent.deleteRun(this);
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
      console.log(`RAxML process for run ${id} closed with code ${code}`);
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

decorate(Run, {
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

class RunList {
  runs = [];
  activeIndex = 0;
  // TODO: replace with alignment field
  input = new Alignment({});
  alignments = new Alignments();

  constructor() {
    this.addRun();

    ipcRenderer.on('filename', (event, filename) => {
      this.reset();
    });
  }

  get activeRun() {
    return this.runs[this.activeIndex];
  }

  reset = () => {
    console.log('TODO: Reset runs on new file...');
  }

  addRun = () => {
    console.log('addRun...');
    let maxId = 0;
    this.runs.forEach(run => maxId = Math.max(run.id, maxId));
    this.runs.push(new Run(this, maxId + 1));
    this.activeIndex = this.runs.length - 1;
  }
  
  deleteRun = (run) => {
    const runIndex = this.runs.findIndex((m => m.id === run.id));
    this.runs.splice(runIndex, 1);
    // run.dispose();
    if (this.runs.length === 0) {
      this.runs.push(new Run(this, 1));
    }
    this.activeIndex = Math.min(this.runs.length - 1, this.activeIndex);
  }

  setActive = (index) => {
    this.activeIndex = index;
  }

  deleteActive = () => {
    this.deleteRun(this.activeRun);
  }
}

decorate(RunList, {
  runs: observable,
  activeIndex: observable,
  input: observable,
  activeRun: computed,
  addRun: action,
  deleteRun: action,
  setActive: action,
  deleteActive: action,
  testStdout: action,
})

const store = new RunList();

export default store;