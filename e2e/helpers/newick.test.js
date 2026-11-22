import { describe, expect, it } from 'vitest';

const {
  parseNewick,
  getTaxa,
  compareTopologies,
  compareBranchLengths,
} = require('./newick');

describe('newick helpers', () => {
  it('parses branch lengths and lists taxa', () => {
    const tree = parseNewick('((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);');
    expect(tree.children[0].length).toBe(0.3);
    expect(tree.children[0].children[1]).toMatchObject({ name: 'B', length: 0.2 });
    expect(getTaxa('((D:1,B:1):1,(C:1,A:1):1);')).toEqual(['A', 'B', 'C', 'D']);
  });

  it('gives RF 0 for another rooting or child order', () => {
    const base = '((A,B),(C,D),(E,F));';
    expect(compareTopologies(base, '((F,E),(D,C),(B,A));')).toMatchObject({ rf: 0 });
    // rerooted on the A,B edge
    expect(compareTopologies(base, '(A,B,((C,D),(E,F)));')).toMatchObject({ rf: 0 });
    // rooted binary vs unrooted trifurcation
    expect(compareTopologies('(((A,B),C),D);', '((A,B),C,D);')).toMatchObject({ rf: 0 });
  });

  it('names the unique splits of a different topology', () => {
    expect(compareTopologies('((A,B),(C,D));', '((A,C),(B,D));')).toEqual({
      rf: 2,
      uniqueA: ['C,D'],
      uniqueB: ['B,D'],
    });
  });

  it('reports a taxa mismatch without an RF distance', () => {
    const result = compareTopologies('((A,B),(C,D));', '((A,B),(C,E));');
    expect(result).toEqual({ taxaMismatch: { onlyInA: ['D'], onlyInB: ['E'] } });
    expect(result).not.toHaveProperty('rf');
  });

  it('compares branch lengths by relative tolerance', () => {
    const a = '((A:1.0,B:2.0):0.5,(C:3.0,D:4.0):0.5);';
    expect(compareBranchLengths(a, '((A:1.005,B:2.0):0.5,(C:3.0,D:4.0):0.5);').ok).toBe(true);
    const bad = compareBranchLengths(a, '((A:1.5,B:2.0):0.5,(C:3.0,D:4.0):0.5);');
    expect(bad.ok).toBe(false);
    expect(bad.mismatches[0]).toMatch(/^A:/);
  });

  it('does not fail a near-zero branch on relative error', () => {
    const a = '((A:0.0000001,B:1):1,(C:1,D:1):1);';
    const b = '((A:0.0000003,B:1):1,(C:1,D:1):1);';
    expect(compareBranchLengths(a, b).ok).toBe(true);
  });
});
