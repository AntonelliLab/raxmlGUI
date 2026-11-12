import { createRequire } from 'node:module';
import { contextBridge, ipcRenderer } from 'electron';
import { ALIGNMENT_SELECT, COPY_TEXT, OUTPUT_CHECK, OUTPUT_DIR_SELECT, READ_FILE, WRITE_FILE } from '../constants/ipc';
import Store from 'electron-store';
import betterIpc from 'electron-better-ipc';
import cpus from 'cpus';
import parsePath from 'parse-filepath';
import filenamify from 'filenamify';
import cleanStack from 'clean-stack';
import * as SentryRenderer from '@sentry/electron/renderer';

const nodeRequire = createRequire( import.meta.url );

// Context isolation keeps Node off the page. These imports still call Electron, so they run here.
const packages = {
  'electron-store': Store,
  'electron-better-ipc': betterIpc,
  cpus,
  'parse-filepath': parsePath,
  filenamify,
  'clean-stack': cleanStack,
  '@sentry/electron/renderer': SentryRenderer,
};

const skip = new Set( ['constructor', 'caller', 'arguments', 'prototype'] );

function bind( fn, thisValue ) {
  return ( ...args ) => publish( fn.apply( thisValue, args ), 0, new WeakSet() );
}

function publish( value, depth = 0, seen = new WeakSet() ) {
  if ( value == null ) {
    return value;
  }
  const kind = typeof value;
  if ( kind === 'string' || kind === 'number' || kind === 'boolean' ) {
    return value;
  }
  let then;
  try {
    ( { then } = value );
  } catch {
    then = undefined;
  }
  if ( typeof then === 'function' || value instanceof Error ) {
    return value;
  }
  if ( Array.isArray( value ) ) {
    return value.map( ( item ) => publish( item, depth + 1, seen ) );
  }
  if ( ( kind !== 'object' && kind !== 'function' ) || depth > 3 || seen.has( value ) ) {
    return undefined;
  }
  seen.add( value );

  const out = {};
  let proto = value;
  let level = 0;
  while ( proto && proto !== Object.prototype && proto !== Function.prototype && level < 4 ) {
    for ( const key of Object.getOwnPropertyNames( proto ) ) {
      if ( skip.has( key ) || Object.prototype.hasOwnProperty.call( out, key ) ) {
        continue;
      }
      if ( level > 0 && key.startsWith( '_' ) ) {
        continue;
      }
      let prop;
      try {
        prop = value[key];
      } catch {
        continue;
      }
      const propKind = typeof prop;
      if ( propKind === 'function' ) {
        out[key] = bind( prop, value );
      } else if ( level === 0 && prop && propKind === 'object' ) {
        const child = publish( prop, depth + 1, seen );
        if ( child !== undefined ) {
          out[key] = child;
        }
      } else if ( level === 0 && ( prop == null || propKind === 'string' || propKind === 'number' || propKind === 'boolean' ) ) {
        out[key] = prop;
      }
    }
    proto = Object.getPrototypeOf( proto );
    level += 1;
  }

  if ( kind === 'function' ) {
    const proto = value.prototype;
    const methods = proto
      ? Object.getOwnPropertyNames( proto ).filter( ( key ) => key !== 'constructor' )
      : [];
    const call = methods.length
      ? ( ...args ) => publish( new value( ...args ), 0, new WeakSet() )
      : bind( value, value );
    for ( const key of Object.keys( out ) ) {
      if ( key === 'length' || key === 'name' ) {
        continue;
      }
      call[key] = out[key];
    }
    return call;
  }
  return out;
}

function load( id ) {
  if ( id === 'process' || id === 'node:process' ) {
    return {
      platform: process.platform,
      type: process.type,
      arch: process.arch,
      env: { ...process.env },
      versions: {
        electron: process.versions.electron,
        node: process.versions.node,
      },
      resourcesPath: process.resourcesPath,
      mas: process.mas === true,
      windowsStore: process.windowsStore === true,
      cwd: () => process.cwd(),
    };
  }
  if ( id === 'electron' ) {
    return nodeRequire( 'electron' );
  }
  if ( Object.prototype.hasOwnProperty.call( packages, id ) ) {
    return packages[id];
  }
  return nodeRequire( id );
}

const cache = new Map();

contextBridge.exposeInMainWorld( 'require', ( id ) => {
  if ( !cache.has( id ) ) {
    cache.set( id, publish( load( id ) ) );
  }
  return cache.get( id );
} );

contextBridge.exposeInMainWorld( 'process', publish( load( 'process' ) ) );

contextBridge.exposeInMainWorld( 'rendererBridge', {
  copyText( text ) {
    return ipcRenderer.invoke( COPY_TEXT, text );
  },
  selectAlignment( runId ) {
    return ipcRenderer.invoke( ALIGNMENT_SELECT, runId );
  },
  selectOutputDir( runId ) {
    return ipcRenderer.invoke( OUTPUT_DIR_SELECT, runId );
  },
  checkOutput( { outputDir, outputName } ) {
    return ipcRenderer.invoke( OUTPUT_CHECK, { outputDir, outputName } );
  },
  readFile( filePath ) {
    return ipcRenderer.invoke( READ_FILE, filePath );
  },
  writeFile( filePath, text ) {
    return ipcRenderer.invoke( WRITE_FILE, filePath, text );
  },
} );
