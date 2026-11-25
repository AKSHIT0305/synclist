import { summariseTap } from '../../scripts/tap';

describe('summariseTap', () => {
  it('counts passes and collects failures with their diagnostics', () => {
    const summary = summariseTap([
      'ok 1 - viewer sees the list',
      'not ok 2 - viewer cannot create tasks',
      '# Failed test 2: "viewer cannot create tasks"',
      '#       caught: no exception',
      'ok 3 - owner can edit the list',
    ]);
    expect(summary.passed).toBe(2);
    expect(summary.failed).toEqual([
      'not ok 2 - viewer cannot create tasks',
      '  # Failed test 2: "viewer cannot create tasks"',
      '  #       caught: no exception',
    ]);
    expect(summary.problems).toEqual([]);
  });

  it('reports plan problems from finish()', () => {
    const summary = summariseTap(['ok 1 - a', '# Looks like you failed 1 test of 2']);
    expect(summary.problems).toEqual(['# Looks like you failed 1 test of 2']);
  });

  it('treats a file with no TAP output as a problem', () => {
    expect(summariseTap(['', 'some other output']).problems).toHaveLength(1);
  });
});
