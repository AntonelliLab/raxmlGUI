// @ts-nocheck — Jest globals. checkJs has no test runner types.
import { autorun, runInAction } from 'mobx';
import * as yup from 'yup';

import Option from './Option';

const positive = () => new Option( null, 2, 'Count', 'desc', 'hover', {
  schema: yup.number().positive(),
} );

it( 'starts at the default value', () => {
  const option = positive();
  expect( option.value ).toBe( 2 );
  expect( option.isDefault ).toBe( true );
  expect( option.error ).toBeNull();
  expect( option.haveError ).toBe( false );
  expect( option.errorMessage ).toBe( '' );
} );

it( 'sets a value, casting it through the schema', () => {
  const option = positive();
  option.setValue( '5' );
  expect( option.value ).toBe( 5 );
  expect( option.isDefault ).toBe( false );
} );

it( 'keeps an invalid value as given and reports its error', () => {
  const option = positive();
  option.setValue( -1 );
  expect( option.value ).toBe( -1 );
  expect( option.error ).toBeInstanceOf( yup.ValidationError );
  expect( option.haveError ).toBe( true );
  expect( option.errorMessage ).toBe( option.error.message );
  expect( option.errorMessage ).not.toBe( '' );
} );

it( 'ignores an invalid value when only valid changes are allowed', () => {
  const option = new Option( null, 'a', 'Name', 'desc', 'hover', {
    schema: yup.string().max( 3 ),
    allowOnlyValidChange: true,
  } );
  option.setValue( 'toolong' );
  expect( option.value ).toBe( 'a' );
  option.setValue( 'abc' );
  expect( option.value ).toBe( 'abc' );
} );

it( 'accepts any value without a schema', () => {
  const option = new Option( null, 'x', 'Title', 'desc', 'hover' );
  option.setValue( 42 );
  expect( option.value ).toBe( 42 );
  expect( option.error ).toBeNull();
  expect( option.helperText ).toBe( '' );
} );

it( 'resets to the default value', () => {
  const option = positive();
  option.setValue( -1 );
  option.reset();
  expect( option.value ).toBe( 2 );
  expect( option.isDefault ).toBe( true );
  expect( option.haveError ).toBe( false );
} );

it( 'updates computeds and reactions when value changes', () => {
  const option = positive();
  const seen = [];
  const dispose = autorun( () => {
    seen.push( [option.isDefault, option.errorMessage === ''] );
  } );
  runInAction( () => {
    option.value = -3;
  } );
  runInAction( () => {
    option.value = 2;
  } );
  dispose();
  expect( seen ).toEqual( [
    [true, true],
    [false, false],
    [true, true],
  ] );
} );
