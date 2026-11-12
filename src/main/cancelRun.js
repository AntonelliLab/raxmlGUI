const processes = Object.create( null );

export function trackRun( id, proc ) {
  processes[String( id )] = proc;
}

export function cancelRun( id ) {
  const proc = processes[String( id )];
  if ( !proc ) {
    return;
  }
  proc.cancelled = true;
  delete processes[String( id )];
  proc.kill();
  console.log( `Killed RAxML process ${id}` );
}

export function forgetRun( id ) {
  delete processes[String( id )];
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

export function finishedRun( exitCode, payload ) {
  if ( exitCode === 'SIGTERM' ) {
    return null;
  }
  return payload;
}
