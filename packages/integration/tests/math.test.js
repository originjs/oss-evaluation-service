import { QUANTILE_AT_VALUE } from '../util/math';

describe('math', () => {
  it('QUANTILE_AT_VALUE', async () => {
    const param = {
      median: 1.37,
      p10: 1.09,
    };
    let result = QUANTILE_AT_VALUE(param, 1.24);
    expect(result).toEqual(0.7118654380958638);

    result = QUANTILE_AT_VALUE(param, 1.09);
    expect(result).toEqual(0.8999999314038524);

    result = QUANTILE_AT_VALUE(param, 1.37);
    expect(result).toEqual(0.4999999995);
  });
});
