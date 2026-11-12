const sepOf = ( filePath ) => ( filePath.includes( '\\' )
  ? '\\'
  : '/' );

const stemOf = ( baseName ) => {
  const dot = baseName.lastIndexOf( '.' );
  return dot > 0
    ? baseName.slice( 0, dot )
    : baseName;
};

const parsed = ( filePath ) => {
  const sep = sepOf( filePath );
  const chunks = filePath.split( /[/\\]/ );
  const baseName = chunks.pop();
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

export const base = ( filePath ) => parsed( filePath ).base;
export const basename = base;
export const name = ( filePath ) => parsed( filePath ).name;
export const dir = ( filePath ) => parsed( filePath ).dir;

// shortcut: does not resolve . or .., upgrade when a caller passes them
export const join = ( ...parts ) => {
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

export const quote = ( dir, { windows } ) => ( windows
  ? `"${dir}"`
  : dir );
