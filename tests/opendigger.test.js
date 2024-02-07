import { getOpenRank, getBusFactor } from '../controllers/opendigger';

describe('opendigger', () => {
  it.skip('openrank', async () => {
    const result = await getOpenRank('vuejs/vue');
    expect(result.error).toBeUndefined();
  });

  it.skip('busfactor', async () => {
    const result = await getBusFactor('vuejs/vue');
    expect(result.error).toBeUndefined();
  });
});
