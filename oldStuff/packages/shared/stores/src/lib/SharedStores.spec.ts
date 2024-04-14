import { sharedStores } from './SharedStores';

describe('sharedStores', () => {
  it('should work', () => {
    expect(sharedStores()).toEqual('shared-stores');
  });
});
