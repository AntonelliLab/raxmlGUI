/** Run number, or alignment composite `${run.id}_${path}`. */
type TrackedId = string | number;

interface TrackedProcess {
  cancelled?: boolean;
  kill: () => void;
}

type RunResult =
  | 'SIGTERM'
  | number
  | NodeJS.Signals
  | null
  | Error;

const processes: Record<string, TrackedProcess> = Object.create( null ) as Record<string, TrackedProcess>;
const generation: Record<string, number> = Object.create( null ) as Record<string, number>;

export function beginRun( id: TrackedId ): number {
  const key = String( id );
  const next = ( generation[key] || 0 ) + 1;
  generation[key] = next;
  return next;
}

export function stillRunning( id: TrackedId, token: number ): boolean {
  return generation[String( id )] === token;
}

export function trackRun( id: TrackedId, proc: TrackedProcess ): void {
  processes[String( id )] = proc;
}

export function stopRun( id: TrackedId ): void {
  const proc = processes[String( id )];
  if ( !proc ) {
    return;
  }
  proc.cancelled = true;
  delete processes[String( id )];
  proc.kill();
  console.log( `Killed RAxML process ${id}` );
}

export function cancelRun( id: TrackedId ): void {
  const key = String( id );
  generation[key] = ( generation[key] || 0 ) + 1;
  stopRun( id );
}

export function forgetRun( id: TrackedId, proc: TrackedProcess ): void {
  const key = String( id );
  if ( processes[key] === proc ) {
    delete processes[key];
  }
}

export function runResult(
  proc: TrackedProcess,
  message: string,
  code: number | null,
  signal: NodeJS.Signals | null,
): RunResult {
  if ( proc.cancelled ) {
    return 'SIGTERM';
  }
  if ( message === 'error' ) {
    return code;
  }
  if ( !code ) {
    return signal || code;
  }
  return new Error( `Exited with code ${signal || code}. Check console output for more information.` );
}

export function finishedRun( exitCode: RunResult ): boolean {
  return exitCode !== 'SIGTERM';
}
