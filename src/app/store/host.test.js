// @ts-nocheck — the test is not typed yet.
import { expect, it, vi } from 'vitest';

function install( host ) {
  let reads = 0;
  const bridge = {
    parseAlignment: () => new Promise( () => {} ),
  };
  Object.defineProperty( bridge, 'host', {
    get() {
      reads += 1;
      return host;
    },
  } );
  window.rendererBridge = bridge;
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
  const run = new Run( {}, 7 );
  const alignment = new Alignment( { id: 7 }, '/data/primates.fasta' );

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
  const run = new Run( {}, 7 );
  const alignment = new Alignment( { id: 7 }, '/data/primates.fasta' );

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
  expect( new Run( {}, 7 ).modeltestName ).toBe( 'modeltest-ng-ARM64' );

  install( {
    windows: false,
    release: '25.0.0',
    arch: 'x64',
    cpuModel: 'Apple M4',
  } );
  ( { Run } = await load() );
  expect( new Run( {}, 7 ).modeltestName ).toBe( 'modeltest-ng-ARM64' );

  install( {
    windows: false,
    release: '25.0.0',
    arch: 'x64',
    cpuModel: 'Intel',
  } );
  ( { Run } = await load() );
  expect( new Run( {}, 7 ).modeltestName ).toBe( 'modeltest-ng' );
} );
