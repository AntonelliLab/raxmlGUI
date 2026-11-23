export default class UserFixError extends Error {
  isUserFix: boolean;

  constructor( message: string ) {
    super( message );
    this.isUserFix = true;
    this.name = 'UserFixError';
  }
}

// ipcRenderer.invoke rejects with `Error invoking remote method '<channel>': UserFixError: <message>`, dropping isUserFix.
export function restoreUserFixError( error: unknown ): unknown {
  const message = ( error as { message?: unknown } | null )?.message;
  const match = typeof message === 'string' && /UserFixError: ([\s\S]*)$/.exec( message );
  return match
    ? new UserFixError( match[1] )
    : error;
}
