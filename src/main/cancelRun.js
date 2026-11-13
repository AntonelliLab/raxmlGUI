const processes = Object.create( null );
const generation = Object.create( null );

export function beginRun( id ) {
  const key = String( id );
  const next = ( generation[key] || 0 ) + 1;
  generation[key] = next;
  return next;
}

export function stillRunning( id, token ) {
  return generation[String( id )] === token;
}

export function trackRun( id, proc ) {
  processes[String( id )] = proc;
}

export function stopRun( id ) {
  const proc = processes[String( id )];
  if ( !proc ) {
    return;
  }
  proc.cancelled = true;
  delete processes[String( id )];
  proc.kill();
  console.log( `Killed RAxML process ${id}` );
}

export function cancelRun( id ) {
  const key = String( id );
  generation[key] = ( generation[key] || 0 ) + 1;
  stopRun( id );
}

export function forgetRun( id, proc ) {
  const key = String( id );
  if ( processes[key] === proc ) {
    delete processes[key];
  }
}

export function runResult( proc, message, code, signal ) {
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

export function finishedRun( exitCode ) {
  return exitCode !== 'SIGTERM';
}
