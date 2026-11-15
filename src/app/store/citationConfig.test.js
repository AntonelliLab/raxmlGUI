// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { reaction, runInAction } from 'mobx';

import AppStore from './AppStore';

let listeners;
let bridge;

beforeEach( () => {
  listeners = {};
  const subscribe = ( key ) => jest.fn( ( listener ) => {
    listeners[key] = listener;
    return () => {
      delete listeners[key];
    };
  } );
  bridge = {
    getVersion: jest.fn( async () => '2.0.0' ),
    getDarkMode: jest.fn( async () => false ),
    setDarkMode: jest.fn( async () => {} ),
    copyText: jest.fn( async () => {} ),
    onLightMode: subscribe( 'light' ),
    onDarkMode: subscribe( 'dark' ),
  };
  window.rendererBridge = bridge;
} );

async function settle() {
  await Promise.all( bridge.getDarkMode.mock.results.map( ( r ) => r.value ) );
}

function track( expression ) {
  const seen = [];
  const stop = reaction( expression, ( value ) => seen.push( value ) );
  return { seen, stop };
}

describe( 'citation', () => {
  it( 'offers plain text, RIS and BibTeX, plain text first', () => {
    const { citation } = new AppStore();
    expect( citation.formats.map( ( f ) => f.value ) ).toEqual( ['txt', 'ris', 'bib'] );
    expect( citation.format ).toBe( 'txt' );
  } );

  it( 'plain text format text', () => {
    const { citation } = new AppStore();
    const lines = citation.allText.split( '\n' );
    expect( lines ).toHaveLength( 4 );
    expect( lines[0] ).toBe( 'Edler, D, Klein, J, Antonelli, A, Silvestro, D. raxmlGUI 2.0: A graphical interface and toolkit for phylogenetic analyses using RAxML. Methods Ecol Evol. 2021; 12: 373– 377. https://doi.org/10.1111/2041-210X.13512' );
    expect( lines[1] ).toMatch( /^Alexandros Stamatakis, RAxML version 8: .*btu033$/ );
    expect( lines[2] ).toMatch( /^Alexey M Kozlov, .*RAxML-NG: .*btz305$/ );
    expect( lines[3] ).toMatch( /^Diego Darriba, .*ModelTest-NG: .*msz189$/ );
  } );

  it( 'RIS format text', () => {
    const { citation } = new AppStore();
    citation.setFormat( 'ris' );
    const text = citation.allText;
    expect( text.match( /^TY {2}- JOUR$/gm ) ).toHaveLength( 4 );
    expect( text.match( /^ER {2}- ?$/gm ) ).toHaveLength( 4 );
    expect( text.startsWith( '\nTY  - JOUR\nT1  - raxmlGUI 2.0:' ) ).toBe( true );
    for ( const doi of ['10.1111/2041-210X.13512', '10.1093/bioinformatics/btu033', '10.1093/bioinformatics/btz305', '10.1093/molbev/msz189'] ) {
      expect( text ).toContain( `UR  - https://doi.org/${doi}` );
    }
    expect( text ).not.toContain( '@article' );
  } );

  it( 'BibTeX format text', () => {
    const { citation } = new AppStore();
    citation.setFormat( 'bib' );
    const text = citation.allText;
    expect( text.match( /@article\{/g ) ).toHaveLength( 4 );
    expect( text.startsWith( '@article{https://doi.org/10.1111/2041-210X.13512,\nauthor = {Edler, Daniel' ) ).toBe( true );
    expect( text ).toContain( '@article{10.1093/bioinformatics/btu033,' );
    expect( text ).toContain( '@article{10.1093/bioinformatics/btz305,' );
    expect( text.endsWith( 'eprint = {https://academic.oup.com/mbe/article-pdf/37/1/291/32085561/msz189.pdf},\n}' ) ).toBe( true );
    expect( text ).not.toContain( 'TY  - JOUR' );
  } );

  it( 'allText follows format, set by action or directly', () => {
    const { citation } = new AppStore();
    const { seen, stop } = track( () => citation.allText );

    citation.setFormat( 'bib' );
    runInAction( () => {
      citation.format = 'ris';
    } );
    stop();

    expect( seen ).toHaveLength( 2 );
    expect( seen[0] ).toContain( '@article{' );
    expect( seen[1] ).toContain( 'TY  - JOUR' );
  } );

  it( 'show and hide switch visibility, and a reaction sees it', () => {
    const { citation } = new AppStore();
    expect( citation.visible ).toBe( false );
    const { seen, stop } = track( () => citation.visible );

    citation.show();
    expect( citation.visible ).toBe( true );
    citation.hide();
    expect( citation.visible ).toBe( false );
    runInAction( () => {
      citation.visible = true;
    } );
    stop();

    expect( seen ).toEqual( [true, false, true] );
  } );

  it( 'copyToClipboard copies the text in the current format', async () => {
    jest.spyOn( console, 'log' ).mockImplementation( () => {} );
    const { citation } = new AppStore();
    citation.setFormat( 'bib' );
    await citation.copyToClipboard();
    expect( bridge.copyText ).toHaveBeenCalledWith( citation.allText );
    expect( bridge.copyText.mock.calls[0][0] ).toContain( '@article{' );
  } );
} );

describe( 'config dark mode', () => {
  it( 'starts light and loads dark mode from the renderer bridge', async () => {
    bridge.getDarkMode.mockImplementation( async () => 1 );
    const { config } = new AppStore();
    expect( config.isDarkMode ).toBe( false );
    await settle();
    expect( config.isDarkMode ).toBe( true );
  } );

  it( 'a falsy loaded value stays light', async () => {
    bridge.getDarkMode.mockImplementation( async () => undefined );
    const { config } = new AppStore();
    await settle();
    expect( config.isDarkMode ).toBe( false );
  } );

  it( 'setDarkMode switches the theme and tells the bridge, as a boolean', async () => {
    const { config } = new AppStore();
    await settle();
    const { seen, stop } = track( () => config.isDarkMode );

    config.setDarkMode( 'yes' );
    expect( config.isDarkMode ).toBe( true );
    config.setDarkMode( 0 );
    expect( config.isDarkMode ).toBe( false );
    runInAction( () => {
      config.isDarkMode = true;
    } );
    stop();

    expect( seen ).toEqual( [true, false, true] );
    expect( bridge.setDarkMode.mock.calls ).toEqual( [[true], [false]] );
  } );

  it( 'dark and light menu events switch the theme', async () => {
    const { config } = new AppStore();
    await settle();

    listeners.dark();
    expect( config.isDarkMode ).toBe( true );
    listeners.light();
    expect( config.isDarkMode ).toBe( false );
    expect( bridge.setDarkMode.mock.calls ).toEqual( [[true], [false]] );
  } );

  it( 'dispose stops listening for menu events', async () => {
    const { config } = new AppStore();
    await settle();
    expect( Object.keys( listeners ).sort() ).toEqual( ['dark', 'light'] );

    config.dispose();
    expect( listeners ).toEqual( {} );
  } );
} );
