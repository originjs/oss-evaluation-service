import { getOpenRank, getBusFactor } from '../controllers/opendigger.js';

describe('opendigger', () => {
    it('openrank', async () => {
        const result = await getOpenRank('vuejs/vue');
        expect(result.error).toBeUndefined();
    })

    it('busfactor', async () => {
        const result = await getBusFactor('vuejs/vue');
        expect(result.error).toBeUndefined();
    })
})