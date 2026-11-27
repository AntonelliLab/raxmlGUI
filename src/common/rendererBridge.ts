// Declared, not derived from the preload: ipc invoke types every result as any.
import type { StateReport } from '../main/getActiveState';
import type RunList from '../app/store/RunList';
import type { ExampleFilesPayload } from '../main/api';
import type { CheckOutputArgs, CheckOutputResult } from '../main/checkOutput';
import type {
  ModelSelectionPayload,
  ModelSelectionSuccessPayload,
  ModelSelectionFailurePayload,
} from '../main/modelSelection';
import type { SelectedAlignment } from '../main/selectAlignment';
import type { SelectedTree } from '../main/selectTree';
import type { SelectedAstralFile } from '../main/selectAstralFile';
import type { AstralPayload, AstralSuccessPayload } from '../main/astral';
import type { RunOutputPayload } from '../main/processHelpers';
import type { StartRunPayload, RunFinishedPayload, RunErrorPayload } from '../main/startRun';
import type { AlignmentParseResult } from '../main/parseAlignment';

export interface HostInfo {
  windows: boolean;
  release: string;
  arch: string;
  cpuModel: string;
}

export type UpdateDownload =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'downloading'; percent: number }
  // a differential download fell back to a full one, so the percent dropped
  | { status: 'restarted'; percent: number }
  | { status: 'done' };

export type UpdateDownloadPayload = UpdateDownload & { id: string };

// An event payload the page does not read yet; the leaf that reads it tightens it.
type Listener = ( payload: unknown ) => void;
type Unsubscribe = () => void;

export interface RendererBridge {
  host: HostInfo;
  provideStateReport: ( fn: () => StateReport ) => void;
  copyText: ( text: string ) => Promise<void>;
  getExampleFiles: () => Promise<ExampleFilesPayload>;
  getVersion: () => Promise<string>;
  getDarkMode: () => Promise<boolean>;
  setDarkMode: ( value: boolean ) => Promise<void>;
  selectAlignment: ( runId: number ) => Promise<SelectedAlignment[] | null>;
  parseAlignment: ( id: string, filePath: string ) => Promise<AlignmentParseResult>;
  selectAstralFile: ( runId: number ) => Promise<SelectedAstralFile | null>;
  selectOutputDir: ( runId: number ) => Promise<string | null>;
  checkOutput: ( args: CheckOutputArgs ) => Promise<CheckOutputResult>;
  readFile: ( filePath: string ) => Promise<string>;
  writeFile: ( filePath: string, text: string ) => Promise<void>;
  reload: () => Promise<void>;
  debugInfo: () => Promise<string>;
  openExternal: ( url: string ) => Promise<void>;
  openPath: ( fullPath: string ) => Promise<string>;
  selectPartitionFile: ( runId: number ) => Promise<string | null>;
  selectTree: ( runId: number, type: string ) => Promise<SelectedTree | null>;
  showItemInFolder: ( fullPath: string ) => Promise<void>;
  startRun: ( payload: StartRunPayload ) => Promise<void>;
  cancelRun: ( id: number ) => Promise<void>;
  onRunStdout: ( listener: ( payload: RunOutputPayload ) => void ) => Unsubscribe;
  onRunStderr: ( listener: ( payload: RunOutputPayload ) => void ) => Unsubscribe;
  onRunFinished: ( listener: ( payload: RunFinishedPayload ) => void ) => Unsubscribe;
  onRunError: ( listener: ( payload: RunErrorPayload ) => void ) => Unsubscribe;
  startAstral: ( payload: AstralPayload ) => Promise<void>;
  onAstralSuccess: ( listener: ( payload: AstralSuccessPayload ) => void ) => Unsubscribe;
  startModelSelection: ( payload: ModelSelectionPayload ) => Promise<void>;
  cancelModelSelection: ( id: string ) => Promise<void>;
  onModelSelectionSuccess: ( listener: ( payload: ModelSelectionSuccessPayload ) => void ) => Unsubscribe;
  onModelSelectionFailure: ( listener: ( payload: ModelSelectionFailurePayload ) => void ) => Unsubscribe;
  onAddRun: ( listener: Listener ) => Unsubscribe;
  onRemoveRun: ( listener: Listener ) => Unsubscribe;
  onLightMode: ( listener: () => void ) => Unsubscribe;
  onDarkMode: ( listener: () => void ) => Unsubscribe;
  onToggleBackboneConstraint: ( listener: Listener ) => Unsubscribe;
  onToggleMultifurcatingConstraint: ( listener: Listener ) => Unsubscribe;
  onUnhandledError: ( listener: Listener ) => Unsubscribe;
  onUpdateDownload: ( listener: ( payload: UpdateDownloadPayload ) => void ) => Unsubscribe;
  getUpdateDownload: () => Promise<UpdateDownload>;
  getPathForFile: ( file: File ) => string;
}

declare global {
  interface Window {
    rendererBridge: RendererBridge;
    store: RunList;
  }
}
