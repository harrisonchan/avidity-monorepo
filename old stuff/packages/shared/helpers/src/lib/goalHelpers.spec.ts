import { generateGoalId } from './goalHelpers';

describe('generateGoalId', () => {
  it(`should generate goal id`, () => {
    expect(generateGoalId('hello world', '2020-01-01')).toEqual('123');
  });
});
