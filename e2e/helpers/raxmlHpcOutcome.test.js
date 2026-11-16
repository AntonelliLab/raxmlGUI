const { parseRaxmlHpcOutput } = require('./raxmlHpcOutcome');

const info = `

This is RAxML version 8.2.12 released by Alexandros Stamatakis on May 2018.

Substitution Matrix: GTR

RAxML was called as follows:

/bin/Mac/raxmlHPC -f d -m GTRCATIX -N 1 -p 12345 -n out.tre -s /a/nucleotide.txt -w /out

Inference[0] final GAMMA-based Likelihood: -1183.449461 tree written to file /out/RAxML_result.out.tre

Final GAMMA-based Score of best tree -1183.120275

Overall execution time: 0.113251 secs or 0.000031 hours or 0.000001 days
`;

describe('parseRaxmlHpcOutput', () => {
  it('keeps version, model, final score and the trimmed best tree', () => {
    expect(
      parseRaxmlHpcOutput({ info, bestTree: '(A:0.1,B:0.2,C:0.3):0.0;\n' }),
    ).toEqual({
      binaryVersions: { raxmlHPC: '8.2.12' },
      model: 'GTRCATIX',
      score: -1183.120275,
      bestTree: '(A:0.1,B:0.2,C:0.3):0.0;',
    });
  });

  it('throws on an info file with no final score', () => {
    expect(() =>
      parseRaxmlHpcOutput({ info: info.replace(/^Final.*$/m, ''), bestTree: '' }),
    ).toThrow(/Final GAMMA-based Score/);
  });
});
