import weekOfYear from 'dayjs/plugin/weekOfYear.js'
import dayjs from 'dayjs';
import weekYear from 'dayjs/plugin/weekYear.js'
import {getWeekOfYearStr} from "../util/weekOfYearUtil.js";

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
    it('week of year ', async () => {
        dayjs.extend(weekOfYear)
        dayjs.extend(weekYear)
        let firstDate = dayjs('2024-01-03');
        let weekOfYearStart = getWeekOfYearStr(firstDate);
        let firstDateLeft = dayjs(firstDate);
        let weekOfYearStrLeft = getWeekOfYearStr(firstDateLeft);
        while (weekOfYearStart === weekOfYearStrLeft) {
            firstDate = dayjs(firstDateLeft);
            firstDateLeft = firstDateLeft.subtract(1, 'day');
            weekOfYearStrLeft = getWeekOfYearStr(firstDateLeft);
        }
        expect(firstDate.format('YYYY-MM-DD')).toEqual('2023-12-31');
    });
});
