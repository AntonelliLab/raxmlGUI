const sepOf = ( filePath: string ): string => ( filePath.includes( '\\' )
  ? '\\'
  : '/' );

const stemOf = ( baseName: string ): string => {
  const dot = baseName.lastIndexOf( '.' );
  return dot > 0
    ? baseName.slice( 0, dot )
    : baseName;
};

const parsed = ( filePath: string ): { base: string; name: string; dir: string } => {
  const sep = sepOf( filePath );
  const chunks = filePath.split( /[/\\]/ );
  // split() always returns at least one chunk, so pop() never yields undefined.
  const baseName = chunks.pop() ?? '';
  let directory = '';
  if ( chunks.length === 1 && chunks[0] === '' ) {
    directory = sep;
  } else if ( chunks[0] === '' && chunks[1] === '' ) {
    const rest = chunks.slice( 2 );
    directory = sep + sep + rest.join( sep );
    if ( rest.length === 2 ) {
      directory += sep;
    }
  } else if ( chunks[0] === '' ) {
    directory = sep + chunks.slice( 1 ).join( sep );
  } else if ( chunks.length > 0 ) {
    directory = chunks.join( sep );
  }
  if ( /^[A-Za-z]:$/.test( directory ) ) {
    directory += sep;
  }
  return {
    base: baseName,
    name: stemOf( baseName ),
    dir: directory,
  };
};

export const base = ( filePath: string ): string => parsed( filePath ).base;
export const basename: typeof base = base;
export const name = ( filePath: string ): string => parsed( filePath ).name;
export const dir = ( filePath: string ): string => parsed( filePath ).dir;

export const join = ( ...parts: string[] ): string => {
  const present = parts.filter( ( part ) => part !== '' );
  if ( present.length === 0 ) {
    return '.';
  }
  const sep = present.some( ( part ) => part.includes( '\\' ) )
    ? '\\'
    : '/';
  const joined = present.join( sep ).replace( /[/\\]+/g, sep );
  return sep === '\\' && present[0].startsWith( '\\\\' )
    ? `\\${joined}`
    : joined;
};

export const quote = ( dir: string, { windows }: { windows: boolean } ): string => ( windows
  ? `"${dir}"`
  : dir );
