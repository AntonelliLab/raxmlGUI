const { parseRaxmlNgOutput } = require('./raxmlNgOutcome');

const log = `RAxML-NG v. 1.2.2 released on 30.04.2024 by The Exelixis Lab.

Partition 0: noname
Model: TVM+FO+I
Alignment sites / patterns: 678 / 43

Final LogLikelihood: -1184.201009

AIC score: 2450.402017 / AICc score: 2455.817112 / BIC score: 2635.687056
`;

describe('parseRaxmlNgOutput', () => {
  it('keeps version, model, final log-likelihood and the trimmed best tree', () => {
    expect(
      parseRaxmlNgOutput({ log, bestTree: '(A:0.1,B:0.2,C:0.3);\n' }),
    ).toEqual({
      binaryVersions: { 'raxml-ng': '1.2.2' },
      model: 'TVM+FO+I',
      logLikelihood: -1184.201009,
      bestTree: '(A:0.1,B:0.2,C:0.3);',
    });
  });

  it('throws on a log with no final log-likelihood', () => {
    expect(() =>
      parseRaxmlNgOutput({ log: log.replace(/^Final.*$/m, ''), bestTree: '' }),
    ).toThrow(/Final LogLikelihood/);
  });
});
