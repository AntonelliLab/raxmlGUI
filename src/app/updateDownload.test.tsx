import { expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import Page from './index';
import store from './store';
import { installBridge } from '../test/setup';
import type { UpdateDownloadPayload } from '../common/rendererBridge';

function title() {
  return document.getElementById( 'update-download-title' )?.textContent;
}

it( 'the page follows the update download in a dialog that cannot be dismissed', () => {
  let hear: ( payload: UpdateDownloadPayload ) => void;
  installBridge( {
    onUpdateDownload( listener ) {
      hear = listener;
      return () => {};
    },
  } );
  store.listen();

  const div = document.createElement( 'div' );
  document.body.appendChild( div );
  const root = createRoot( div );
  act( () => {
    root.render( <Page /> );
  } );
  expect( title() ).toBeUndefined();

  const rows: [UpdateDownloadPayload, string, string][] = [
    [{ id: 'update', status: 'connecting' }, 'Starting…', 'Connecting to the update server…'],
    [
      { id: 'update', status: 'downloading', percent: 42 },
      '42%',
      'RAxML-GUI will quit and install when the download finishes.',
    ],
    [{ id: 'update', status: 'restarted', percent: 10 }, '10%', 'Retrying with the full download…'],
    [{ id: 'update', status: 'done' }, '100%', 'Download complete. Preparing to install…'],
  ];
  for ( const [payload, percent, status] of rows ) {
    act( () => {
      hear( payload );
    } );
    expect( title() ).toBe( 'Downloading update' );
    const dialog = document.querySelector( '[role="dialog"]' );
    expect( dialog.textContent ).toContain( percent );
    expect( dialog.textContent ).toContain( status );
    expect( dialog.querySelector( 'button' ) ).toBeNull();
  }

  act( () => {
    document.querySelector( '[role="dialog"]' ).dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape', bubbles: true } ) );
    document.querySelector<HTMLElement>( '.MuiBackdrop-root' ).click();
  } );
  expect( title() ).toBe( 'Downloading update' );

  act( () => {
    hear( { id: 'update', status: 'idle' } );
  } );
  expect( title() ).toBeUndefined();

  act( () => {
    root.unmount();
  } );
  div.remove();
} );
