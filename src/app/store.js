import { decorate, observable, computed, action, runInAction, toJS } from 'mobx';
import ipcRenderer from '../app/ipcRenderer';
import parsePath from 'parse-filepath';
import cpus from 'cpus';
import { range } from 'd3-array';

import {
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
} from '../constants/ipc';

export const runTypeNames = [
  'Fast tree search',
  'ML search',
  'ML + rapid bootstrap',
  'ML + thorough bootstrap',
  'Bootstrap + consensus',
  'Ancestral states',
  'Pairwise distance',
  'RELL bootstrap'
];

export const MAX_NUM_CPUS = cpus().length;

class Alignment {
  path = '';
  name = '';
  size = 0;
  dataType = undefined;
  fileFormat = undefined;
  length = 0;
  numberSequences = 0;
  parsingComplete = false;
  typecheckingComplete = false;
  checkRunComplete = false;
  checkRunData = '';
  checkRunSuccess = false;
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
    ipcRenderer.on('outDir', this.onOutDir);
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
    ipcRenderer.send('open-dir');
  };

  openAlignmentFile = () => {
    ipcRenderer.send('open-item', this.path);
  };

  openOutDir = () => {
    ipcRenderer.send('open-item', this.outDir);
  };

  onFile = (event, data) => {
    console.log('file:', data);
    runInAction('file', () => {
      this.path = data.filename;
      this.size = data.size;
      this.outDir = parsePath(data.filename).dir;
    });
  };

  // TODO: this does not belong here
  onOutDir = (event, data) => {
    console.log('outDir:', data);
    runInAction('outDir', () => {
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
});

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
  };

  loadAlignmentFiles = () => {
    ipcRenderer.send(ALIGNMENT_SELECT_IPC);
  };

  addAlignments = alignments => {
    alignments.map(alignment => this.addAlignment(alignment));
    // Send alignments to main process for processing
    ipcRenderer.send(ALIGNMENTS_ADDED_IPC, alignments);
  };

  addAlignment = alignment => {
    console.log('addAlignment...');
    this.alignments = {
      ...this.alignments,
      [alignment.path]: new Alignment(alignment)
    };
  };

  removeAlignment = alignment => {
    delete this.alignments[alignment.path];
  };

  removeAllAlignments = () => {
    this.alignments = {};
  };
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
    this.outFilename = parent.input.name ? `${parent.input.name}${id}.tre` : '';
    this.listen();
  }

  id = 0;

  //@observable
  analysisType = 'ML+BS';
  argsList = [];
  code = undefined;
  createdAt = undefined;
  data = '';
  dataType = undefined;
  flagsrunCode = undefined;
  flagsrunData = undefined;
  globalArgs = {};
  inFile = undefined;
  inFileFolder = undefined;
  isPartitioned = false;
  outFilename = '';
  partitionFile = undefined;
  partitions = undefined;
  path = undefined;
  sequences = [];
  calculationComplete = false;
  isCalculating = false;
  combineOutput = false;

  raxmlBinary = 'raxmlHPC-PTHREADS-SSE3-Mac';
  stdout = '';
  outSubDir = '';

  //@computed
  get startRunDisabled() {
    return false;
    return !this.parent.input.ok;
  }

  get outDir() {
    return this.parent.input.outDir;
  }

  get cpuOptions() {
    // TODO: Daniel why start at 2 here?
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
      this.outFilename,
      '-w',
      // this.outDir,
      this.parent.input.outDir
    ];
  }

  proposeRun = () => {
    // Send alignments to main process
    console.log('proposeRun', this.parent.alignments.alignments);
    ipcRenderer.send(RUN_PROPOSED_IPC, toJS(this.parent.alignments.alignments));
  };

  startRun = () => {
    // Send runs to main process
    ipcRenderer.send(RUN_START_IPC, this);
    // TODO: listen to the results
  };

  cancelRun = () => {
    this.isCalculating = false;
    // Send runs to main process
    ipcRenderer.send(CALCULATION_CANCEL_IPC, toJS(this));
  };

  //@action
  // TODO: this is the previous version of doing it, just replace the entire run object
  // must be better way here, only change the relevant params
  updateRun = run => {
    console.log('updateRun:', run);
    for (var key in run) {
      if (run.hasOwnProperty(key)) {
        console.log(key);
        console.log(run[key]);
        if (key === 'sequences') {
          this.sequences = [run[key]];
        } else {
          this[key] = run[key];
        }
      }
    }
  };

  setGlobalArgs = value => {
    console.log('setGlobalArgs:', value);
    this.globalArgs = value;
  };

  setArgsList = value => {
    console.log('setArgsList:', value);
    this.argsList = value;
  };

  setAnalysisType = value => {
    console.log('setAnalysisType:', value);
    this.analysisType = value;
  };

  setCombineOutput = value => {
    console.log('setCombineOutput:', value);
    this.combineOutput = value;
  };

  // Open system dialog to choose file
  loadTreeFile = () => {
    ipcRenderer.send(FILE_SELECT_IPC, toJS(this));
  };

  setOutFilename = name => {
    this.outFilename = name;
  };

  selectWorkingDirectory = () => {
    ipcRenderer.send(FOLDER_SELECT_IPC, toJS(this));
  };

  clearStdout = () => {
    this.stdout = '';
  };

  removeRun = () => {
    this.cancelRun();
    this.parent.deleteRun(this);
  };

  // TODO: this maybe needed in a different store class as well, i.e. alignment ?
  showInFolder = outputPath => {
    ipcRenderer.send(FOLDER_OPEN_IPC, outputPath);
  };

  testStdout = () => {
    this.stdout += this.stdout.length + '\n';
  };

  listen = () => {
    // Receive tree file path
    ipcRenderer.on(FILE_SELECTED_IPC, (event, path) => {
      const argsListTree = this.argsList.map(args =>
        Object.assign({}, args, this.globalArgs, { t: path })
      );
      this.setArgsList(argsListTree);
    });

    // Receive updated run with selected working directory
    ipcRenderer.on(FOLDER_SELECTED_IPC, (event, updatedRun) => {
      // TODO: change
      this.updateRun(updatedRun);
    });

    // TODO: listen to calculation progress
    // TODO: do this differently, i.e. does not need to entirely override the run object here only partially

    // Receive collated run data and files
    ipcRenderer.on(RUN_CREATED_IPC, (event, createdRuns) => {
      this.updateRun(createdRuns[0]);
    });

    // Receive a progress update for one of the runs being calculated
    ipcRenderer.on(FLAGSRUN_PROGRESS_IPC, (event, { run, XXXProgressUnit }) => {
      console.log(run, XXXProgressUnit);
      this.updateRun(run);
    });

    // Receive update that one run has completed flagsrun
    ipcRenderer.on(FLAGSRUN_END_IPC, (event, { run }) => {
      this.updateRun(run);
    });

    // Receive update that the flagsrun of one run has failed
    ipcRenderer.on(FLAGSRUN_ERROR_IPC, (event, { run, error }) => {
      console.log(run, error);
      this.updateRun(run);
    });

    // Receive a call that one run has started being calculated
    ipcRenderer.on(CALCULATION_START_IPC, (event, { run }) => {
      console.log('CLient received calculation start for: ', run);
      this.updateRun(run);
    });

    // Receive a progress update for one of the runs being calculated
    ipcRenderer.on(
      CALCULATION_PROGRESS_IPC,
      (event, { run, XXXProgressUnit }) => {
        console.log(run, XXXProgressUnit);
        this.updateRun(run);
        this.onStdout(event, run);
      }
    );

    // Receive update that one run has completed calculation
    ipcRenderer.on(CALCULATION_END_IPC, (event, { run }) => {
      this.updateRun(run);
    });

    // Receive update that the calculation of one run has failed
    ipcRenderer.on(CALCULATION_ERROR_IPC, (event, { run, error }) => {
      console.log(run, error);
      this.updateRun(run);
    });

    // Receive update that one run has been canceled
    ipcRenderer.on(CALCULATION_CANCELED_IPC, (event, { run }) => {
      this.updateRun(run);
    });

    //TODO: Define callbacks on the class and remove event listeners on dispose
    ipcRenderer.on('file', this.onFile);
    ipcRenderer.on('raxml-output', this.onStdout);
    ipcRenderer.on('raxml-close', (event, data) => {
      const { id, code } = data;
      console.log(`RAxML process for run ${id} closed with code ${code}`);
      if (id === this.id) {
        runInAction('raxml-close', () => {
          this.isCalculating = false;
        });
      }
    });
  };

  onFile = (event, data) => {
    this.outFilename = `${parsePath(data.filename).name}_${this.id}`;
  };

  onStdout = (event, run) => {
    const { id, data } = run;
    console.log(
      'Raxml output:',
      data,
      'this.id:',
      this.id,
      'is this?',
      id === this.id
    );
    if (id === this.id) {
      runInAction('raxml-output', () => {
        const stdout = data.replace(
          `Warning, you specified a working directory via "-w"\nKeep in mind that RAxML only accepts absolute path names, not relative ones!`,
          ''
        );
        this.stdout += stdout;
      });
    }
  };
}

