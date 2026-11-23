import { expect, it } from 'vitest';
import { githubIssueTitle } from './githubIssue';

it( 'githubIssueTitle uses the first message line and cuts a long title', () => {
  expect( githubIssueTitle( new Error( 'boom\nsecond line' ) ) ).toBe( 'Error: boom' );
  const title = githubIssueTitle( new Error( 'x'.repeat( 200 ) ) );
  expect( title ).toHaveLength( 100 );
  expect( title.startsWith( 'Error: xxx' ) ).toBe( true );
  expect( githubIssueTitle( new Error( '' ) ) ).toBe( 'Error' );
} );
