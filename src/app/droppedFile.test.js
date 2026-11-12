// @ts-nocheck — Jest globals. checkJs has no test runner types.
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import Input from './Input';

const openTree = { notAvailable: false, haveFile: false };
const closedTree = { notAvailable: true, haveFile: false };

function baseRun( extra ) {
  return {
    hasAstralTree: false,
    inputIsAlignment: false,
    inputIsTree: false,
    alignments: [],
    canLoadAlignment: false,
    haveAlignments: false,
    canLoadPartitionFile: false,
    canLoadAstralTree: false,
    tree: closedTree,
    backboneConstraint: closedTree,
    multifurcatingConstraint: closedTree,
    addAlignments: jest.fn(),
    addPartitionFiles: jest.fn(),
    addTreeFiles: jest.fn(),
    addAstralFiles: jest.fn(),
    loadAlignmentFiles() {},
    loadAstralTree() {},
    loadPartitionFile() {},
    loadTreeFile() {},
    loadBackboneConstraintFile() {},
    loadMultifurcatingConstraintFile() {},
    ...extra,
  };
}

function mountInput( run ) {
  const div = document.createElement( 'div' );
  const root = createRoot( div );
  // createRoot().render paints on a later tick. act flushes that paint.
  // eslint-disable-next-line testing-library/no-unnecessary-act
  act( () => {
    root.render(
      <ThemeProvider theme={theme.light}>
        <Input run={run} />
      </ThemeProvider>,
    );
  } );
  return { div, root };
}

function button( div, text ) {
  return [...div.querySelectorAll( 'button' )].find( ( node ) => node.textContent.trim() === text );
}

async function drop( target, name ) {
  const input = target.closest( '[role="presentation"]' ).querySelector( 'input[type="file"]' );
  const file = new File( ['x'], name );
  Object.defineProperty( input, 'files', {
    configurable: true,
    value: [file],
  } );
  await act( async () => {
    input.dispatchEvent( new Event( 'change', { bubbles: true } ) );
  } );
}

it( 'each drop target keeps the dropped file path', async () => {
  window.rendererBridge = {
    getPathForFile( file ) {
      return {
        'primates.fasta': '/tmp/drop-1',
        'trees.tre': '/tmp/drop-2',
        'start.nwk': '/tmp/drop-3',
        'backbone.nwk': '/tmp/drop-4',
        'multi.nwk': '/tmp/drop-5',
        'cats.fasta': '/tmp/drop-6',
        'dogs.fasta': '/tmp/drop-7',
        'genes.part': '/tmp/drop-8',
      }[file.name];
    },
  };

  const first = baseRun( {
    canLoadAlignment: true,
    canLoadAstralTree: true,
    tree: openTree,
    backboneConstraint: openTree,
    multifurcatingConstraint: openTree,
  } );
  const firstView = mountInput( first );
  await drop( button( firstView.div, 'Load alignment' ), 'primates.fasta' );
  await drop( button( firstView.div, 'Load input trees' ), 'trees.tre' );
  await drop( button( firstView.div, 'Add Tree' ), 'start.nwk' );
  await drop( button( firstView.div, 'Add Backbone Constraint' ), 'backbone.nwk' );
  await drop( button( firstView.div, 'Add Multifurcating Constraint' ), 'multi.nwk' );
  expect( first.addAlignments ).toHaveBeenCalledWith( [{ path: '/tmp/drop-1' }] );
  expect( first.addAstralFiles ).toHaveBeenCalledWith( { path: '/tmp/drop-2' } );
  expect( first.addTreeFiles ).toHaveBeenCalledWith( 'tree', [{ path: '/tmp/drop-3' }] );
  expect( first.addTreeFiles ).toHaveBeenCalledWith( 'backboneConstraint', [{ path: '/tmp/drop-4' }] );
  expect( first.addTreeFiles ).toHaveBeenCalledWith( 'multifurcatingConstraint', [{ path: '/tmp/drop-5' }] );
  act( () => firstView.root.unmount() );

  const second = baseRun( {
    canLoadAlignment: true,
    haveAlignments: true,
  } );
  const secondView = mountInput( second );
  await drop(
    secondView.div.querySelector( 'button[title="Concatenate new alignments and create partition"]' ),
    'cats.fasta',
  );
  expect( second.addAlignments ).toHaveBeenCalledWith( [{ path: '/tmp/drop-6' }] );
  act( () => secondView.root.unmount() );

  const third = baseRun( {
    canLoadAlignment: true,
    haveAlignments: true,
    canLoadPartitionFile: true,
  } );
  const thirdView = mountInput( third );
  await drop(
    thirdView.div.querySelector( 'button[title="Concatenate new alignments and automatically generate a partition"]' ),
    'dogs.fasta',
  );
  await drop( button( thirdView.div, 'Load partition' ), 'genes.part' );
  expect( third.addAlignments ).toHaveBeenCalledWith( [{ path: '/tmp/drop-7' }] );
  expect( third.addPartitionFiles ).toHaveBeenCalledWith( [{ path: '/tmp/drop-8' }] );
  act( () => thirdView.root.unmount() );
} );
