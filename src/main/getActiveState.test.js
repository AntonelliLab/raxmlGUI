// @ts-nocheck — Jest globals. checkJs has no test runner types.

const mockSend = jest.fn();
const mockOn = jest.fn();
const mockRemoveListener = jest.fn();

jest.mock( 'electron', () => ( {
  ipcMain: {
    on: ( ...args ) => mockOn( ...args ),
    removeListener: ( ...args ) => mockRemoveListener( ...args ),
  },
} ) );

jest.mock( './utils/utils', () => ( {
  activeWindow: () => ( {
    webContents: { send: mockSend },
  } ),
} ) );

const { getActiveState } = require( './getActiveState' );
const { STATE_REPORT, STATE_REPORT_RESULT } = require( '../constants/ipc' );

it( 'asks the active window and resolves the matching report', async () => {
  let onResult;
  mockOn.mockImplementation( ( channel, listener ) => {
    expect( channel ).toBe( STATE_REPORT_RESULT );
    onResult = listener;
  } );

  const pending = getActiveState();
  expect( mockSend ).toHaveBeenCalledWith( STATE_REPORT, expect.any( String ) );
  const id = mockSend.mock.calls[0][1];
  onResult( {}, { id, report: { run: 1 } } );

  await expect( pending ).resolves.toEqual( { run: 1 } );
  expect( mockRemoveListener ).toHaveBeenCalledWith(
    STATE_REPORT_RESULT,
    onResult,
  );
} );