decorate(Run, {
  analysisType: observable,
  argsList: observable,
  code: observable,
  createdAt: observable,
  data: observable,
  dataType: observable,
  flagsrunCode: observable,
  flagsrunData: observable,
  globalArgs: observable,
  inFile: observable,
  inFileFolder: observable,
  isPartitioned: observable,
  outFilename: observable,
  partitionFile: observable,
  partitions: observable,
  path: observable,
  sequences: observable,
  calculationComplete: observable,
  isCalculating: observable,
  combineOutput: observable,
  // Daniel
  raxmlBinary: observable,
  stdout: observable,
  outSubDir: observable,
  //
  startRunDisabled: computed,
  outDir: computed,
  args: computed,
  //
  setAnalysisType: action,
  setCombineOutput: action,
  loadTreeFile: action,
  setOutName: action,
  clearStdout: action,
  showInFolder: action,
  removeRun: action,
  startRun: action
});

class RunList {
  runs = [];
  activeIndex = 0;
  // TODO: replace with alignment field
  input = new Alignment({});
  alignments = new Alignments();

  constructor() {
    this.addRun();
  }

  get activeRun() {
    return this.runs[this.activeIndex];
  }

  addRun = () => {
    console.log('addRun...');
    let maxId = 0;
    this.runs.forEach(run => (maxId = Math.max(run.id, maxId)));
    this.runs.push(new Run(this, maxId + 1));
    this.activeIndex = this.runs.length - 1;
  };

  deleteRun = run => {
    const runIndex = this.runs.findIndex(m => m.id === run.id);
    this.runs.splice(runIndex, 1);
    if (this.runs.length === 0) {
      this.runs.push(new Run(this, 1));
    }
    this.activeIndex = Math.min(this.runs.length - 1, this.activeIndex);
  };

  setActive = index => {
    this.activeIndex = index;
  };

  deleteActive = () => {
    this.deleteRun(this.activeRun);
  };
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
  testStdout: action
});

const store = new RunList();

export default store;
