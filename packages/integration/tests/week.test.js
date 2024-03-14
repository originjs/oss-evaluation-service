import dayjs from 'dayjs';
import { getWeekOfYearList } from '../util/weekOfYearUtil.js';

describe('week of month', () => {
  it('get day of current week', async () => {
    const current = dayjs('2024-02-08 19:18');
    // start of current week
    let weekStart = current.startOf('week').format('YYYY-MM-DD');
    expect(weekStart).toEqual('2024-02-04');
    // end of current week
    let weekEnd = current.endOf('week').format('YYYY-MM-DD');
    expect(weekEnd).toEqual('2024-02-10');

    // start of last week
    weekStart = current.subtract(1, 'week').startOf('week').format('YYYY-MM-DD');
    expect(weekStart).toEqual('2024-01-28');
    // end of last week
    weekEnd = current.subtract(1, 'week').endOf('week').format('YYYY-MM-DD');
    expect(weekEnd).toEqual('2024-02-03');
  });
  it('week of year', async () => {
    let result = getWeekOfYearList('2024-01-01', '2024-01-07');
    expect(result).toEqual([
      {
        end: '2024-01-06',
        start: '2023-12-31',
        weekOfYear: '2024-01',
      },
      {
        end: '2024-01-13',
        start: '2024-01-07',
        weekOfYear: '2024-02',
      },
    ]);

    result = getWeekOfYearList('2023-12-31', '2024-01-06');
    expect(result).toEqual([
      {
        end: '2024-01-06',
        start: '2023-12-31',
        weekOfYear: '2024-01',
      },
    ]);

    result = getWeekOfYearList('2023-12-31', '2023-12-31');
    expect(result).toEqual([
      {
        end: '2024-01-06',
        start: '2023-12-31',
        weekOfYear: '2024-01',
      },
    ]);

    result = getWeekOfYearList('2024-01-06', '2024-01-06');
    expect(result).toEqual([
      {
        end: '2024-01-06',
        start: '2023-12-31',
        weekOfYear: '2024-01',
      },
    ]);

    result = getWeekOfYearList('2024-01-06', '2024-01-07');
    expect(result).toEqual([
      {
        end: '2024-01-06',
        start: '2023-12-31',
        weekOfYear: '2024-01',
      },
      {
        end: '2024-01-13',
        start: '2024-01-07',
        weekOfYear: '2024-02',
      },
    ]);

    result = getWeekOfYearList('2024-02-24', '2024-02-24');
    expect(result).toEqual([
      {
        end: '2024-02-24',
        start: '2024-02-18',
        weekOfYear: '2024-08',
      },
    ]);
  });
});
