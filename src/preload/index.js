import { createRequire } from 'node:module';
import os from 'node:os';
import { contextBridge, ipcRenderer, webUtils } from 'electron';
import {
  ADD_RUN,
  ALIGNMENT_MODEL_SELECTION_FAILURE,
  ALIGNMENT_MODEL_SELECTION_REQUEST,
  ALIGNMENT_MODEL_SELECTION_SUCCESS,
  ALIGNMENT_PARSE,
  ALIGNMENT_SELECT,
  ASTRAL_FILE_SELECT,
  COPY_TEXT,
  DARK_MODE,
  FILE_SHOW_IN_FOLDER,
  LIGHT_MODE,
  OPEN_PATH,
  OUTPUT_CHECK,
  OUTPUT_DIR_SELECT,
  PARTITION_FILE_SELECT,
  READ_FILE,
  REMOVE_RUN,
  RUN_ERROR,
  RUN_FINISHED,
  RUN_START,
  RUN_STDERR,
  RUN_STDOUT,
  TOGGLE_BACKBONE_CONSTRAINT,
  TOGGLE_MULTIFURCATING_CONSTRAINT,
  TREE_SELECT,
  WRITE_FILE,
} from '../constants/ipc';
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

function onEvent( channel, listener ) {
  const wrapped = ( _event, payload ) => listener( payload );
  ipcRenderer.on( channel, wrapped );
  return () => ipcRenderer.removeListener( channel, wrapped );
}

const cpu = os.cpus()[0];
const host = {
  windows: process.platform === 'win32',
  release: os.release(),
  arch: os.arch(),
  cpuModel: cpu.model,
};

contextBridge.exposeInMainWorld( 'rendererBridge', {
  host,
  copyText( text ) {
    return ipcRenderer.invoke( COPY_TEXT, text );
  },
  selectAlignment( runId ) {
    return ipcRenderer.invoke( ALIGNMENT_SELECT, runId );
  },
  parseAlignment( id, filePath ) {
    return ipcRenderer.invoke( ALIGNMENT_PARSE, id, filePath );
  },
  selectAstralFile( runId ) {
    return ipcRenderer.invoke( ASTRAL_FILE_SELECT, runId );
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
  openPath( fullPath ) {
    return ipcRenderer.invoke( OPEN_PATH, fullPath );
  },
  selectPartitionFile( runId ) {
    return ipcRenderer.invoke( PARTITION_FILE_SELECT, runId );
  },
  selectTree( runId, type ) {
    return ipcRenderer.invoke( TREE_SELECT, runId, type );
  },
  showItemInFolder( fullPath ) {
    return ipcRenderer.invoke( FILE_SHOW_IN_FOLDER, fullPath );
  },
  startRun( payload ) {
    return ipcRenderer.invoke( RUN_START, payload );
  },
  onRunStdout( listener ) {
    return onEvent( RUN_STDOUT, listener );
  },
  onRunStderr( listener ) {
    return onEvent( RUN_STDERR, listener );
  },
  onRunFinished( listener ) {
    return onEvent( RUN_FINISHED, listener );
  },
  onRunError( listener ) {
    return onEvent( RUN_ERROR, listener );
  },
  startModelSelection( payload ) {
    return ipcRenderer.invoke( ALIGNMENT_MODEL_SELECTION_REQUEST, payload );
  },
  onModelSelectionSuccess( listener ) {
    return onEvent( ALIGNMENT_MODEL_SELECTION_SUCCESS, listener );
  },
  onModelSelectionFailure( listener ) {
    return onEvent( ALIGNMENT_MODEL_SELECTION_FAILURE, listener );
  },
  onAddRun( listener ) {
    return onEvent( ADD_RUN, listener );
  },
  onRemoveRun( listener ) {
    return onEvent( REMOVE_RUN, listener );
  },
  onLightMode( listener ) {
    return onEvent( LIGHT_MODE, listener );
  },
  onDarkMode( listener ) {
    return onEvent( DARK_MODE, listener );
  },
  onToggleBackboneConstraint( listener ) {
    return onEvent( TOGGLE_BACKBONE_CONSTRAINT, listener );
  },
  onToggleMultifurcatingConstraint( listener ) {
    return onEvent( TOGGLE_MULTIFURCATING_CONSTRAINT, listener );
  },
  getPathForFile( file ) {
    return webUtils.getPathForFile( file );
  },
} );
