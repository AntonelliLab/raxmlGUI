// @ts-nocheck — Jest globals. checkJs has no test runner types.
import Run from './Run';

it( 'writes one concatenated FASTA', async () => {
  const run = new Run( {}, 7 );
  window.rendererBridge = { parseAlignment: () => new Promise( () => {} ) };
  run.addAlignments( [
    { path: '/data/a.fasta' },
    { path: '/data/b.fasta' },
  ] );
  run.alignments[0].sequences = [
    { taxon: 'Homo', code: 'AT' },
    { taxon: 'Mus', code: 'GC' },
  ];
  run.alignments[0].length = 2;
  run.alignments[1].sequences = [
    { taxon: 'Homo', code: 'TT' },
    { taxon: 'Mus', code: 'AA' },
  ];
  run.alignments[1].length = 2;
  const writeFile = jest.fn( async () => {} );
  window.rendererBridge = { writeFile };

  await run.finalAlignment.writeConcatenatedAlignment();

  expect( writeFile ).toHaveBeenCalledTimes( 1 );
  expect( writeFile ).toHaveBeenCalledWith(
    run.finalAlignment.path,
    '>Homo\nATTT\n>Mus\nGCAA',
  );
} );
