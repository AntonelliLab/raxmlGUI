import { expect, it, vi } from 'vitest';

import type { HostInfo } from '../../common/rendererBridge';
import { installBridge } from '../../test/setup';

import type Alignment from './Alignment';
import type Run from './Run';

// The run and the alignment read only the host here, so their owners are empty stand-ins.
type RunParent = ConstructorParameters<typeof Run>[0];
type AlignmentOwner = ConstructorParameters<typeof Alignment>[0];

function install( host: HostInfo ) {
  let reads = 0;
  const bridge = {
    parseAlignment: () => new Promise<never>( () => {} ),
  };
  // A getter counts the reads; installBridge copies it without reading it.
  Object.defineProperty( bridge, 'host', {
    configurable: true,
    enumerable: true,
    get() {
      reads += 1;
      return host;
    },
  } );
  installBridge( bridge );
  return () => reads;
}

async function load() {
  vi.resetModules();
  const Run = ( await import( './Run' ) ).default;
  const Alignment = ( await import( './Alignment' ) ).default;
  return { Run, Alignment };
}

it( 'reads the host once and uses it for Windows 7', async () => {
  const reads = install( {
    windows: true,
    release: '6.1.7601',
    arch: 'x64',
    cpuModel: 'Intel',
  } );
  const { Run, Alignment } = await load();
  const run = new Run( {} as RunParent, 7 );
  const alignment = new Alignment( { id: 7 } as AlignmentOwner, '/data/primates.fasta' );

  expect( reads() ).toBe( 1 );
  expect( run.binary.options.map( ( option ) => option.value ) ).toContain( 'raxmlHPC_Win7.exe' );
  expect( run.binary.options.map( ( option ) => option.value ) ).not.toContain( 'raxml-ng' );
  expect( alignment.modeltestDisabled ).toBe( true );
} );

it( 'uses the later Windows binaries when the release is not 6.1', async () => {
  install( {
    windows: true,
    release: '10.0.19045',
    arch: 'x64',
    cpuModel: 'Intel',
  } );
  const { Run, Alignment } = await load();
  const run = new Run( {} as RunParent, 7 );
  const alignment = new Alignment( { id: 7 } as AlignmentOwner, '/data/primates.fasta' );

  expect( run.binary.options.map( ( option ) => option.value ) ).toContain( 'raxmlHPC.exe' );
  expect( run.binary.options.map( ( option ) => option.value ) ).not.toContain( 'raxmlHPC_Win7.exe' );
  expect( alignment.modeltestDisabled ).toBe( false );
} );

it( 'picks the arm modeltest binary from the arch or the cpu model', async () => {
  install( {
    windows: false,
    release: '25.0.0',
    arch: 'arm64',
    cpuModel: 'Intel',
  } );
  let { Run } = await load();
  expect( new Run( {} as RunParent, 7 ).modeltestName ).toBe( 'modeltest-ng-ARM64' );

  install( {
    windows: false,
    release: '25.0.0',
    arch: 'x64',
    cpuModel: 'Apple M4',
  } );
  ( { Run } = await load() );
  expect( new Run( {} as RunParent, 7 ).modeltestName ).toBe( 'modeltest-ng-ARM64' );

  install( {
    windows: false,
    release: '25.0.0',
    arch: 'x64',
    cpuModel: 'Intel',
  } );
  ( { Run } = await load() );
  expect( new Run( {} as RunParent, 7 ).modeltestName ).toBe( 'modeltest-ng' );
} );
