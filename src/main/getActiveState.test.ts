import { expect, it, vi } from 'vitest';

const { mockSend, mockOn, mockRemoveListener } = vi.hoisted( () => ( {
  mockSend: vi.fn(),
  mockOn: vi.fn(),
  mockRemoveListener: vi.fn(),
} ) );

vi.mock( 'electron', () => ( {
  ipcMain: {
    on: ( ...args: unknown[] ) => mockOn( ...args ),
    removeListener: ( ...args: unknown[] ) => mockRemoveListener( ...args ),
  },
} ) );

vi.mock( './utils/utils', () => ( {
  activeWindow: () => ( {
    webContents: { send: mockSend },
  } ),
} ) );

const { getActiveState } = await import( './getActiveState' );
const { STATE_REPORT, STATE_REPORT_RESULT } = await import( '../constants/ipc' );

it( 'asks the active window and resolves the matching report', async () => {
  let onResult: ( event: unknown, payload: unknown ) => void;
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
