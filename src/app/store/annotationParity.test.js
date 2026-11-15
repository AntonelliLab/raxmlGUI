// @ts-nocheck
// TEMPORARY (spec #118): guards the decorators -> makeObservable conversion.
// Delete this file and annotationParity.baseline.txt in the cleanup ticket.
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

const BASELINE = path.join( __dirname, 'annotationParity.baseline.txt' );
const memberName = ( key ) => key.name ?? key.value;

// Collects "Class.member" for every decorated member and every makeObservable map entry
// (including `override`). The annotation kind is deliberately not recorded.
const scan = ( file ) => {
  const ast = parse( fs.readFileSync( file, 'utf8' ), {
    sourceType: 'module',
    plugins: [
      'decorators-legacy',
      'classProperties',
      ...( /\.tsx?$/.test( file )
        ? [ 'typescript' ]
        : [] ),
    ],
  } );
  const found = [];
  const classOf = ( p ) => p.findParent( ( q ) => q.isClass() )?.node.id.name;
  traverse( ast, {
    'ClassProperty|ClassMethod'( p ) {
      if ( p.node.decorators?.length ) {
        found.push( `${classOf( p )}.${memberName( p.node.key )}` );
      }
    },
    CallExpression( p ) {
      const { callee, arguments: args } = p.node;
      if ( callee.name !== 'makeObservable' || args[1]?.type !== 'ObjectExpression' ) return;
      args[1].properties.forEach( ( prop ) => {
        if ( prop.type !== "SpreadElement" && prop.value?.value !== false ) found.push( `${classOf( p )}.${memberName( prop.key )}` );
      } );
    },
  } );
  return found;
};

const scanAll = () => fs.readdirSync( __dirname )
  .filter( ( f ) => /\.(js|ts)$/.test( f ) && !/\.test\.(js|ts)$/.test( f ) )
  .flatMap( ( f ) => scan( path.join( __dirname, f ) ) )
  .sort();

describe( 'page store annotation parity (temporary)', () => {
  it( 'matches the baseline', () => {
    const actual = [ ...new Set( scanAll() ) ];
    if ( process.env.WRITE_BASELINE ) {
      fs.writeFileSync( BASELINE, `${actual.join( '\n' )}\n` );
    }
    const baseline = fs.readFileSync( BASELINE, 'utf8' ).split( '\n' ).filter( Boolean );
    expect( actual.filter( ( m ) => !baseline.includes( m ) ) ).toEqual( [] ); // gained
    expect( baseline.filter( ( m ) => !actual.includes( m ) ) ).toEqual( [] ); // lost
  } );
} );
