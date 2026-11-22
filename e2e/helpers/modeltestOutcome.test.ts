import { describe, expect, it } from 'vitest';

import { parseModelTestLog } from './modeltestOutcome';
import { compareOutcome, formatReport } from './fixtures';

const log = `--------------------------------------------------------------------------------
ModelTest-NG v0.1.7

Input data:
  MSA:        /Users/someone/static/example-files/fasta/nucleotide.txt
  #taxa:            18

Output:
  Log:           /Users/someone/out.log
  Results:       /Users/someone/out.out

Additional options:
  threads:          2/10
  RNG seed:         12345

BIC       model              K            lnL          score          delta    weight
--------------------------------------------------------------------------------
       1  TPM2uf+I           6     -1192.3928      2639.0324         0.0000    0.6626
--------------------------------------------------------------------------------
Best model according to BIC
---------------------------
Model:              TPM2uf+I
lnL:                -1192.3928
Frequencies:        0.3367 0.1353 0.1500 0.3780
Score:              2639.0324
Weight:             0.6626
---------------------------

Commands:
  > raxml-ng --msa /Users/someone/nucleotide.txt --model TPM2uf+I

AICc      model              K            lnL          score          delta    weight
--------------------------------------------------------------------------------
Best model according to AICc
---------------------------
Model:              TVM+I
lnL:                -1189.0349
Score:              2465.0698
Weight:             0.2654
---------------------------
Done
`;

describe('parseModelTestLog', () => {
  it('keeps version, model and score per criterion and drops the rest', () => {
    expect(parseModelTestLog(log)).toEqual({
      binaryVersions: { 'modeltest-ng': '0.1.7' },
      criteria: {
        BIC: { model: 'TPM2uf+I', score: 2639.0324 },
        AICc: { model: 'TVM+I', score: 2465.0698 },
      },
    });
  });

  it('throws on a log with no result block', () => {
    expect(() => parseModelTestLog('ModelTest-NG v0.1.7\n')).toThrow(/Best model/);
  });
});

describe('failure report', () => {
  const expected = {
    binaryVersions: { 'modeltest-ng': '0.1.7' },
    criteria: { AICc: { model: 'TVM+I', score: 2465.0698 } },
  };

  it('accepts a score inside the relative tolerance', () => {
    const actual = { ...expected, criteria: { AICc: { model: 'TVM+I', score: 2465.2 } } };
    expect(compareOutcome(expected, actual)).toEqual([]);
  });

  it('lists the binary version first, one block per field, then fixture and command', () => {
    const actual = {
      binaryVersions: { 'modeltest-ng': '0.1.8' },
      criteria: { AICc: { model: 'GTR+I', score: 2500 } },
    };
    const diffs = compareOutcome(expected, actual);
    expect(diffs[0].field).toBe('binaryVersions.modeltest-ng');
    expect(formatReport(diffs, '/fx/modeltest.json')).toBe(
      [
        'binaryVersions.modeltest-ng\n  expected:  0.1.7\n  actual:    0.1.8\n  delta:     n/a\n  tolerance: exact',
        'criteria.AICc.model\n  expected:  TVM+I\n  actual:    GTR+I\n  delta:     n/a\n  tolerance: exact',
        'criteria.AICc.score\n  expected:  2465.0698\n  actual:    2500\n  delta:     34.9302\n  tolerance: 0.0001 relative',
      ].join('\n\n') +
        '\n\nFixture: /fx/modeltest.json\nRegenerate: yarn test:e2e:update-fixtures',
    );
  });
});

describe('tree comparison', () => {
  const tree = '((A:0.1,B:0.2):0.05,C:0.3,D:0.4);';
  const expected = { bestTree: tree };

  it('accepts branch lengths inside 1e-3 relative', () => {
    const actual = { bestTree: '((A:0.1,B:0.2):0.05,C:0.3,D:0.4001);' };
    expect(compareOutcome(expected, actual)).toEqual([]);
  });

  it('reports the RF distance and the unique splits for a changed topology', () => {
    const actual = { bestTree: '((A:0.1,C:0.3):0.05,B:0.2,D:0.4);' };
    const [diff] = compareOutcome(expected, actual);
    expect(diff.field).toBe('bestTree topology');
    expect(diff.delta).toBe(2);
    expect(diff.actual).toContain('splits unique to fixture: C,D');
    expect(diff.actual).toContain('splits unique to actual:  B,D');
  });

  it('reports expected, actual, delta and tolerance for a branch length', () => {
    const actual = { bestTree: '((A:0.1,B:0.2):0.05,C:0.3,D:0.5);' };
    expect(compareOutcome(expected, actual)).toEqual([
      {
        field: 'bestTree branch D',
        expected: 0.4,
        actual: 0.5,
        delta: 0.1,
        tolerance: '0.001 relative',
      },
    ]);
  });
});
